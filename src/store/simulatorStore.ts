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
import { clampAperture, clampFocal, getLens, lensForFocal } from '../sim/lenses';
import { activeCam, camAim, camPos, lightAim, lightVec } from '../sim/coords';
import {
  PERSIST_V,
  clearShareHash,
  hydrateSim,
  loadBoot,
  maxId,
  saveAutosave,
  type Persisted,
  type PersistedUI,
} from './persist';

export type ViewMode = 'cam' | 'free';
export type Theme = 'light' | 'dark';

function initTheme(): Theme {
  try {
    const saved = localStorage.getItem('lp-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

let uid = 1;
const nextId = () => uid++;

function withIds<T extends { id?: number }>(specs: Omit<T, 'id'>[]): T[] {
  return specs.map((sp) => ({ ...sp, id: nextId() }) as T);
}

/** 카메라 생성 — 방위·거리·높이·초점거리에서 렌즈 자동선택 */
function makeCam(
  name: string,
  o: { az: number; dist: number; h: number; focal: number },
  stage: { x: number; z: number },
  eyeH: number,
): CamState {
  const lens = lensForFocal(o.focal);
  return {
    id: nextId(),
    name,
    place: 'stage',
    az: o.az,
    dist: o.dist,
    h: o.h,
    x: stage.x,
    z: stage.z + o.dist,
    aim: 'subj',
    tx: stage.x,
    ty: eyeH,
    tz: stage.z,
    focal: clampFocal(getLens(lens), o.focal),
    lens,
  };
}

/** 기본 상태(로드 없음) = 스튜디오 공간 + 조명 없음 */
function freshInitialState(): SimState {
  const space = SPACE_PRESETS.studio;
  const lp = LIGHTING_PRESETS.interview.make();
  const stage = { x: space.subj.x, z: space.subj.z };
  const cam0 = makeCam('CAM 1', { az: 0, dist: lp.cam.dist, h: lp.cam.h, focal: lp.cam.focal }, stage, lp.subj.eyeH);
  const base: SimState = {
    cams: [cam0],
    activeCamId: cam0.id,
    expo: { iso: 800, shutter: 1 / 50, f: 2.8, nd: 2, wb: 5600 },
    subj: { ...space.subj, pose: lp.subj.pose, eyeH: lp.subj.eyeH },
    room: { ...space.room },
    // 초기엔 조명 없이 시작 — 구도(피사체·카메라·공간)부터 잡도록 실내등만 소량
    env: { ...space.env, amb: 90 },
    wins: withIds<WinState>(space.wins()),
    lights: [],
    stage,
  };
  const fit = fitExposure(base);
  base.expo.nd = fit.nd;
  base.expo.f = clampAperture(getLens(cam0.lens), cam0.focal, fit.f);
  return base;
}

/** 부팅 복원 데이터(URL 공유 해시 > 자동저장). 모듈 로드 시 1회 읽음 */
const BOOT = loadBoot();
// 공유 링크로 열었으면 적용 후 해시 정리(이후엔 자동저장이 관장)
if (BOOT?.fromShare) clearShareHash();

/** 초기 상태 = 복원본(있으면) 아니면 기본값. 복원 시 uid 카운터 재조정 */
function makeInitialState(): SimState {
  if (BOOT) {
    const sim = hydrateSim(BOOT.p.sim, freshInitialState());
    uid = Math.max(uid, maxId(sim) + 1);
    return sim;
  }
  return freshInitialState();
}

interface UIState {
  view: ViewMode;
  selectedLightId: number | null;
  selectedWinId: number | null;
  showHelpers: boolean;
  /** 빔 범위(와이어프레임 콘) 표시 */
  showBeams: boolean;
  /** 상부 배치도(플랜뷰) 표시 */
  showPlan: boolean;
  /** 라이트 미터 오버레이 표시 */
  showMeter: boolean;
  spaceKey: string;
  lightingKey: string;
  theme: Theme;
}

interface Actions {
  /** 활성 카메라 패치 */
  setCam: (patch: Partial<CamState>) => void;
  /** 임의 카메라 패치(플랜뷰 드래그 등) */
  updateCam: (id: number, patch: Partial<CamState>) => void;
  /** 카메라 추가(활성 복제) */
  addCam: () => void;
  /** 카메라 삭제(최소 1대 유지) */
  removeCam: (id: number) => void;
  /** 활성 카메라 지정 */
  selectCam: (id: number) => void;
  /** 초점거리 변경(줌) — 가변조리개 렌즈면 조리개도 유효 범위로 클램프. 활성 카메라 */
  setFocal: (focal: number) => void;
  /** 렌즈 교체 — 초점거리·조리개를 새 렌즈 스펙으로 클램프. 활성 카메라 */
  setLens: (id: string) => void;
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

  /** 저장/공유 데이터를 상태에 적용(불러오기·가져오기·공유 링크) */
  applyPersisted: (p: Persisted) => void;
  /** 새 프로젝트 — 기본값으로 초기화 */
  resetProject: () => void;

  setView: (v: ViewMode) => void;
  toggleHelpers: () => void;
  toggleBeams: () => void;
  togglePlan: () => void;
  toggleMeter: () => void;
  toggleTheme: () => void;
}

export type Store = SimState & UIState & Actions;

/** 1축 좌표를 방 절반(size/2) 안쪽 여백 m 로 클램프 */
function clampPlacement1(v: number, size: number, m: number): number {
  return Math.min(size / 2 - m, Math.max(-size / 2 + m, v));
}

/** 카메라 패치: 모드 전환 시 현재 월드값으로 시드(점프 방지) + 방 안 클램프 */
function seedClampCam(s: SimState, c: CamState, patch: Partial<CamState>): CamState {
  const next = { ...c, ...patch };
  const r2 = (v: number) => Math.round(v * 100) / 100;
  if (patch.place === 'free' && c.place !== 'free') {
    const wp = camPos(s, c);
    if (patch.x === undefined) next.x = r2(wp.x);
    if (patch.z === undefined) next.z = r2(wp.z);
  }
  if (patch.aim === 'free' && c.aim !== 'free') {
    const at = camAim(s, c);
    if (patch.tx === undefined) next.tx = r2(at.x);
    if (patch.tz === undefined) next.tz = r2(at.z);
    if (patch.ty === undefined) next.ty = r2(at.y);
  }
  const R = s.room, m = 0.12;
  next.x = clampPlacement1(next.x, R.w, m);
  next.z = clampPlacement1(next.z, R.d, m);
  next.tx = clampPlacement1(next.tx, R.w, m);
  next.tz = clampPlacement1(next.tz, R.d, m);
  next.ty = Math.min(R.h - 0.05, Math.max(0, next.ty));
  return next;
}

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
  view: BOOT?.p.ui?.view ?? 'free',
  selectedLightId: null,
  selectedWinId: null,
  showHelpers: BOOT?.p.ui?.showHelpers ?? true,
  showBeams: BOOT?.p.ui?.showBeams ?? true,
  showPlan: BOOT?.p.ui?.showPlan ?? true,
  showMeter: BOOT?.p.ui?.showMeter ?? true,
  spaceKey: BOOT?.p.ui?.spaceKey ?? 'studio',
  lightingKey: BOOT?.p.ui?.lightingKey ?? '',
  theme: initTheme(),

  updateCam: (id, patch) =>
    set((s) => ({ cams: s.cams.map((c) => (c.id === id ? seedClampCam(s, c, patch) : c)) })),
  setCam: (patch) =>
    set((s) => ({ cams: s.cams.map((c) => (c.id === s.activeCamId ? seedClampCam(s, c, patch) : c)) })),
  addCam: () =>
    set((s) => {
      const A = activeCam(s);
      const cam: CamState = {
        ...A,
        id: nextId(),
        name: `CAM ${s.cams.length + 1}`,
        // 겹치지 않게 방위 약간 회전(스테이지 배치) — 자유 배치면 위치를 옆으로
        az: A.place === 'stage' ? A.az + 35 : A.az,
        x: A.x + 0.8,
      };
      return { cams: [...s.cams, seedClampCam(s, cam, {})], activeCamId: cam.id };
    }),
  removeCam: (id) =>
    set((s) => {
      if (s.cams.length <= 1) return s;
      const cams = s.cams.filter((c) => c.id !== id);
      const activeCamId = s.activeCamId === id ? cams[0].id : s.activeCamId;
      return { cams, activeCamId };
    }),
  selectCam: (id) =>
    set((s) => {
      const C = s.cams.find((c) => c.id === id);
      if (!C) return s;
      const L = getLens(C.lens);
      return { activeCamId: id, expo: { ...s.expo, f: clampAperture(L, C.focal, s.expo.f) } };
    }),
  setFocal: (focal) =>
    set((s) => {
      const A = activeCam(s);
      const L = getLens(A.lens);
      const f = clampFocal(L, focal);
      return {
        cams: s.cams.map((c) => (c.id === A.id ? { ...c, focal: f } : c)),
        expo: { ...s.expo, f: clampAperture(L, f, s.expo.f) },
      };
    }),
  setLens: (id) =>
    set((s) => {
      const A = activeCam(s);
      const L = getLens(id);
      const focal = clampFocal(L, A.focal);
      return {
        cams: s.cams.map((c) => (c.id === A.id ? { ...c, lens: id, focal } : c)),
        expo: { ...s.expo, f: clampAperture(L, focal, s.expo.f) },
      };
    }),
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
        place: 'stage',
        // free 전환용 초기 시드(스테이지 앞쪽) — 조준은 스테이지
        x: s.stage.x, z: s.stage.z + 1.5,
        tx: s.stage.x, ty: s.subj.eyeH, tz: s.stage.z,
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
        const r2 = (v: number) => Math.round(v * 100) / 100;
        // 배치 stage→free 전환: 현재 월드 위치로 시드(점프 방지)
        if (patch.place === 'free' && l.place !== 'free') {
          const wp = lightVec(s, l);
          if (patch.x === undefined) next.x = r2(wp.x);
          if (patch.z === undefined) next.z = r2(wp.z);
        }
        // 조준 →free 전환: 현재 조준점으로 시드
        if (patch.aim === 'free' && l.aim !== 'free') {
          const at = lightAim(s, l);
          if (patch.tx === undefined) next.tx = r2(at.x);
          if (patch.tz === undefined) next.tz = r2(at.z);
          if (patch.ty === undefined) next.ty = r2(at.y);
        }
        // 월드 좌표는 방 안으로 클램프
        const R = s.room, m = 0.12;
        next.x = clampPlacement1(next.x, R.w, m);
        next.z = clampPlacement1(next.z, R.d, m);
        next.tx = clampPlacement1(next.tx, R.w, m);
        next.tz = clampPlacement1(next.tz, R.d, m);
        next.ty = Math.min(R.h - 0.05, Math.max(0, next.ty));
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
      // '조명 없음' — 모든 기재 제거
      if (!key || !LIGHTING_PRESETS[key]) {
        return { lights: [], lightingKey: '', selectedLightId: null };
      }
      const P = LIGHTING_PRESETS[key];
      const lp = P.make();
      const A = activeCam(s);
      const lensId = lensForFocal(lp.cam.focal);
      const L = getLens(lensId);
      const focal = clampFocal(L, lp.cam.focal);
      // 프리셋 카메라 값은 활성 카메라에만 적용
      const cams = s.cams.map((c) =>
        c.id === A.id ? { ...c, dist: lp.cam.dist, h: lp.cam.h, focal, lens: lensId } : c,
      );
      const base: SimState = {
        ...s,
        cams,
        subj: { ...s.subj, pose: lp.subj.pose, eyeH: lp.subj.eyeH },
        lights: withIds<LightState>(lp.lights),
      };
      const fit = fitExposure(base);
      return {
        cams,
        subj: base.subj,
        lights: base.lights,
        expo: { ...s.expo, nd: fit.nd, f: clampAperture(L, focal, fit.f) },
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
        stage: { x: P.subj.x, z: P.subj.z },
      };
      clampPlacement(base);
      const fit = fitExposure(base);
      const A = activeCam(s);
      const L = getLens(A.lens);
      return {
        room: base.room,
        env: base.env,
        subj: base.subj,
        wins: base.wins,
        stage: base.stage,
        expo: { ...s.expo, nd: fit.nd, f: clampAperture(L, A.focal, fit.f) },
        spaceKey: key,
        selectedWinId: null,
      };
    }),

  fitExposureNow: () =>
    set((s) => {
      const fit = fitExposure(s);
      const A = activeCam(s);
      const L = getLens(A.lens);
      return { expo: { ...s.expo, nd: fit.nd, f: clampAperture(L, A.focal, fit.f) } };
    }),

  applyPersisted: (p) =>
    set((s) => {
      const sim = hydrateSim(p.sim, freshInitialState());
      uid = Math.max(uid, maxId(sim) + 1);
      const ui = p.ui ?? {};
      return {
        ...sim,
        view: ui.view ?? s.view,
        showHelpers: ui.showHelpers ?? s.showHelpers,
        showBeams: ui.showBeams ?? s.showBeams,
        showPlan: ui.showPlan ?? s.showPlan,
        showMeter: ui.showMeter ?? s.showMeter,
        spaceKey: ui.spaceKey ?? s.spaceKey,
        lightingKey: ui.lightingKey ?? s.lightingKey,
        selectedLightId: null,
        selectedWinId: null,
      };
    }),
  resetProject: () =>
    set({
      ...freshInitialState(),
      spaceKey: 'studio',
      lightingKey: '',
      selectedLightId: null,
      selectedWinId: null,
    }),

  setView: (v) => set({ view: v }),
  toggleHelpers: () => set((s) => ({ showHelpers: !s.showHelpers })),
  toggleBeams: () => set((s) => ({ showBeams: !s.showBeams })),
  togglePlan: () => set((s) => ({ showPlan: !s.showPlan })),
  toggleMeter: () => set((s) => ({ showMeter: !s.showMeter })),
  toggleTheme: () =>
    set((s) => {
      const theme: Theme = s.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('lp-theme', theme);
      } catch {
        /* ignore */
      }
      return { theme };
    }),
}));

/** 셀렉터 헬퍼: 현재 SimState만 추출 */
export function pickSimState(s: Store): SimState {
  return {
    cams: s.cams,
    activeCamId: s.activeCamId,
    expo: s.expo,
    subj: s.subj,
    room: s.room,
    env: s.env,
    wins: s.wins,
    lights: s.lights,
    stage: s.stage,
  };
}

/** 저장 대상 UI 토글만 추출 */
export function pickUI(s: Store): PersistedUI {
  return {
    view: s.view,
    showHelpers: s.showHelpers,
    showBeams: s.showBeams,
    showPlan: s.showPlan,
    showMeter: s.showMeter,
    spaceKey: s.spaceKey,
    lightingKey: s.lightingKey,
  };
}

/** 현재 스토어 → 저장 페이로드 */
export function toPersisted(s: Store): Persisted {
  return { v: PERSIST_V, sim: pickSimState(s), ui: pickUI(s) };
}

/* 자동 저장 — 상태 변경 시 디바운스(500ms)로 localStorage 기록 */
let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
useSimulatorStore.subscribe((s) => {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveAutosave(toPersisted(s)), 500);
});
