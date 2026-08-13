/**
 * lenses.ts — Sony FE(풀프레임 E마운트) 렌즈 라인업
 *
 * 카메라 바디는 풀프레임(α7/α1 계열)으로 가정하므로 초점거리는 곧 35mm 환산값이다.
 * 렌즈를 고르면 줌 범위(focalMin..focalMax)와 개방 조리개(apWide..apWideTele),
 * 최소 조리개(apMin)로 촬영 설정이 제한된다.
 */

export interface Lens {
  id: string;
  /** 정식 표기 */
  label: string;
  /** 짧은 표기(패널 캡션용) */
  short: string;
  /** 계열 뱃지 */
  grade: 'GM' | 'G' | 'kit';
  focalMin: number;
  focalMax: number;
  /** 최대개방 조리개(광각단) */
  apWide: number;
  /** 최대개방 조리개(망원단). 고정조리개면 apWide와 동일 */
  apWideTele: number;
  /** 최소 조리개(가장 조인 값) */
  apMin: number;
}

/** 표준 조리개 스톱(1/3 스톱 개방값 포함) */
export const FSTOPS = [1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32];

/** 광각 → 망원 순으로 정렬된 라인업 */
const LIST: Lens[] = [
  // ── 프라임 ──────────────────────────────────────────────
  { id: 'fe20g',     label: 'FE 20mm F1.8 G',        short: '20 G',        grade: 'G',  focalMin: 20,  focalMax: 20,  apWide: 1.8, apWideTele: 1.8, apMin: 22 },
  { id: 'fe24gm',    label: 'FE 24mm F1.4 GM',       short: '24 GM',       grade: 'GM', focalMin: 24,  focalMax: 24,  apWide: 1.4, apWideTele: 1.4, apMin: 16 },
  { id: 'fe35gm',    label: 'FE 35mm F1.4 GM',       short: '35 GM',       grade: 'GM', focalMin: 35,  focalMax: 35,  apWide: 1.4, apWideTele: 1.4, apMin: 16 },
  { id: 'fe50gm',    label: 'FE 50mm F1.2 GM',       short: '50 GM',       grade: 'GM', focalMin: 50,  focalMax: 50,  apWide: 1.2, apWideTele: 1.2, apMin: 16 },
  { id: 'fe85gm',    label: 'FE 85mm F1.4 GM',       short: '85 GM',       grade: 'GM', focalMin: 85,  focalMax: 85,  apWide: 1.4, apWideTele: 1.4, apMin: 16 },
  { id: 'fe135gm',   label: 'FE 135mm F1.8 GM',      short: '135 GM',      grade: 'GM', focalMin: 135, focalMax: 135, apWide: 1.8, apWideTele: 1.8, apMin: 22 },
  // ── 줌 ─────────────────────────────────────────────────
  { id: 'fe1635gm2', label: 'FE 16-35mm F2.8 GM II', short: '16-35 GM II', grade: 'GM', focalMin: 16,  focalMax: 35,  apWide: 2.8, apWideTele: 2.8, apMin: 22 },
  { id: 'fe2470gm2', label: 'FE 24-70mm F2.8 GM II', short: '24-70 GM II', grade: 'GM', focalMin: 24,  focalMax: 70,  apWide: 2.8, apWideTele: 2.8, apMin: 22 },
  { id: 'fe24105g',  label: 'FE 24-105mm F4 G',      short: '24-105 G',    grade: 'G',  focalMin: 24,  focalMax: 105, apWide: 4,   apWideTele: 4,   apMin: 22 },
  { id: 'fe70200gm2',label: 'FE 70-200mm F2.8 GM II',short: '70-200 GM II',grade: 'GM', focalMin: 70,  focalMax: 200, apWide: 2.8, apWideTele: 2.8, apMin: 22 },
  { id: 'fe2870',    label: 'FE 28-70mm F3.5-5.6 OSS',short: '28-70 kit',  grade: 'kit',focalMin: 28,  focalMax: 70,  apWide: 3.5, apWideTele: 5.6, apMin: 22 },
  { id: 'fe100400gm',label: 'FE 100-400mm F4.5-5.6 GM',short: '100-400 GM',grade: 'GM', focalMin: 100, focalMax: 400, apWide: 4.5, apWideTele: 5.6, apMin: 32 },
];

export const LENSES: Record<string, Lens> = Object.fromEntries(LIST.map((l) => [l.id, l]));

/** 셀렉트 표시 순서(라인업 원본 순서 유지) */
export const LENS_ORDER: string[] = LIST.map((l) => l.id);

export const DEFAULT_LENS = 'fe2470gm2';

export function getLens(id: string): Lens {
  return LENSES[id] ?? LENSES[DEFAULT_LENS];
}

export function isPrime(L: Lens): boolean {
  return L.focalMin === L.focalMax;
}

/** 값을 [lo,hi] 로 클램프 */
function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** 초점거리를 렌즈 줌 범위로 클램프 */
export function clampFocal(L: Lens, focal: number): number {
  return Math.round(clamp(focal, L.focalMin, L.focalMax));
}

/**
 * 해당 초점거리에서의 최대개방 조리개(f수).
 * 가변조리개 줌은 스톱(log2 f) 공간에서 선형 보간한다.
 */
export function maxApertureAt(L: Lens, focal: number): number {
  if (L.apWide === L.apWideTele || isPrime(L)) return L.apWide;
  const t = clamp((focal - L.focalMin) / (L.focalMax - L.focalMin || 1), 0, 1);
  const a = Math.log2(L.apWide);
  const b = Math.log2(L.apWideTele);
  return Math.pow(2, a + (b - a) * t);
}

/** 현재 렌즈·초점거리에서 선택 가능한 조리개 스톱 목록(개방→최소) */
export function apertureStops(L: Lens, focal: number): number[] {
  const wide = maxApertureAt(L, focal);
  const list = FSTOPS.filter((f) => f >= wide - 1e-3 && f <= L.apMin);
  // 가변조리개라 개방값이 표준 스톱과 다르면 실제 개방값을 맨 앞에 추가
  const rounded = Math.round(wide * 10) / 10;
  if (!list.some((f) => Math.abs(f - rounded) < 0.05)) list.unshift(rounded);
  return list;
}

/** 조리개 f수를 현재 렌즈·초점거리에서 유효한 값으로 스냅 */
export function clampAperture(L: Lens, focal: number, f: number): number {
  const stops = apertureStops(L, focal);
  let best = stops[0];
  let bd = Infinity;
  for (const s of stops) {
    const d = Math.abs(s - f);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

/**
 * 주어진 초점거리를 커버하는 렌즈 id.
 * 표준→광각→망원 줌 우선, 없으면 초점거리가 가장 가까운 프라임.
 */
export function lensForFocal(focal: number): string {
  const zoomPriority = ['fe2470gm2', 'fe1635gm2', 'fe70200gm2', 'fe24105g', 'fe100400gm'];
  for (const id of zoomPriority) {
    const L = LENSES[id];
    if (focal >= L.focalMin && focal <= L.focalMax) return id;
  }
  let best = DEFAULT_LENS;
  let bd = Infinity;
  for (const L of LIST) {
    if (!isPrime(L)) continue;
    const d = Math.abs(L.focalMin - focal);
    if (d < bd) {
      bd = d;
      best = L.id;
    }
  }
  return best;
}

/** 풀프레임 수평 화각(도) — 캡션 표시용 */
export function horizontalFov(focal: number): number {
  return (2 * Math.atan(36 / (2 * focal)) * 180) / Math.PI;
}
