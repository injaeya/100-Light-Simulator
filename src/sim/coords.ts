/**
 * coords.ts — 방 좌표계 (docs §2). 방 중심 원점, −Z 뒷벽.
 * three.js Vector3 사용.
 */
import { Vector3 } from 'three';
import type { LightState, RoomState, SimState, WallId, WinState } from './types';

export const D2R = Math.PI / 180;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const V3 = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** 방위각(도) → 수평 단위벡터. DIR(0)=+Z */
export const DIR = (deg: number) => V3(Math.sin(deg * D2R), 0, Math.cos(deg * D2R));

export const subjP = (s: SimState) => V3(s.subj.x, 0, s.subj.z);
/** 조명·카메라 위치 기준(고정 스테이지 앵커). 피사체 이동과 무관. */
export const stageP = (s: SimState) => V3(s.stage.x, 0, s.stage.z);
export const axisDeg = (s: SimState) => s.subj.yaw + s.cam.az;
/** 카메라 위치는 스테이지 앵커 기준(고정), 조준은 피사체(faceC) */
export const camP = (s: SimState) => stageP(s).addScaledVector(DIR(axisDeg(s)), s.cam.dist).setY(s.cam.h);
export const faceC = (s: SimState) => V3(s.subj.x, s.subj.eyeH, s.subj.z);
export const normalAt = (s: SimState, d: number) => DIR(s.subj.yaw + d);
/** 조명 위치는 스테이지 앵커 기준(고정), 조준은 피사체(faceC)/배경 */
export const lightVec = (s: SimState, L: LightState) =>
  stageP(s).addScaledVector(DIR(axisDeg(s) + L.az), L.dist).setY(L.h);

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

/** 피사체가 등진 쪽 벽면의 한 점 (배경 조준용) */
export function bgPoint(s: SimState): Vector3 {
  const R = s.room, p = subjP(s), d = DIR(s.subj.yaw + 180);
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
