/**
 * types.ts — LIGHTPLAN 상태 스키마 (docs/LIGHTPLAN-기술문서.md §3)
 * 방 중심이 원점. −Z 뒷벽, +Z 앞벽. +X 오른쪽. y=바닥0~천장H.
 */

export type Pose = 'sit' | 'stand';
export type WallId = 'left' | 'right' | 'back' | 'front';
export type SkyMode = 'day' | 'night';
export type Sky = 'clear' | 'cloud' | 'overcast';
export type Season = 'summer' | 'mid' | 'winter';
export type FloorTex = 'wood' | 'concrete' | 'carpet' | 'tile';
/** 조준 대상: 인물 | 배경 | 자유(월드 타깃) */
export type Aim = 'subj' | 'bg' | 'free';
/** 배치 모드: 인물 기준 극좌표 | 공간 자유배치(월드 XZ) */
export type Place = 'stage' | 'free';

/** 카메라 조준: 인물(스테이지) | 자유(월드 타깃) */
export type CamAim = 'subj' | 'free';

/** 카메라 — 다대(多臺) 지원, 조명과 동일한 배치/조준 모델 */
export interface CamState {
  id: number;
  name: string;
  /** 배치 모드: 인물 기준 극좌표 | 공간 자유배치 */
  place: Place;
  /** 카메라 방위각(도, 피사체축 기준). place='stage'에서 사용 */
  az: number;
  /** 피사체까지 거리(m). place='stage'에서 사용 */
  dist: number;
  /** 카메라 높이(m). 두 배치 모드 공용 */
  h: number;
  /** place='free' 월드 좌표(x,z) */
  x: number;
  z: number;
  /** 조준 대상 */
  aim: CamAim;
  /** aim='free' 조준 월드 타깃(tx,ty,tz) */
  tx: number;
  ty: number;
  tz: number;
  /** 초점거리(풀프레임 mm) — 장착 렌즈의 줌 범위 내 */
  focal: number;
  /** 장착 렌즈 id (src/sim/lenses.ts) */
  lens: string;
}

/** 노출 */
export interface ExpoState {
  iso: number;
  /** 셔터(초, 1/50=0.02) */
  shutter: number;
  /** 조리개 f수 */
  f: number;
  /** ND 필터(스톱) */
  nd: number;
  /** 화이트밸런스(K) */
  wb: number;
}

export interface SubjState {
  x: number;
  z: number;
  /** 몸 방향(도). 0=+Z(앞벽)를 봄 */
  yaw: number;
  /** 눈높이(m) */
  eyeH: number;
  pose: Pose;
}

export interface RoomState {
  w: number;
  d: number;
  /** 천장 높이(m) — 바닥(0) 기준 */
  h: number;
  /** 바닥 단(무대 플랫폼) 높이(m). 0=평바닥. 피사체가 이 위에 올라선다 */
  riser: number;
  /** 선형 반사율 0..1 */
  albedo: number;
  floor: FloorTex;
  props: number;
}

export interface EnvState {
  mode: SkyMode;
  /** 시각 4..22 */
  time: number;
  sky: Sky;
  season: Season;
  /** 뒷벽 바깥 나침반 방위(도) */
  orient: number;
  /** 실내등(앰비언트) 조도 lx */
  amb: number;
}

export interface WinState {
  id: number;
  on: boolean;
  wall: WallId;
  /** 벽 중심 기준 오프셋(m) */
  u: number;
  w: number;
  h: number;
  /** 창턱 높이(m) */
  sill: number;
  /** 커튼 투과율 0..100 */
  curtain: number;
}

export interface LightState {
  id: number;
  on: boolean;
  name: string;
  /** 기재 key (FIX) */
  fix: string;
  /** 모디파이어 key (MOD) */
  mod: string;
  /** 디머 0..100 */
  dim: number;
  kelvin: number;
  /** 카메라축 기준 방위각(도). +90=카메라 오른쪽. place='stage'에서 사용 */
  az: number;
  /** 발광면에서 스테이지까지 거리(m). place='stage'에서 사용 */
  dist: number;
  /** 조명 높이(m). 두 배치 모드 공용 */
  h: number;
  shadow: boolean;
  aim: Aim;
  /** 배치 모드 */
  place: Place;
  /** place='free' 월드 좌표(x,z). 높이는 h 공용 */
  x: number;
  z: number;
  /** aim='free' 조준 월드 타깃(tx,ty,tz) */
  tx: number;
  ty: number;
  tz: number;
}

export interface SimState {
  /** 카메라 목록(다대). 활성 카메라가 촬영뷰·측광 기준축 */
  cams: CamState[];
  /** 활성(주) 카메라 id */
  activeCamId: number;
  expo: ExpoState;
  subj: SubjState;
  room: RoomState;
  env: EnvState;
  wins: WinState[];
  lights: LightState[];
  /**
   * 고정 스테이지 앵커(월드 XZ). 조명·카메라 위치의 기준점.
   * 피사체를 옮겨도 이 값은 유지되어 조명/카메라가 제자리에 고정된다.
   * 공간/프리셋 적용 시 피사체 홈 위치로 설정된다.
   */
  stage: { x: number; z: number };
}
