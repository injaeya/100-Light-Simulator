# Light Simulator — 촬영 조명 시뮬레이터

카메라(센서/바디)·렌즈·조리개 등 촬영 설정에 따라 **무대 / 인터뷰 / 스튜디오** 공간에
조명을 배치하고, 그 결과를 실시간 3D로 미리보는 웹 애플리케이션입니다.
전문 촬영 현장의 조명 프리비주얼라이제이션(pre-visualization)을 목표로 합니다.

## 주요 기능

- **카메라 · 렌즈 · 노출**
  - 센서 프리셋: 중형 · 풀프레임 · Super35 · APS-C · MFT · 1인치
  - 초점거리(14–200mm), 35mm 환산 초점거리 자동 계산
  - 조리개 / 셔터 / ISO 노출 3요소, 노출값(EV) 실시간 표시
  - 화각(FOV)·피사계 심도(DOF) 계산 및 표시
- **조명**
  - 기구 타입: 소프트박스 · LED 패널 · 프레넬 · 스포트 · 튜브 · 포인트
  - 출력(W)·색온도(2000–10000K)·확산각·위치(XYZ) 조절
  - 색온도 → RGB 근사 변환으로 실제 광색 반영
  - 기본 3점 조명(키/필/백) 프리셋
- **공간 / 뷰**
  - 인터뷰 · 무대 · 스튜디오 · 빈 공간 세트
  - 궤도 카메라 컨트롤, 접지 그림자, 노출 보정
  - 조명 기구 헬퍼 표시 토글

## 기술 스택

- **Vite** + **React 19** + **TypeScript**
- **Three.js** / **@react-three/fiber** / **@react-three/drei** — 3D 렌더링
- **zustand** — 상태 관리

## 개발

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
npm run lint     # oxlint
```

## 프로젝트 구조

```
src/
├─ lib/optics.ts              # 화각·심도·노출·색온도 등 광학 계산
├─ data/presets.ts           # 센서/렌즈/조명/공간 프리셋 데이터
├─ store/simulatorStore.ts   # 전역 상태 (zustand)
├─ components/
│  ├─ Scene/                 # 3D 뷰포트 (Canvas, 공간, 피사체, 조명)
│  └─ Panels/                # 컨트롤 패널 (카메라 / 조명 / 공간)
├─ App.tsx                   # 레이아웃
└─ App.css                   # 다크 UI 스타일
```

## 배포

정적 빌드 결과(`dist/`)를 그대로 정적 호스팅에 올릴 수 있습니다 (Vercel / Netlify / GitHub Pages 등).

---

© 2026 Light Simulator
