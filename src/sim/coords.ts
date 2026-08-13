/**
 * coords.ts — 방 좌표계 (docs §2). 방 중심 원점, −Z 뒷벽.
 * three.js Vector3 사용.
 */
import { Vector3 } from 'three';
import type { CamState, LightState, RoomState, SimState, WallId, WinState } from './types';

export const D2R = Math.PI / 180;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const V3 = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** 방위각(도) → 수평 단위벡터. DIR(0)=+Z */
export const DIR = (deg: number) => V3(Math.sin(deg * D2R), 0, Math.cos(deg * D2R));

export const subjP = (s: SimState) => V3(s.subj.x, 0, s.subj.z);
/** 조명·카메라 위치 기준(고정 스테이지 앵커). 피사체 이동과 무관. */
export const stageP = (s: SimState) => V3(s.stage.x, 0, s.stage.z);

/** 활성(주) 카메라 */
export const activeCam = (s: SimState): CamState =>
  s.cams.find((c) => c.id === s.activeCamId) ?? s.cams[0];

/** 조명 스테이지 배치 기준축 = 피사체 방향 + 활성 카메라 방위 */
export const axisDeg = (s: SimState) => s.subj.yaw + activeCam(s).az;

/** 카메라 C 의 월드 위치 (free=월드XZ / stage=스테이지 극좌표) */
export const camPos = (s: SimState, C: CamState) =>
  C.place === 'free'
    ? V3(C.x, C.h, C.z)
    : stageP(s).addScaledVector(DIR(s.subj.yaw + C.az), C.dist).setY(C.h);

/** 카메라 C 의 조준 타깃 (free=월드타깃 / subj=스테이지 눈높이) */
export const camAim = (s: SimState, C: CamState) =>
  C.aim === 'free' ? V3(C.tx, C.ty, C.tz) : V3(s.stage.x, s.subj.eyeH, s.stage.z);

/** 활성 카메라 위치(하위호환) */
export const camP = (s: SimState) => camPos(s, activeCam(s));
export const faceC = (s: SimState) => V3(s.subj.x, s.subj.eyeH, s.subj.z);
/** 조명 조준 기준점(고정 스테이지, 눈높이). 피사체 이동과 무관하게 조명 각도 유지 */
export const stageFace = (s: SimState) => V3(s.stage.x, s.subj.eyeH, s.stage.z);
export const normalAt = (s: SimState, d: number) => DIR(s.subj.yaw + d);
/**
 * 조명 월드 위치.
 * place='free'  → 월드 XZ(L.x,L.z)에 자유 배치, 높이 L.h
 * place='stage' → 스테이지 앵커 기준 극좌표(방위 az·거리 dist·높이 h)
 */
export const lightVec = (s: SimState, L: LightState) =>
  L.place === 'free'
    ? V3(L.x, L.h, L.z)
    : stageP(s).addScaledVector(DIR(axisDeg(s) + L.az), L.dist).setY(L.h);

/**
 * 조명 조준 월드 타깃.
 * aim='free' → 임의 월드 타깃(tx,ty,tz)
 * aim='bg'   → 배경 벽면 점
 * aim='subj' → 고정 스테이지(눈높이)
 */
export const lightAim = (s: SimState, L: LightState) =>
  L.aim === 'free' ? V3(L.tx, L.ty, L.tz) : L.aim === 'bg' ? bgPoint(s) : stageFace(s);

export interface Wall {
  origin: Vector3;
  uDir: Vector3;
  n: Vector3;
  half: number;
  cmp: number;
}

export function walls(room: RoomState, orient: number): Record<WallId, Wall> {
  const R = room;
  return {
    left: { origin: V3(-R.w / 2, 0, 0), uDir: V3(0, 0, -1), n: V3(1, 0, 0), half: R.d / 2, cmp: orient - 90 },
    right: { origin: V3(R.w / 2, 0, 0), uDir: V3(0, 0, 1), n: V3(-1, 0, 0), half: R.d / 2, cmp: orient + 90 },
    back: { origin: V3(0, 0, -R.d / 2), uDir: V3(1, 0, 0), n: V3(0, 0, 1), half: R.w / 2, cmp: orient },
    front: { origin: V3(0, 0, R.d / 2), uDir: V3(-1, 0, 0), n: V3(0, 0, -1), half: R.w / 2, cmp: orient + 180 },
  };
}

/** 스테이지 뒤쪽 벽면의 한 점 (배경 조준용, 고정) — 피사체 이동과 무관 */
export function bgPoint(s: SimState): Vector3 {
  const R = s.room, p = stageP(s), d = DIR(s.subj.yaw + 180);
  let t = 1e9;
  if (Math.abs(d.x) > 1e-4) t = Math.min(t, ((d.x > 0 ? R.w / 2 : -R.w / 2) - p.x) / d.x);
  if (Math.abs(d.z) > 1e-4) t = Math.min(t, ((d.z > 0 ? R.d / 2 : -R.d / 2) - p.z) / d.z);
  if (!isFinite(t) || t < 0) t = 1;
  return p.clone().addScaledVector(d, Math.max(0.25, t - 0.1)).setY(s.subj.eyeH * 0.88);
}

export const WALLNAME: Record<WallId, string> = { left: '좌', right: '우', back: '뒤', front: '앞' };

export function winCenter(W: WinState, room: RoomState, orient: number): Vector3 {
  const w = walls(room, orient)[W.wall];
  return w.origin.clone().addScaledVector(w.uDir, W.u).add(V3(0, W.sill + W.h / 2, 0));
}

/** 나침반 방위 → 월드 방향 */
export const dirFromCompass = (a: number, orient: number) => {
  const d = (a - orient) * D2R;
  return V3(Math.sin(d), 0, -Math.cos(d));
};

export const FSTOPS = [1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
export function nearestStop(f: number): number {
  let b = FSTOPS[0], d = 1e9;
  for (const s of FSTOPS) {
    const dd = Math.abs(Math.log2(s) - Math.log2(f));
    if (dd < d) { d = dd; b = s; }
  }
  return b;
}

const COMPASS: [string, number][] = [
  ['북', 0], ['북동', 45], ['동', 90], ['남동', 135],
  ['남', 180], ['남서', 225], ['서', 270], ['북서', 315],
];
export const compassName = (a: number) => COMPASS[Math.round(((((a % 360) + 360) % 360)) / 45) % 8][0];
