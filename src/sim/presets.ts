/**
 * presets.ts — 조명 프리셋(기재 배치) + 공간 프리셋(방·환경·창)
 * docs의 PRESETS/SPACES 이식. 조명과 공간은 독립 적용된다.
 */
import type { LightState, Pose, SimState, WinState } from './types';

/** id 없는 조명 스펙 (스토어가 id 부여) */
export type LightSpec = Omit<LightState, 'id'>;
export type WinSpec = Omit<WinState, 'id'>;

const L = (o: Partial<LightSpec>): LightSpec => ({
  on: true,
  name: '라이트',
  fix: 'am200x',
  mod: 'dome',
  dim: 100,
  kelvin: 5600,
  az: 40,
  dist: 1.8,
  h: 1.9,
  shadow: true,
  aim: 'subj',
  ...o,
});

const W = (o: Partial<WinSpec>): WinSpec => ({
  on: true,
  wall: 'left',
  u: 0,
  w: 1.6,
  h: 1.5,
  sill: 0.9,
  curtain: 100,
  ...o,
});

/* ---------------- 조명 프리셋 ---------------- */

export interface LightingPreset {
  cam: { dist: number; h: number; focal: number };
  subj: { pose: Pose; eyeH: number };
  lights: LightSpec[];
}

export const LIGHTING_PRESETS: Record<string, { label: string; make: () => LightingPreset }> = {
  interview: {
    label: '인터뷰 3점',
    make: () => ({
      cam: { dist: 2.0, h: 1.26, focal: 65 },
      subj: { pose: 'sit', eyeH: 1.28 },
      lights: [
        L({ name: '키', fix: 'am200x', mod: 'dome', dim: 74, kelvin: 5600, az: 38, dist: 1.7, h: 1.9 }),
        L({ name: '필', fix: 'am100', mod: 'umbrella', dim: 26, kelvin: 5600, az: -42, dist: 2.1, h: 1.65 }),
        L({ name: '백/림', fix: 'sl60', mod: 'fresnel', dim: 25, kelvin: 6000, az: 145, dist: 1.8, h: 2.2 }),
        L({ name: '배경', fix: 'am100', mod: 'grid', dim: 100, kelvin: 4200, az: -148, dist: 2.4, h: 1.35, shadow: false, aim: 'bg' }),
      ],
    }),
  },
  daylight: {
    label: '창광 + 반사판',
    make: () => ({
      cam: { dist: 1.9, h: 1.24, focal: 65 },
      subj: { pose: 'sit', eyeH: 1.26 },
      lights: [
        L({ name: '반사판', fix: 'bounce', mod: 'none', dim: 45, kelvin: 6200, az: 58, dist: 1.05, h: 1.3, shadow: false }),
        L({ name: '림', fix: 'sl60', mod: 'grid', dim: 89, kelvin: 6500, az: 150, dist: 1.7, h: 2.1 }),
      ],
    }),
  },
  rembrandt: {
    label: '렘브란트',
    make: () => ({
      cam: { dist: 1.8, h: 1.28, focal: 85 },
      subj: { pose: 'sit', eyeH: 1.3 },
      lights: [
        L({ name: '키', fix: 'ls300x', mod: 'sb60', dim: 43, kelvin: 5200, az: 47, dist: 1.45, h: 2.1 }),
        L({ name: '반사판', fix: 'bounce', mod: 'none', dim: 12, kelvin: 5200, az: -52, dist: 1.05, h: 1.25, shadow: false }),
        L({ name: '림', fix: 'sl60', mod: 'fresnel', dim: 31, kelvin: 6500, az: 160, dist: 1.6, h: 2.05 }),
      ],
    }),
  },
  night: {
    label: '야간 실내',
    make: () => ({
      cam: { dist: 1.9, h: 1.24, focal: 50 },
      subj: { pose: 'sit', eyeH: 1.26 },
      lights: [
        L({ name: '키', fix: 'am100', mod: 'lantern', dim: 49, kelvin: 3600, az: 30, dist: 1.55, h: 1.95 }),
        L({ name: '프랙티컬', fix: 'prac', mod: 'none', dim: 100, kelvin: 2700, az: -138, dist: 2.3, h: 1.05, shadow: false, aim: 'bg' }),
        L({ name: '림(창측)', fix: 'pavo30', mod: 'none', dim: 90, kelvin: 6500, az: -160, dist: 1.8, h: 1.9 }),
      ],
    }),
  },
  church: {
    label: '강단 / 무대',
    make: () => ({
      cam: { dist: 3.2, h: 1.55, focal: 85 },
      subj: { pose: 'stand', eyeH: 1.62 },
      lights: [
        L({ name: '키', fix: 'ls600d', mod: 'domexl', dim: 87, kelvin: 5200, az: 34, dist: 2.6, h: 2.6 }),
        L({ name: '필', fix: 'am200x', mod: 'octa150', dim: 12, kelvin: 5200, az: -36, dist: 3.0, h: 2.3 }),
        L({ name: '백', fix: 'sl60', mod: 'fresnel', dim: 52, kelvin: 5600, az: 150, dist: 2.8, h: 3.2 }),
      ],
    }),
  },
  flat: {
    label: '밝은 플랫',
    make: () => ({
      cam: { dist: 2.6, h: 1.55, focal: 50 },
      subj: { pose: 'stand', eyeH: 1.6 },
      lights: [
        L({ name: '키', fix: 'am200x', mod: 'domexl', dim: 41, kelvin: 5600, az: 24, dist: 2.0, h: 1.95 }),
        L({ name: '필', fix: 'am200x', mod: 'domexl', dim: 17, kelvin: 5600, az: -27, dist: 2.0, h: 1.95 }),
        L({ name: '백', fix: 'sl60', mod: 'fresnel', dim: 9, kelvin: 5600, az: 165, dist: 2.1, h: 2.4 }),
        L({ name: '배경', fix: 'p60c', mod: 'diff', dim: 68, kelvin: 5600, az: -144, dist: 2.8, h: 1.6, shadow: false, aim: 'bg' }),
      ],
    }),
  },
};

/* ---------------- 공간 프리셋 ---------------- */

export interface SpacePreset {
  label: string;
  room: SimState['room'];
  env: SimState['env'];
  subj: SimState['subj'];
  wins: () => WinSpec[];
}

export const SPACE_PRESETS: Record<string, SpacePreset> = {
  studio: {
    label: '소형 스튜디오',
    room: { w: 5, d: 7, h: 2.9, albedo: 0.16, floor: 'concrete', props: 0 },
    env: { mode: 'day', time: 14, sky: 'overcast', amb: 0, orient: 180, season: 'mid' },
    subj: { x: 0, z: -0.6, yaw: 0, pose: 'sit', eyeH: 1.28 },
    wins: () => [],
  },
  office: {
    label: '사무실 · 회의실',
    room: { w: 6.5, d: 9, h: 2.7, albedo: 0.62, floor: 'carpet', props: 1 },
    env: { mode: 'day', time: 13, sky: 'cloud', amb: 180, orient: 90, season: 'mid' },
    subj: { x: 0.4, z: -1.2, yaw: 0, pose: 'sit', eyeH: 1.26 },
    wins: () => [W({ wall: 'left', u: 0, w: 3.2, h: 1.5, sill: 0.95, curtain: 100 })],
  },
  cafe: {
    label: '카페 창가',
    room: { w: 4.2, d: 7, h: 2.8, albedo: 0.42, floor: 'wood', props: 1 },
    env: { mode: 'day', time: 10.5, sky: 'clear', amb: 60, orient: 180, season: 'mid' },
    subj: { x: -0.9, z: -0.5, yaw: 34, pose: 'sit', eyeH: 1.24 },
    wins: () => [W({ wall: 'left', u: 0, w: 2.4, h: 1.8, sill: 0.75, curtain: 70 })],
  },
  bridal: {
    label: '신부대기실',
    room: { w: 5.5, d: 6.5, h: 2.8, albedo: 0.74, floor: 'tile', props: 1 },
    env: { mode: 'day', time: 12, sky: 'clear', amb: 120, orient: 135, season: 'mid' },
    subj: { x: 0, z: -0.8, yaw: 0, pose: 'sit', eyeH: 1.3 },
    wins: () => [W({ wall: 'right', u: 0.4, w: 2.0, h: 1.7, sill: 0.85, curtain: 60 })],
  },
  church: {
    label: '예배당 본당',
    room: { w: 14, d: 19, h: 6.8, albedo: 0.44, floor: 'wood', props: 0 },
    env: { mode: 'day', time: 11, sky: 'clear', amb: 140, orient: 180, season: 'mid' },
    subj: { x: 0, z: -6.2, yaw: 0, pose: 'stand', eyeH: 1.62 },
    wins: () => [
      W({ wall: 'left', u: -3, w: 1.4, h: 2.8, sill: 2.4, curtain: 100 }),
      W({ wall: 'left', u: 1.5, w: 1.4, h: 2.8, sill: 2.4, curtain: 100 }),
      W({ wall: 'right', u: -3, w: 1.4, h: 2.8, sill: 2.4, curtain: 100 }),
      W({ wall: 'right', u: 1.5, w: 1.4, h: 2.8, sill: 2.4, curtain: 100 }),
    ],
  },
  hall: {
    label: '연회장 / 홀',
    room: { w: 12, d: 16, h: 4.4, albedo: 0.28, floor: 'carpet', props: 1 },
    env: { mode: 'night', time: 19, sky: 'clear', amb: 70, orient: 270, season: 'mid' },
    subj: { x: 0, z: -3.2, yaw: 0, pose: 'stand', eyeH: 1.6 },
    wins: () => [],
  },
};
