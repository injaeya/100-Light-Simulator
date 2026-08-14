/**
 * daylight.ts — 자연광 (태양 위치·하늘·창문). docs §4.3~4.4 이식.
 */
import { Vector3 } from 'three';
import type { Season, SimState, WinState } from './types';
import { clamp, D2R, dirFromCompass, walls, WALLNAME, winCenter } from './coords';

export const GLASS = 0.76;

export const SEASON: Record<Season, { rise: number; set: number; max: number }> = {
  summer: { rise: 5.3, set: 19.7, max: 75 },
  mid: { rise: 6.3, set: 18.4, max: 55 },
  winter: { rise: 7.6, set: 17.3, max: 31 },
};

export interface SunPos {
  alt: number;
  az: number;
  up: boolean;
}
export function sunPos(s: SimState): SunPos {
  const P = SEASON[s.env.season], t = s.env.time;
  if (t <= P.rise || t >= P.set) return { alt: -6, az: 180, up: false };
  const f = (t - P.rise) / (P.set - P.rise);
  const alt = P.max * Math.sin(Math.PI * f);
  return { alt, az: 90 + 180 * f, up: alt > 0.8 };
}

export function sunVec(s: SimState): Vector3 {
  const p = sunPos(s), c = Math.cos(p.alt * D2R);
  return dirFromCompass(p.az, s.env.orient).multiplyScalar(c).setY(Math.sin(p.alt * D2R)).normalize();
}

export interface SkyState {
  dn: number;
  diffH: number;
  skyK: number;
  sunK: number;
  night: boolean;
  s: SunPos;
}
export function skyState(s: SimState): SkyState {
  const sp = sunPos(s), night = s.env.mode === 'night' || !sp.up;
  if (night) return { dn: 0, diffH: s.env.mode === 'night' ? 10 : 80, skyK: 8000, sunK: 5600, night: true, s: sp };
  const m = Math.max(0.05, Math.sin(sp.alt * D2R));
  let dn = 128000 * Math.exp(-0.21 / m), diffH: number, skyK: number;
  if (s.env.sky === 'clear') { diffH = 1500 + 13000 * m; skyK = 7600; }
  else if (s.env.sky === 'cloud') { dn *= 0.25; diffH = 4000 + 26000 * m; skyK = 6900; }
  else { dn = 0; diffH = 2000 + 16000 * m; skyK = 6400; }
  const sunK = clamp(1800 + 4200 * Math.min(1, Math.sin(sp.alt * D2R) / 0.55), 1800, 5800);
  return { dn, diffH, skyK, sunK, night: false, s: sp };
}

export interface WinLight {
  W: WinState;
  I: number;
  M: number;
  A: number;
  pos: Vector3;
  size: number;
  name: string;
  k: number;
  edir: number;
}
export interface WindowData {
  wins: WinLight[];
  sunLux: number;
  sk: SkyState;
  sv: Vector3;
}

/** 창문별 확산 광량(cd 등가) + 직사 통과 여부 */
export function windowData(s: SimState): WindowData {
  const sk = skyState(s), sv = sunVec(s), out: WinLight[] = [];
  // 창을 통과하는 실제 직사 조도(입사각·커튼 반영). 예전엔 dn 전량을 계단식으로 써
  // orient 변화 시 특정 구간에서 화면이 급격히 백화됐다 → 입사각(cosInc)에 비례하게.
  let sunEnter = 0;
  const ws = walls(s.room, s.env.orient);
  for (const W of s.wins) {
    if (!W.on) continue;
    const wl = ws[W.wall], cur = W.curtain / 100;
    const cosInc = Math.max(0, sv.dot(wl.n.clone().negate()));
    const Edir = sk.dn > 0 && !sk.night ? sk.dn * cosInc : 0;
    const Ediff = sk.diffH * 0.42;
    const M = (Ediff + Edir * (1 - cur) * 0.6) * GLASS * cur; // 커튼이 직사광을 확산으로
    const A = W.w * W.h;
    out.push({
      W, I: (M * A) / Math.PI, M, A,
      pos: winCenter(W, s.room, s.env.orient).addScaledVector(wl.n, 0.04),
      size: Math.sqrt(A), name: '창 ' + WALLNAME[W.wall], k: sk.skyK, edir: Edir,
    });
    if (Edir > 0) sunEnter = Math.max(sunEnter, Edir * cur);
  }
  return { wins: out, sunLux: sunEnter * GLASS, sk, sv };
}

/**
 * 얼굴이 직사광 패치 안에 드는 정도(0..1).
 * 창 개구부 가장자리에서 soft margin 으로 램프 → orient/시간 변화 시 급격한 on/off 방지.
 */
export function sunFaceFactor(s: SimState, sv: Vector3): number {
  if (!s.wins.length) return 0;
  const p = new Vector3(s.subj.x, s.room.riser + s.subj.eyeH, s.subj.z);
  const ws = walls(s.room, s.env.orient);
  const mgn = 0.3; // 개구부 안쪽 여유(m)
  let best = 0;
  for (const W of s.wins) {
    if (!W.on || W.curtain < 5) continue;
    const wl = ws[W.wall];
    const denom = sv.dot(wl.n);
    if (denom >= -1e-6) continue;
    const t = wl.origin.clone().sub(p).dot(wl.n) / denom;
    if (t <= 0) continue;
    const hit = p.clone().addScaledVector(sv, t).sub(wl.origin);
    const u = hit.dot(wl.uDir), v = hit.y;
    const du = W.w / 2 - Math.abs(u - W.u);
    const dv = Math.min(v - W.sill, W.sill + W.h - v);
    const fu = clamp(du / mgn, 0, 1);
    const fv = clamp(dv / mgn, 0, 1);
    best = Math.max(best, fu * fv);
  }
  return best;
}
