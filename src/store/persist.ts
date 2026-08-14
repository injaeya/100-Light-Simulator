/**
 * persist.ts — 상태 영속화 · 공유 (P1)
 *
 * 저장 계약: { v, sim, ui } 단일 객체. v(버전) 필드로 하위호환.
 * 알 수 없는 버전/손상 데이터는 무시하고 기본값으로 폴백(파괴적 변경 없음).
 *
 * - 자동 저장/복원: lp:autosave (부팅 시 URL 해시 > 자동저장 순으로 복원)
 * - 명명 프로젝트: lp:projects (저장·불러오기·삭제)
 * - 공유: 상태를 base64url 로 인코딩해 URL #s= 해시로
 */
import type { CamState, LightState, SimState, WinState } from '../sim/types';
import { L as makeLightSpec, W as makeWinSpec } from '../sim/presets';

/** 저장 스키마 버전 — 스키마 파괴 변경 시 올린다 */
export const PERSIST_V = 1;

export interface PersistedUI {
  view?: 'cam' | 'free';
  showHelpers?: boolean;
  showBeams?: boolean;
  showPlan?: boolean;
  showMeter?: boolean;
  spaceKey?: string;
  lightingKey?: string;
}

export interface Persisted {
  v: number;
  sim: SimState;
  ui?: PersistedUI;
}

const AUTOSAVE_KEY = 'lp:autosave';
const PROJECTS_KEY = 'lp:projects';

/* ------------------------------------------------------------------ */
/* 직렬화 · 검증                                                        */
/* ------------------------------------------------------------------ */

export function encode(p: Persisted): string {
  return JSON.stringify(p);
}

/** 문자열 → Persisted (버전/형태 검증). 실패 시 null */
export function decode(raw: string): Persisted | null {
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    if (o.v !== PERSIST_V) return null; // 버전 불일치 → 폴백
    if (!o.sim || !Array.isArray(o.sim.cams) || !Array.isArray(o.sim.lights)) return null;
    return o as Persisted;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* 하이드레이션 — 로드된 sim 을 기본값 위에 병합(누락 필드 보강)          */
/* ------------------------------------------------------------------ */

const CAM_DEF: Omit<CamState, 'id'> = {
  name: 'CAM',
  place: 'stage',
  az: 0,
  dist: 2,
  h: 1.3,
  x: 0,
  z: 0,
  aim: 'subj',
  tx: 0,
  ty: 1.3,
  tz: 0,
  focal: 50,
  lens: 'fe2470gm2',
};

/** 로드된 SimState 를 fresh(기본) 위에 병합해 누락 필드를 보강한다 */
export function hydrateSim(loaded: SimState, fresh: SimState): SimState {
  const cams = (loaded.cams?.length ? loaded.cams : fresh.cams).map((c) => ({
    ...CAM_DEF,
    ...c,
    id: c.id,
  })) as CamState[];
  const activeCamId = cams.some((c) => c.id === loaded.activeCamId) ? loaded.activeCamId : cams[0].id;
  const lights = (loaded.lights ?? []).map((l) => ({ ...makeLightSpec(l), id: l.id })) as LightState[];
  const wins = (loaded.wins ?? []).map((w) => ({ ...makeWinSpec(w), id: w.id })) as WinState[];
  return {
    cams,
    activeCamId,
    expo: { ...fresh.expo, ...loaded.expo },
    subj: { ...fresh.subj, ...loaded.subj },
    room: { ...fresh.room, ...loaded.room },
    env: { ...fresh.env, ...loaded.env },
    wins,
    lights,
    stage: { ...fresh.stage, ...loaded.stage },
  };
}

/** cams/lights/wins 를 통틀어 가장 큰 id (uid 카운터 재조정용) */
export function maxId(sim: SimState): number {
  let m = 0;
  for (const c of sim.cams) m = Math.max(m, c.id);
  for (const l of sim.lights) m = Math.max(m, l.id);
  for (const w of sim.wins) m = Math.max(m, w.id);
  return m;
}

/* ------------------------------------------------------------------ */
/* 자동 저장                                                            */
/* ------------------------------------------------------------------ */

export function saveAutosave(p: Persisted): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, encode(p));
  } catch {
    /* 저장 용량 초과 등 — 무시 */
  }
}

export function loadAutosave(): Persisted | null {
  try {
    const r = localStorage.getItem(AUTOSAVE_KEY);
    return r ? decode(r) : null;
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* 명명 프로젝트                                                        */
/* ------------------------------------------------------------------ */

export interface ProjectRow {
  id: string;
  name: string;
  at: number;
  payload: string; // encode(Persisted)
}
export interface ProjectMeta {
  id: string;
  name: string;
  at: number;
}

function readProjects(): ProjectRow[] {
  try {
    const r = localStorage.getItem(PROJECTS_KEY);
    const a = r ? JSON.parse(r) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}
function writeProjects(rows: ProjectRow[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function listProjects(): ProjectMeta[] {
  return readProjects()
    .map(({ id, name, at }) => ({ id, name, at }))
    .sort((a, b) => b.at - a.at);
}

/** 저장(같은 이름이면 덮어씀). 저장된 메타 반환 */
export function saveProject(name: string, p: Persisted): ProjectMeta {
  const rows = readProjects();
  const at = Date.now();
  const existing = rows.find((r) => r.name === name);
  const id = existing?.id ?? `p_${at.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const row: ProjectRow = { id, name, at, payload: encode(p) };
  const next = existing ? rows.map((r) => (r.id === id ? row : r)) : [...rows, row];
  writeProjects(next);
  return { id, name, at };
}

export function loadProject(id: string): Persisted | null {
  const row = readProjects().find((r) => r.id === id);
  return row ? decode(row.payload) : null;
}

export function deleteProject(id: string): void {
  writeProjects(readProjects().filter((r) => r.id !== id));
}

/* ------------------------------------------------------------------ */
/* 공유 URL (base64url 해시)                                            */
/* ------------------------------------------------------------------ */

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(b: string): string {
  const bin = atob(b.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeHash(p: Persisted): string {
  return toB64Url(encode(p));
}
export function decodeHash(hash: string): Persisted | null {
  try {
    return decode(fromB64Url(hash));
  } catch {
    return null;
  }
}

/** 현재 상태로 공유 URL 생성 */
export function buildShareUrl(p: Persisted): string {
  const { origin, pathname } = location;
  return `${origin}${pathname}#s=${encodeHash(p)}`;
}

/** URL 해시에서 공유 상태 추출(있으면). 추출 후 해시는 호출측에서 정리 */
export function readShareHash(): Persisted | null {
  const m = location.hash.match(/[#&]s=([^&]+)/);
  return m ? decodeHash(m[1]) : null;
}

/** URL 해시 제거(공유 링크 로드 후 깨끗하게) */
export function clearShareHash(): void {
  try {
    history.replaceState(null, '', location.pathname + location.search);
  } catch {
    /* ignore */
  }
}

/** 부팅 복원: URL 해시(공유) > 자동저장 */
export function loadBoot(): { p: Persisted; fromShare: boolean } | null {
  const share = readShareHash();
  if (share) return { p: share, fromShare: true };
  const auto = loadAutosave();
  if (auto) return { p: auto, fromShare: false };
  return null;
}
