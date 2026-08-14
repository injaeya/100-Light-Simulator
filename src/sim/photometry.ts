/**
 * photometry.ts — 측광 모델 (docs §4). SI 단위: cd, lx.
 * analyze()가 모든 수치의 단일 출처.
 */
import { Vector3 } from 'three';
import type { LightState, SimState } from './types';
import { FIXTURES } from './fixtures';
import { MODIFIERS } from './modifiers';
import { faceC, lightAim, lightVec, nearestStop, normalAt } from './coords';
import { sunFaceFactor, windowData, type WindowData } from './daylight';

/** 기재 유효 광도(cd) = cd × mult × dim% */
export const effCd = (L: LightState) => FIXTURES[L.fix].cd * MODIFIERS[L.mod].mult * (L.dim / 100);

/** 기재 유효 발광면 크기(m) */
export const effSize = (L: LightState) => {
  const m = MODIFIERS[L.mod];
  return m.size != null ? m.size : (FIXTURES[L.fix].size || 0.2) * (m.sizeMul || 1);
};

export type SourceKind = 'fix' | 'win' | 'sun';
export interface Source {
  kind: SourceKind;
  name: string;
  ref?: LightState | unknown;
  pos?: Vector3;
  dir?: Vector3;
  I?: number;
  E?: number;
  M?: number;
  size: number;
  k: number;
  spill?: number;
  /** analyze가 채움: 얼굴 정면 조도 */
  lux?: number;
  /** analyze가 채움: 입사 조도(코사인 무시) */
  inc?: number;
}

export function sources(s: SimState): { list: Source[]; wd: WindowData } {
  const out: Source[] = [], wd = windowData(s);
  for (const L of s.lights)
    if (L.on) {
      const p = lightVec(s, L);
      let sp = 1;
      // 조준이 얼굴을 벗어난 만큼 얼굴 도달 광량 감쇠(정렬도^4).
      // aim='subj'는 스테이지=얼굴 방향이라 sp≈1, 'bg'는 최대 0.6로 억제.
      if (L.aim !== 'subj') {
        const beam = lightAim(s, L).clone().sub(p).normalize();
        const tf = faceC(s).clone().sub(p).normalize();
        sp = Math.pow(Math.max(0, beam.dot(tf)), 4) * (L.aim === 'bg' ? 0.6 : 1);
      }
      out.push({ kind: 'fix', name: L.name, ref: L, pos: p, I: effCd(L), size: effSize(L), k: L.kelvin, spill: sp });
    }
  for (const w of wd.wins)
    if (w.I > 0.5)
      out.push({ kind: 'win', name: w.name, ref: w.W, pos: w.pos, I: w.I, M: w.M, size: w.size, k: w.k });
  const sunF = sunFaceFactor(s, wd.sv);
  if (wd.sunLux > 10 && sunF > 0)
    out.push({ kind: 'sun', name: '직사광', dir: wd.sv, E: wd.sunLux * sunF, size: 0.01, k: wd.sk.sunK });
  return { list: out, wd };
}

export function illumOf(s: SimState, src: Source, n: Vector3): number {
  if (src.kind === 'sun') return (src.E || 0) * Math.max(0, (src.dir as Vector3).dot(n));
  const v = (src.pos as Vector3).clone().sub(faceC(s));
  const d2 = Math.max(0.09, v.lengthSq());
  const cos = Math.max(0, v.normalize().dot(n));
  let e = ((src.I || 0) / d2) * cos * (src.spill || 1);
  if (src.kind === 'win') e = Math.min(e, (src.M || 0) * cos); // 근거리 면광원 상한
  return e;
}

export interface Analysis {
  front: number;
  hi: number;
  lo: number;
  stops: number;
  bounce: number;
  fRec: number;
  err: number;
  key: Source | null;
  soft: number;
  src: Source[];
  wd: WindowData;
  mixK: number;
  kmin: number;
  kmax: number;
}

export function analyze(s: SimState): Analysis {
  const S1 = sources(s), nF = normalAt(s, 0), nR = normalAt(s, 52), nL = normalAt(s, -52);
  let front = 0, right = 0, left = 0, tot = 0, key: Source | null = null, keyE = -1, wsum = 0, wtot = 0;
  for (const src of S1.list) {
    const eF = illumOf(s, src, nF), eR = illumOf(s, src, nR), eL = illumOf(s, src, nL);
    src.lux = eF;
    if (src.kind === 'sun') src.inc = src.E;
    else {
      const raw = ((src.I || 0) / Math.max(0.09, (src.pos as Vector3).clone().sub(faceC(s)).lengthSq())) * (src.spill || 1);
      src.inc = src.kind === 'win' ? Math.min(raw, src.M || Infinity) : raw;
    }
    front += eF; right += eR; left += eL; tot += src.inc || 0;
    const m = Math.max(eR, eL);
    if (m > keyE) { keyE = m; key = src; }
    if (eF > 1) { wsum += eF / src.k; wtot += eF; }
  }
  const R = s.room, surf = 2 * (R.w * R.d + R.w * R.h + R.d * R.h);
  const bounce = tot * R.albedo * (38 / surf) * 0.55 + s.env.amb * 0.6;
  front += bounce; right += bounce; left += bounce;
  const hi = Math.max(right, left), lo = Math.max(1e-4, Math.min(right, left));
  const stops = Math.log2(hi / lo);
  const E = s.expo;
  const fRec = Math.sqrt((Math.max(1e-4, front) * E.iso * E.shutter) / (250 * Math.pow(2, E.nd)));
  const err = 2 * Math.log2(fRec / E.f);
  const soft = key
    ? key.kind === 'sun'
      ? 0.01
      : key.size / Math.max(0.25, (key.pos as Vector3).clone().sub(faceC(s)).length())
    : 0;
  const mixK = wtot > 0 ? 1 / (wsum / wtot) : s.expo.wb;
  let kmin = 1e9, kmax = 0;
  for (const src of S1.list)
    if ((src.lux || 0) > front * 0.08) { kmin = Math.min(kmin, src.k); kmax = Math.max(kmax, src.k); }
  return { front, hi, lo, stops, bounce, fRec, err, key, soft, src: S1.list, wd: S1.wd, mixK, kmin, kmax };
}

/** 톤매핑 노출 (docs §4.8): 18% 그레이가 화면 0.18 근처로 */
export function toneMappingExposure(s: SimState): number {
  const E = s.expo;
  return (1.18 * Math.PI * E.iso * E.shutter) / (250 * E.f * E.f * Math.pow(2, E.nd));
}

/** 현재 조도에서 ND + 조리개를 적정 노출로 (docs fitExposure) */
export function fitExposure(s: SimState): { nd: number; f: number } {
  const a = analyze(s);
  const want = (Math.max(1e-4, a.front) * s.expo.iso * s.expo.shutter) / 250; // = f² · 2^nd
  let best: { nd: number; f: number; score: number } | null = null;
  for (let nd = 0; nd <= 10; nd++) {
    const fr = Math.sqrt(want / Math.pow(2, nd));
    if (fr < 1.2 || fr > 22) continue;
    const f = nearestStop(fr);
    const score = Math.abs(2 * Math.log2(fr / f)) + Math.abs(Math.log2(f / 2.8)) * 0.35;
    if (!best || score < best.score) best = { nd, f, score };
  }
  return best ? { nd: best.nd, f: best.f } : { nd: s.expo.nd, f: s.expo.f };
}
