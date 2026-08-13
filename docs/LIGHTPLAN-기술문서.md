# LIGHTPLAN 기술 문서

실내 조명 프리비주얼 도구의 인수인계 문서. 다른 PC에서 이어서 작업할 수 있도록 좌표계, 측광 모델, 상수, 코드 구조, 검증 방법을 정리한다.

- **대상 파일**: `lightplan-v3.html` (단일 파일, 약 84KB)
- **외부 의존성**: three.js r128 (cdnjs CDN 1개), 그 외 없음
- **실행**: 브라우저에서 파일을 그대로 열면 된다. 로컬 서버 불필요.

---

## 1. 개발 환경

### 편집
텍스트 에디터 하나면 된다. 빌드 단계 없음. 파일 내부 구조는 아래 순서다.

```
<style>          UI 스타일
<body>           사이드바(2단계) + 뷰포트 + 미터 + 모달 2개
<script src>     three.js r128 (cdnjs)
<script>         전체 로직 (단일 IIFE)
```

### 인터넷이 막힌 환경
three.js CDN이 안 열리면 아무것도 안 뜬다. `three.min.js` r128을 받아 같은 폴더에 두고 script 태그의 src를 상대경로로 바꾸면 완전 오프라인으로 돌아간다.

### 브라우저 없이 검증 (중요)

렌더링 없이 계산 로직만 Node에서 돌릴 수 있다. 프리셋 튜닝과 회귀 테스트를 이걸로 했다.

```bash
npm install jsdom three@0.128.0
```

```js
// harness.js
const fs=require('fs'), {JSDOM}=require('jsdom'), THREE=require('three');
const html=fs.readFileSync('lightplan-v3.html','utf8')
  .replace(/<script src="https:[^"]*"><\/script>/,'');       // CDN 태그 제거
const dom=new JSDOM(html,{runScripts:"outside-only"});
const w=dom.window, noop=()=>{};

// WebGL 렌더러 스텁 — 계산에는 쓰이지 않는다
class FakeRenderer{
  constructor(){this.shadowMap={};}
  setPixelRatio(){} setSize(){} setViewport(){} setScissor(){}
  setScissorTest(){} setClearColor(){} clear(){} render(){}
}
w.THREE=Object.assign({},THREE,{WebGLRenderer:FakeRenderer});

// 2D 캔버스 스텁 (평면도)
const ctx=new Proxy({},{get:(t,k)=>(k==='canvas'?{width:672,height:560}:noop),set:()=>true});
w.HTMLCanvasElement.prototype.getContext=()=>ctx;
w.requestAnimationFrame=noop;
w.document.execCommand=noop;

w.eval(html.match(/<script>([\s\S]*?)<\/script>/)[1]);

const LP=w.__LP;                       // 디버그 훅
LP.applySpace('cafe');
LP.applyLighting('daylight');
console.log(LP.analyze());
```

`window.__LP` 로 노출된 것: `S`(상태), `analyze`, `applySpace`, `applyLighting`, `fitExposure`, `update`, `effCd`, `FIX`, `MOD`, `SPACES`.

문법 검사만 하려면:
```bash
node -e "const fs=require('fs');fs.writeFileSync('/tmp/c.js',
  fs.readFileSync('lightplan-v3.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1]);"
node --check /tmp/c.js
```

---

## 2. 좌표계 — 여기부터 이해해야 한다

**방 중심이 원점.** 방은 x ∈ [−W/2, W/2], z ∈ [−D/2, D/2], y는 바닥 0에서 천장 H.

- **−Z 가 뒷벽**, +Z 가 앞벽. 좌우는 +X 가 오른쪽.
- 피사체는 방 안 아무 데나(`subj.x`, `subj.z`), 몸 방향은 `subj.yaw`(도).
- 방위각 → 벡터: `DIR(deg) = (sin θ, 0, cos θ)`. 따라서 `DIR(0) = +Z`.
- `subj.yaw = 0` 이면 피사체가 +Z(앞벽)를 본다.

### 카메라
피사체 기준 극좌표다.

```
axisDeg = subj.yaw + cam.az          // 피사체 → 카메라 방향
camPos  = subjPos + DIR(axisDeg) · cam.dist,  y = cam.h
```

`cam.az = 0` 이면 피사체가 렌즈를 정면으로 본다. `cam.az > 0` 은 카메라가 피사체의 오른쪽으로 도는 방향.

### 조명
카메라 축 기준 방위각이다. 개퍼가 쓰는 사고방식 그대로.

```
lightPos = subjPos + DIR(axisDeg + L.az) · L.dist,  y = L.h
```

`L.az = +90` 이 카메라 오른쪽인 것이 유도된다. 카메라 forward = −DIR(axisDeg), up = +Y 일 때
`right = cross(forward, up) = DIR(axisDeg + 90)`.

**중요**: `L.dist`는 **모디파이어 앞면(발광면)에서 얼굴까지의 거리**다. 3D 모델은 이 지점에서 뒤(−Z 로컬)로 뻗는다. 그래야 스포트라이트 점광원이 자기 소프트박스에 가려지지 않는다.

### 얼굴 법선
카메라가 아니라 **얼굴 기준**이다.

```
정면  n = DIR(subj.yaw)
우측 볼 n = DIR(subj.yaw + 52)
좌측 볼 n = DIR(subj.yaw − 52)
```

52°는 입사계를 볼에 대고 재는 관행을 근사한 값이다.

### 벽
`walls()` 가 네 벽을 반환한다. 각 벽은 `{origin, uDir, n(내향 법선), half, cmp(나침반)}`.

`uDir` 은 **`uDir × up = n`** 을 만족하도록 정했다. three.js `ShapeGeometry` 는 XY 평면에 법선 +Z 로 생성되므로, `matrix.makeBasis(uDir, up, n)` 으로 바로 벽 평면에 놓을 수 있다.

| 벽 | origin | uDir | 내향 n | 나침반 |
|---|---|---|---|---|
| left | (−W/2, 0, 0) | (0,0,−1) | (+1,0,0) | orient − 90 |
| right | (+W/2, 0, 0) | (0,0,+1) | (−1,0,0) | orient + 90 |
| back | (0, 0, −D/2) | (+1,0,0) | (0,0,+1) | orient |
| front | (0, 0, +D/2) | (−1,0,0) | (0,0,−1) | orient + 180 |

`env.orient` 는 **뒷벽이 바깥으로 향한 나침반 방위**다.

나침반 방위 A → 월드 방향:
```
dirFromCompass(A) = ( sin(A − orient), 0, −cos(A − orient) )
```

---

## 3. 상태 스키마

```js
S = {
  cam :{ az, dist, h, focal },                       // focal: 풀프레임 mm
  expo:{ iso, shutter, f, nd, wb },                  // shutter: 초 단위 (1/50 = 0.02), nd: 스톱
  subj:{ x, z, yaw, eyeH, pose },                    // pose: 'sit' | 'stand'
  room:{ w, d, h, albedo, floor, props },            // albedo: 0..1 선형 반사율
  env :{ mode, time, sky, season, orient, amb },     // mode:'day'|'night', time: 4..22 시
                                                     // sky:'clear'|'cloud'|'overcast'
                                                     // season:'summer'|'mid'|'winter'
                                                     // amb: 실내등 조도 lx
  wins:[ { id, on, wall, u, w, h, sill, curtain } ], // u: 벽 중심 기준 오프셋 m
                                                     // curtain: 투과율 0..100 %
  lights:[ { id, on, name, fix, mod, dim, kelvin,
             az, dist, h, shadow, aim } ]            // aim: 'subj' | 'bg'
}
```

프로젝트 JSON 저장/불러오기가 이 구조를 그대로 직렬화한다.

---

## 4. 측광 모델

전부 **SI 단위**다. 광도 cd, 조도 lx, 발산도 lm/m².

### 4.1 기재 유효 광도

```
effCd(L)   = FIX[fix].cd × MOD[mod].mult × (dim / 100)
effSize(L) = MOD[mod].size  또는  FIX[fix].size × (MOD[mod].sizeMul || 1)
```

`FIX.cd` 는 **표준 리플렉터 기준 1m 조도(lx)** 이고 수치상 cd와 같다. 제조사 공개 스펙 근사치다.

`MOD.mult` 는 표준 리플렉터 대비 축상 광도 비율. 소프트박스가 0.16, 라이트돔 90cm가 0.11, 옥타 150cm가 0.05 인 식이다. 이 값들은 실측이 아니라 **경험적 추정**이라 교정 여지가 가장 큰 부분이다.

### 4.2 점광원 조도

```
E = I / d² × max(0, ûᵢ · n) × spill
```

`d²` 는 최소 0.09 로 클램프(0.3m 이하 방지).

**배경 조준(`aim:'bg'`) 스필**: 빔 축과 얼굴 방향의 각도로 감쇠시킨다.
```
beam  = normalize(bgPoint − lightPos)
toFace= normalize(facePos − lightPos)
spill = max(0, beam · toFace)⁴ × 0.6
```
`bgPoint()` 는 피사체가 등진 방향으로 레이를 쏴 방 경계와 만나는 점.

### 4.3 창문 (확산 성분)

창을 램버시안 면광원으로 근사한다.

```
E_diff_vertical = diffH × 0.42                      // 수평 확산조도 → 수직면 환산
E_direct_vertical = dn × max(0, ŝ · n_out)          // 직사광이 창면에 입사
M = ( E_diff_vertical + E_direct_vertical × (1 − c) × 0.6 ) × GLASS × c
I = M · A / π                                        // 등가 광도 (cd)
```

- `c` = 커튼 투과율 (0..1). **커튼은 차광이 아니라 확산 변환**으로 모델링했다. 직사광의 (1−c) 만큼이 산란해 확산 성분에 더해진다. 그래서 반투과 커튼에서 얼굴 조도가 오히려 오르는 현상이 재현된다.
- `GLASS = 0.76` (유리 투과율)
- `A` = 창 면적

**근거리 클램프**: 면광원의 조도는 발산도를 넘을 수 없다.
```
E_win = min( I/d² × cosθ,  M × cosθ )
```
이게 없으면 피사체를 창에 붙였을 때 조도가 발산한다. 정확한 해석해는 §8 참조.

### 4.4 직사광

**태양 위치** (간이 모델, 실제 SPA 알고리즘 아님):

```js
SEASON = { summer:{rise:5.3, set:19.7, max:75},
           mid   :{rise:6.3, set:18.4, max:55},
           winter:{rise:7.6, set:17.3, max:31} }

f   = (time − rise) / (set − rise)      // 0..1
alt = max × sin(π f)
az  = 90 + 180 f                        // 동(90) → 남(180) → 서(270)
```

**대기 감쇠** (법선 직사조도):
```
m  = max(0.05, sin(alt))
dn = 128000 × exp(−0.21 / m)            // lx
```
고도 60°에서 약 100,000 lx, 10°에서 약 38,000 lx.

**하늘 확산 수평조도**:

| 하늘 | dn 배율 | diffH (lx) | 하늘 색온도 |
|---|---|---|---|
| clear | ×1 | 1500 + 13000 m | 7600 K |
| cloud | ×0.25 | 4000 + 26000 m | 6900 K |
| overcast | ×0 | 2000 + 16000 m | 6400 K |

**직사광 색온도**:
```
sunK = clamp( 1800 + 4200 × min(1, sin(alt)/0.55),  1800, 5800 )
```

**얼굴에 직사광이 닿는지 판정** — `sunHitsFace()`. 얼굴에서 태양 방향으로 레이를 쏴 각 벽 평면과의 교점을 구하고, 그 (u, v)가 창 개구부 사각형 안에 드는지 검사한다. 실제 창을 통과해야만 직사광 광원이 목록에 추가된다.

3D에서는 벽을 **구멍 뚫린 ShapeGeometry** 로 만들고 DirectionalLight 그림자를 켰기 때문에, 바닥의 햇빛 패치가 자동으로 생긴다. 별도 계산이 없다.

### 4.5 바운스 근사

전역 조명이 아니다. 방 전체 표면적으로 나눈 단일 항이다.

```
surf   = 2(W·D + W·H + D·H)
bounce = Σ E_incident × albedo × (38 / surf) × 0.55  +  env.amb × 0.6
```

`38` 과 `0.55` 는 튜닝 상수다. 물리적 유도가 아니라 6×8×2.8m 기준 방에서 그럴듯한 값이 나오도록 맞췄다. **가장 신뢰도 낮은 항이다.**

### 4.6 명암비

```
hi    = max(우측 볼 조도, 좌측 볼 조도)   (+ bounce)
lo    = min(좌우)                        (+ bounce)
stops = log₂(hi / lo)
```

정면광이 위에서 내려오는 버터플라이 배치는 좌우 대칭이라 1.0:1 로 나온다. 입사계로 재도 그렇게 나오므로 오류가 아니다. 다만 **코밑 그림자 세기는 이 지표에 안 잡힌다.**

### 4.7 노출 (APEX 입사식)

```
E · S / C = N² / t          ,  C = 250
```

ND를 포함한 권장 조리개:
```
f_rec = √( E_front × ISO × t / (250 × 2^ND) )
err   = 2 · log₂(f_rec / f)          // + 면 과노출
```

### 4.8 화면 노출과 톤매핑 — 유도

three.js `physicallyCorrectLights = true` 에서 확산 반사의 출사 라디언스는 `L = albedo · E / π`.

18% 그레이가 화면에서 0.18 근처로 오게 하려면:

```
적정 노출 조건:  f² = E · S · t / (250 · 2^ND)
                → S · t / (250 · 2^ND) = f² / E

toneMappingExposure = 1.18 · π · ISO · t / (250 · f² · 2^ND)

검산:  L × exposure = (0.18/π) · E · (1.18 π f² / E) / f² = 0.18 × 1.18 = 0.212
```

ACES 필미틱을 거치면 약 0.19 로 떨어진다. `1.18` 은 그 보정 계수다.

**이 식 덕분에 프리뷰가 ISO·셔터·조리개·ND에 실제로 반응한다.** ND를 빼면 화면이 그대로 날아간다.

### 4.9 그림자 경도

```
광원각 = effSize(L) / dist
three.js: shadow.radius = clamp(광원각 × 13, 0.6, 18)
```

| 광원각 | 표시 |
|---|---|
| > 0.60 | 매우 부드러움 |
| > 0.34 | 부드러움 |
| > 0.16 | 보통 |
| 그 이하 | 단단함 |

PCFSoftShadowMap의 `shadow.radius` 는 물리적 반영영(penumbra)이 아니라 블러 반경이다. **경향만 맞고 절대값은 근사다.**

### 4.10 색온도와 화이트밸런스

켈빈 → RGB는 Tanner Helland 근사식. 화이트밸런스 보정:

```
factor = kelvinRGB(광원K) / kelvinRGB(WB)   (채널별)
정규화: factor /= (0.2126 r + 0.7152 g + 0.0722 b)     // 휘도 보존
```

WB와 같은 색온도의 광원은 정확히 (1,1,1)이 된다. 3200K 프랙티컬을 5600K WB에서 켜면 주황으로 뜬다.

**한계**: RGB 3채널 연산이라 분광분포(SPD)를 반영하지 못한다. 같은 5600K라도 LED와 태양의 피부색 차이는 원리적으로 재현 불가. §8 참조.

---

## 5. three.js 매핑

| 항목 | 설정 |
|---|---|
| 렌더러 | `physicallyCorrectLights = true`, `outputEncoding = sRGBEncoding`, `ACESFilmicToneMapping` |
| 그림자 | `PCFSoftShadowMap`, 조명당 1024², 태양 2048² |
| 조명 광도 | SpotLight `intensity` = cd, `decay = 2`, `distance = 0` |
| 태양 | DirectionalLight `intensity` = lx |
| 바운스 | AmbientLight `intensity` = 계산된 bounce (lx) |
| 재질 색 | **선형값으로 직접 지정.** r128은 재질 색을 sRGB→선형 변환하지 않는다. `setRGB(0.355, 0.250, 0.200)` 같은 식. 16진수로 넣으면 피부가 눈처럼 밝아진다. |
| 벽 | `side: FrontSide` (내향) + `shadowSide: DoubleSide`. 자유 시점에서 밖에서 안이 보이면서도 그림자는 정상 투사된다. |
| 발광면 | MeshBasicMaterial, 색 = `cd / 면적` (라디언스). 톤매핑을 타므로 밝으면 자연히 날아간다. |
| 창유리 | 투명(opacity 0.10). 스카이돔과 실외 지면이 창 너머로 보인다. |
| 커튼 | MeshBasicMaterial, 색 = `M/π`, opacity = `1 − curtain/100` |

**r128 주의사항**
- `OrbitControls` 없음 → 포인터 이벤트로 직접 구현
- `CapsuleGeometry` 없음 (r142+) → Cylinder/Sphere 조합
- `RectAreaLight` 는 `RectAreaLightUniformsLib`(examples)가 필요해서 미사용

**카메라 뷰 레터박스**: 전체 캔버스를 클리어한 뒤 `setScissorTest(true)` 로 16:9 영역만 렌더한다.

수직 화각 (풀프레임 16:9, 센서 유효폭 36mm / 높이 20.25mm):
```
fov_v = 2 · atan(10.125 / focal)
```

---

## 6. 함수 지도

파일 내 등장 순서.

**데이터**
`FIX` (기재 13종) → `MOD` (모디파이어 13종) → `S` (상태) → `PRESETS` (조명 6종)

**수학**
`kelvinRGB` `kelvinCSS` `nearestStop` `compassName`
`DIR` `subjP` `axisDeg` `camP` `walls` `bgPoint` `dirFromCompass`
`sunPos` `sunVec` `skyState` `windowData` `sunHitsFace`
`lightVec` `faceC` `normalAt`
`sources` → `illumOf` → **`analyze`** ← 모든 수치의 단일 출처

**3D 구축**
`tex` (프로시저럴 바닥 4종) → `purge` → `buildRoom` (구멍 뚫린 벽) → `buildProps` → `buildSubject` → `buildFixture` (기재 3D 모델) → `rebuildRig` → `syncWindowLights` → `wbFactor`

**동기화 · 렌더**
`syncScene` (매 갱신) → `setCameras` → `render` (rAF 루프) → 포인터 궤도 조작

**평면도**
`drawPlan` → `PLAN`/`HITS`/`toS`/`toW` → 드래그 IIFE

**UI**
`drawMeter` → `update` → `sheet` → `bindRange`/`bindSelect`/`bindSeg`/`syncUI` → `buildLights` → `buildWins` → `SPACES` → `clampPlacement`/`rebuildAll` → `fitExposure` → `applySpace`/`applyLighting` → `refreshCards` → `init`

**갱신 규칙**
- 값만 바뀜 → `update()` (analyze → syncScene → drawMeter → drawPlan)
- 방 치수·창문 변경 → `buildRoom()` 필요
- 기재·모디파이어 변경 → `rebuildRig()` 필요
- 자세·눈높이 변경 → `buildSubject()` 필요
- 조명 추가/삭제 → `rebuildRig()` + `buildLights()`

`analyze()` 는 순수 함수다. 상태를 읽고 수치만 반환한다. 새 지표를 넣을 곳도 여기다.

---

## 7. 프리셋 튜닝 절차

프리셋의 디머 값은 손으로 정한 게 아니라 수치 최적화로 뽑았다. 프리셋을 바꾸거나 추가할 때 같은 절차를 쓰면 된다.

**목표**: ISO 800 · 1/50 · f/2.8 에서 노출 오차 0, 그리고 의도한 명암비.

```js
// 각 프리셋마다: 역할 지정 (k=키, f=필, r=림, b=배경)
const C = { keyDim:55, stops:1.85, roles:['k','f','r','b'], rim:1.30, bg:0.55, nd:2 };

idx.k.dim = C.keyDim;
for(let i=0; i<600; i++){
  let a = LP.analyze();
  const inc = o => (a.src.find(x=>x.ref===o)||{inc:1}).inc;
  const keyInc = inc(idx.k);
  // 림·배경은 키 대비 입사 조도 비율로
  idx.r.dim = clamp(idx.r.dim * (keyInc*C.rim / inc(idx.r)), 1, 100);
  idx.b.dim = clamp(idx.b.dim * (keyInc*C.bg  / inc(idx.b)), 1, 100);
  a = LP.analyze();
  // 필은 명암비로
  idx.f.dim = clamp(idx.f.dim * Math.pow(2, (a.stops - C.stops)*0.4), 1, 100);
}
S.expo.nd = C.nd;
// 마지막에 전체 디머를 균일 배율로 스케일해 노출 오차 0
for(let i=0;i<60;i++){ const a=LP.analyze();
  const s=Math.pow(2, -a.err*0.5); S.lights.forEach(x=>x.dim=clamp(x.dim*s,1,100)); }
```

**주의**: 디머가 1% 또는 100%에 붙으면 기재 선택이 잘못된 것이다. 필에 300W를 쓰면 6%가 나온다. 그럴 땐 더 작은 기재로 바꾸거나 ND를 조정한다.

**v3 기준 결과** (튜닝 당시 공간 기준)

| 프리셋 | ND | 얼굴 조도 | 명암비 | 디머 |
|---|---|---|---|---|
| 인터뷰 3점 | 2 | 488 lx | 1.84 st | 74 / 26 / 25 / 100 |
| 창광+반사판 | 3 | 1047 lx | 1.90 st | 45 / 89 |
| 렘브란트 | 2 | 491 lx | 2.95 st | 43 / 12 / 31 |
| 야간 실내 | 0 | 121 lx | 1.65 st | 49 / 100 / 90 |
| 강단/무대 | 2 | 490 lx | 1.69 st | 87 / 12 / 52 |
| 밝은 플랫 | 1 | 247 lx | 0.38 st | 41 / 17 / 9 / 68 |

v3에서는 조명 프리셋이 공간을 덮어쓰지 않으므로, 적용 시 `fitExposure()` 가 ND와 조리개를 자동으로 다시 잡는다. 위 수치는 튜닝 당시의 기준값이다.

---

## 8. 알려진 한계

우선순위 순.

1. **전역 조명 없음.** 벽 반사가 단일 상수 항이다. 흰 벽 좁은 방에서 실촬 그림자가 여기보다 더 열린다. 상수 `38`/`0.55` 는 6×8×2.8m 기준으로 맞춘 값이라 다른 크기의 방에서는 오차가 커진다.
2. **면광원을 점광원으로 근사.** 역제곱이 성립하려면 광원 크기의 5배 이상 거리여야 하는데 소프트박스 실사용 거리는 그 조건 밖이다. 창문에만 발산도 클램프를 걸어뒀고 조명 기재에는 안 걸려 있다.
3. **기재 출력값이 근사치.** 특히 `MOD.mult`(모디파이어 손실률)는 실측이 아니다. 절대값보다 비율을 신뢰해야 한다.
4. **그림자 반영영이 물리 계산이 아님.** `shadow.radius` 는 블러 반경. 경향만 맞다.
5. **RGB 3채널.** SPD를 반영하지 못해 CRI/TM-30 차이가 재현되지 않는다.
6. **피부가 램버시안.** 표면하 산란이 없어서 렘브란트 삼각형 경계가 실제보다 날카롭다.
7. **태양 위치가 간이 모델.** 실제 SPA 알고리즘이 아니라 정현파 근사다. 위도를 안 받는다. 계절 프리셋 3종으로만 대응한다.
8. **명암비가 좌우 대비만.** 상하 대비(코밑 그림자)는 안 잡힌다.

---

## 9. 확장 시 참고

정확도를 올리는 순서는 위 한계 목록의 번호 순이 맞다. 각 항목의 방향만 적어둔다.

**면광원 해석해** — 램버시안 사각 광원의 모서리 조도:
```
E = (M/π) [ X/√(1+X²) · atan(Y/√(1+X²)) + Y/√(1+Y²) · atan(X/√(1+Y²)) ]
X = a/d, Y = b/d
```
실시간 정확 적분이 필요하면 LTC(Linearly Transformed Cosines, Heitz 2016).

**IES 배광** — LM-63 파일을 파싱해 `I(θ, φ)` 를 이중선형 보간. `FIX[].cd` 상수를 대체하면 프레넬 핫스팟과 리플렉터 가장자리 감쇠가 살아난다. 제조사(Aputure, ARRI 등)가 배포한다.

**전역 조명** — 브라우저 안에서 제대로 풀 방법은 없다. 라디오시티 형상계수로 확산 반사만 푸는 게 현실적 타협점이다. 그 이상이 필요하면 Blender Cycles로 내보내는 게 맞다.

**교정** — 렌더러를 올리기 전에 **입력 데이터부터 재는 게 효과가 크다.** 실제 현장에서 조도계로 몇 점 재서 `FIX.cd`와 `MOD.mult`를 보정하면 지금 구조 그대로도 정확도가 크게 오른다.

---

## 10. 회귀 테스트 체크리스트

코드를 고친 뒤 확인할 것들.

- [ ] 문법 검사 통과 (`node --check`)
- [ ] 6개 공간 프리셋 × 6개 조명 프리셋 = 36조합이 모두 예외 없이 `analyze()` 반환
- [ ] 조명 프리셋 적용 후 노출 오차가 ±0.6 스톱 이내
- [ ] 창가 프리셋에서 시각 6→19시 이동 시 색온도가 저녁에 낮아짐 (2700K 근처)
- [ ] 커튼 0%에서 창 입사 0 lx
- [ ] 낮/밤 전환 시 태양 광원이 사라지고 상태바에 태양 고도가 표시되지 않음
- [ ] 피사체를 창 쪽으로 붙여도 조도가 발산하지 않음 (발산도 클램프)
- [ ] 평면도에서 피사체 드래그 시 조명의 az/dist가 유지됨
- [ ] 조명 카드에서 기재·모디파이어 교체 시 3D 모델이 재생성됨
- [ ] 프로젝트 JSON 저장 → 상태 변경 → 불러오기로 완전 복원
- [ ] 세팅 시트에 창문·조명·측광 요약이 모두 포함됨

---

## 부록 A. 기재 라이브러리

`cd` = 표준 리플렉터 1m 조도(lx) 근사치.

| key | 제품 | cd | W | kind | 색온도 범위 |
|---|---|---|---|---|---|
| mc | Aputure MC | 150 | 5 | panel | 2500–7500 |
| pavo30 | Nanlite PavoTube II 30X | 500 | 30 | tube | 2700–7500 |
| p60c | Amaran P60c | 1,800 | 60 | panel | 2500–7500 |
| sl60 | Godox SL60II | 4,500 | 60 | cob | 5600 |
| am100 | Amaran 100d | 12,000 | 100 | cob | 5500 |
| vl150 | Godox VL150 | 18,000 | 150 | cob | 5600 |
| am200x | Amaran 200x | 20,000 | 200 | cob | 2700–6500 |
| ls300x | Aputure LS 300X | 28,000 | 300 | cob | 2700–6500 |
| forza300 | Nanlite Forza 300B | 30,000 | 300 | cob | 2700–6500 |
| nova300 | Aputure Nova P300c | 6,000 | 300 | panel | 2000–10000 |
| ls600d | Aputure LS 600d Pro | 55,000 | 600 | cob | 5600 |
| prac | 실내등 / 프랙티컬 | 300 | 15 | prac | 2400–4500 |
| bounce | 반사판 | 350 | 0 | bounce | 2000–9000 |

## 부록 B. 모디파이어

| key | 이름 | mult | size (m) | 적용 |
|---|---|---|---|---|
| reflector | 표준 리플렉터 | 1.00 | 0.18 | cob |
| fresnel | 프레넬 (스팟) | 2.40 | 0.16 | cob |
| bare | 베어벌브 | 0.12 | 0.10 | cob |
| sb60 | 소프트박스 60cm | 0.16 | 0.60 | cob |
| dome | 라이트돔 90cm | 0.11 | 0.90 | cob |
| domexl | 라이트돔 XL 120cm | 0.07 | 1.20 | cob |
| octa150 | 옥타박스 150cm | 0.05 | 1.50 | cob |
| lantern | 랜턴 65cm | 0.06 | 0.65 | cob |
| umbrella | 투과 우산 110cm | 0.13 | 1.10 | cob |
| book | 북라이트 / 바운스 | 0.04 | 1.40 | cob |
| none | 없음 | 1.00 | 기재 크기 | panel/tube/prac |
| diff | 디퓨전 시트 | 0.68 | ×1.15 | panel/tube/prac |
| grid | 허니컴 그리드 | 0.88 | ×0.85 | panel/tube/prac |

스포트라이트 원뿔각 `[angle, penumbra]`:
`fresnel [0.45, 0.35]`, `grid [0.55, 0.50]`, `reflector [0.75, 0.70]`, `bare [1.25, 1.0]`, 그 외 `[0.98, 1.0]`
