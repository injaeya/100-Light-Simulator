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
export type Aim = 'subj' | 'bg';

/** 카메라 — 피사체 기준 극좌표 */
export interface CamState {
  /** 카메라 방위각(도, 피사체축 기준). 0=피사체가 렌즈 정면 */
  az: number;
  /** 피사체까지 거리(m) */
  dist: number;
  /** 카메라 높이(m) */
  h: number;
  /** 초점거리(풀프레임 mm) */
  focal: number;
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
  h: number;
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
  /** 카메라축 기준 방위각(도). +90=카메라 오른쪽 */
  az: number;
  /** 발광면에서 얼굴까지 거리(m) */
  dist: number;
  /** 조명 높이(m) */
  h: number;
  shadow: boolean;
  aim: Aim;
}

export interface SimState {
  cam: CamState;
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
