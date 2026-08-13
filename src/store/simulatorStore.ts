/**
 * simulatorStore.ts — LIGHTPLAN 상태 스토어 (zustand)
 * 공간(방·환경·창)과 조명(기재 배치)을 독립 적용한다.
 */
import { create } from 'zustand';
import type {
  CamState,
  EnvState,
  ExpoState,
  LightState,
  RoomState,
  SimState,
  SubjState,
  WinState,
} from '../sim/types';
import { LIGHTING_PRESETS, SPACE_PRESETS } from '../sim/presets';
import { fitExposure } from '../sim/photometry';
import { FIXTURES } from '../sim/fixtures';
import { modsFor } from '../sim/modifiers';

export type ViewMode = 'cam' | 'free';

let uid = 1;
const nextId = () => uid++;

function withIds<T extends { id?: number }>(specs: Omit<T, 'id'>[]): T[] {
  return specs.map((sp) => ({ ...sp, id: nextId() }) as T);
}

/** 기본 상태 = 스튜디오 공간 + 인터뷰 조명 */
function makeInitialState(): SimState {
  const space = SPACE_PRESETS.studio;
  const lp = LIGHTING_PRESETS.interview.make();
  const base: SimState = {
    cam: { az: 0, dist: lp.cam.dist, h: lp.cam.h, focal: lp.cam.focal },
    expo: { iso: 800, shutter: 1 / 50, f: 2.8, nd: 2, wb: 5600 },
    subj: { ...space.subj, pose: lp.subj.pose, eyeH: lp.subj.eyeH },
    room: { ...space.room },
    env: { ...space.env },
    wins: withIds<WinState>(space.wins()),
    lights: withIds<LightState>(lp.lights),
  };
  const fit = fitExposure(base);
  base.expo.nd = fit.nd;
  base.expo.f = fit.f;
  return base;
}

interface UIState {
  view: ViewMode;
  selectedLightId: number | null;
  selectedWinId: number | null;
  showHelpers: boolean;
  spaceKey: string;
  lightingKey: string;
}

interface Actions {
  setCam: (patch: Partial<CamState>) => void;
  setExpo: (patch: Partial<ExpoState>) => void;
  setSubj: (patch: Partial<SubjState>) => void;
  setRoom: (patch: Partial<RoomState>) => void;
  setEnv: (patch: Partial<EnvState>) => void;

  addLight: (fix?: string) => void;
  removeLight: (id: number) => void;
  updateLight: (id: number, patch: Partial<LightState>) => void;
  selectLight: (id: number | null) => void;

  addWin: () => void;
  removeWin: (id: number) => void;
  updateWin: (id: number, patch: Partial<WinState>) => void;
  selectWin: (id: number | null) => void;

  applyLighting: (key: string) => void;
  applySpace: (key: string) => void;
  fitExposureNow: () => void;

  setView: (v: ViewMode) => void;
  toggleHelpers: () => void;
}

export type Store = SimState & UIState & Actions;

/** 방 경계 안으로 피사체·창 클램프 */
function clampPlacement(s: SimState) {
  const R = s.room, m = 0.25;
  s.subj.x = Math.min(R.w / 2 - m, Math.max(-R.w / 2 + m, s.subj.x));
  s.subj.z = Math.min(R.d / 2 - m, Math.max(-R.d / 2 + m, s.subj.z));
  for (const W of s.wins) {
    const half = W.wall === 'left' || W.wall === 'right' ? R.d / 2 : R.w / 2;
    W.w = Math.min(W.w, half * 2 - 0.2);
    W.u = Math.min(half - W.w / 2, Math.max(-half + W.w / 2, W.u));
    W.h = Math.min(W.h, R.h - 0.15);
    W.sill = Math.min(R.h - W.h - 0.05, Math.max(0, W.sill));
  }
}

export const useSimulatorStore = create<Store>((set) => ({
  ...makeInitialState(),
  view: 'cam',
  selectedLightId: null,
  selectedWinId: null,
  showHelpers: true,
  spaceKey: 'studio',
  lightingKey: 'interview',

  setCam: (patch) => set((s) => ({ cam: { ...s.cam, ...patch } })),
  setExpo: (patch) => set((s) => ({ expo: { ...s.expo, ...patch } })),
  setSubj: (patch) =>
    set((s) => {
      const next = { ...s, subj: { ...s.subj, ...patch } };
      clampPlacement(next);
      return { subj: next.subj, wins: next.wins };
    }),
  setRoom: (patch) =>
    set((s) => {
      const next: SimState = { ...s, room: { ...s.room, ...patch }, wins: s.wins.map((w) => ({ ...w })), subj: { ...s.subj } };
      clampPlacement(next);
      return { room: next.room, subj: next.subj, wins: next.wins };
    }),
  setEnv: (patch) => set((s) => ({ env: { ...s.env, ...patch } })),

  addLight: (fix = 'am200x') =>
    set((s) => {
      const mods = modsFor(fix);
      const cct = FIXTURES[fix].cct;
      const light: LightState = {
        id: nextId(),
        on: true,
        name: FIXTURES[fix].label.split(' ')[0],
        fix,
        mod: mods.includes('sb60') ? 'sb60' : mods[0],
        dim: 100,
        kelvin: Math.round((cct[0] + cct[1]) / 2),
        az: 40,
        dist: 1.8,
        h: 1.9,
        shadow: true,
        aim: 'subj',
      };
      return { lights: [...s.lights, light], selectedLightId: light.id };
    }),
  removeLight: (id) =>
    set((s) => ({
      lights: s.lights.filter((l) => l.id !== id),
      selectedLightId: s.selectedLightId === id ? null : s.selectedLightId,
    })),
  updateLight: (id, patch) =>
    set((s) => ({
      lights: s.lights.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        // 기재를 바꾸면 모디파이어 호환성 보정
        if (patch.fix && !modsFor(patch.fix).includes(next.mod)) {
          next.mod = modsFor(patch.fix)[0];
        }
        return next;
      }),
    })),
  selectLight: (id) => set({ selectedLightId: id, selectedWinId: null }),

  addWin: () =>
    set((s) => {
      const win: WinState = { id: nextId(), on: true, wall: 'left', u: 0, w: 1.6, h: 1.5, sill: 0.9, curtain: 100 };
      const next: SimState = { ...s, wins: [...s.wins, win] };
      clampPlacement(next);
      return { wins: next.wins, selectedWinId: win.id };
    }),
  removeWin: (id) =>
    set((s) => ({
      wins: s.wins.filter((w) => w.id !== id),
      selectedWinId: s.selectedWinId === id ? null : s.selectedWinId,
    })),
  updateWin: (id, patch) =>
    set((s) => {
      const next: SimState = { ...s, wins: s.wins.map((w) => (w.id === id ? { ...w, ...patch } : w)) };
      clampPlacement(next);
      return { wins: next.wins };
    }),
  selectWin: (id) => set({ selectedWinId: id, selectedLightId: null }),

  applyLighting: (key) =>
    set((s) => {
      const P = LIGHTING_PRESETS[key];
      if (!P) return s;
      const lp = P.make();
      const base: SimState = {
        ...s,
        cam: { ...s.cam, dist: lp.cam.dist, h: lp.cam.h, focal: lp.cam.focal },
        subj: { ...s.subj, pose: lp.subj.pose, eyeH: lp.subj.eyeH },
        lights: withIds<LightState>(lp.lights),
      };
      const fit = fitExposure(base);
      return {
        cam: base.cam,
        subj: base.subj,
        lights: base.lights,
        expo: { ...s.expo, nd: fit.nd, f: fit.f },
        lightingKey: key,
        selectedLightId: null,
      };
    }),

  applySpace: (key) =>
    set((s) => {
      const P = SPACE_PRESETS[key];
      if (!P) return s;
      const base: SimState = {
        ...s,
        room: { ...P.room },
        env: { ...P.env },
        subj: { ...P.subj },
        wins: withIds<WinState>(P.wins()),
      };
      clampPlacement(base);
      const fit = fitExposure(base);
      return {
        room: base.room,
        env: base.env,
        subj: base.subj,
        wins: base.wins,
        expo: { ...s.expo, nd: fit.nd, f: fit.f },
        spaceKey: key,
        selectedWinId: null,
      };
    }),

  fitExposureNow: () =>
    set((s) => {
      const fit = fitExposure(s);
      return { expo: { ...s.expo, nd: fit.nd, f: fit.f } };
    }),

  setView: (v) => set({ view: v }),
  toggleHelpers: () => set((s) => ({ showHelpers: !s.showHelpers })),
}));

/** 셀렉터 헬퍼: 현재 SimState만 추출 */
export function pickSimState(s: Store): SimState {
  return { cam: s.cam, expo: s.expo, subj: s.subj, room: s.room, env: s.env, wins: s.wins, lights: s.lights };
}
