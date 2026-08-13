/**
 * modifiers.ts — 모디파이어 라이브러리 (docs 부록 B)
 * mult = 표준 리플렉터 대비 축상 광도 비율.
 */
import { FIXTURES } from './fixtures';

export interface Modifier {
  key: string;
  label: string;
  /** 축상 광도 배율 */
  mult: number;
  /** 발광면 크기(m). 없으면 기재 size × sizeMul */
  size?: number;
  sizeMul?: number;
  /** COB 전용 여부 */
  cob?: boolean;
}

export const MODIFIERS: Record<string, Modifier> = {
  reflector: { key: 'reflector', label: '표준 리플렉터', mult: 1.0, size: 0.18, cob: true },
  fresnel: { key: 'fresnel', label: '프레넬 (스팟)', mult: 2.4, size: 0.16, cob: true },
  bare: { key: 'bare', label: '베어벌브', mult: 0.12, size: 0.1, cob: true },
  sb60: { key: 'sb60', label: '소프트박스 60cm', mult: 0.16, size: 0.6, cob: true },
  dome: { key: 'dome', label: '라이트돔 90cm', mult: 0.11, size: 0.9, cob: true },
  domexl: { key: 'domexl', label: '라이트돔 XL 120cm', mult: 0.07, size: 1.2, cob: true },
  octa150: { key: 'octa150', label: '옥타박스 150cm', mult: 0.05, size: 1.5, cob: true },
  lantern: { key: 'lantern', label: '랜턴 65cm', mult: 0.06, size: 0.65, cob: true },
  umbrella: { key: 'umbrella', label: '투과 우산 110cm', mult: 0.13, size: 1.1, cob: true },
  book: { key: 'book', label: '북라이트 / 바운스', mult: 0.04, size: 1.4, cob: true },
  none: { key: 'none', label: '모디파이어 없음', mult: 1.0, sizeMul: 1.0 },
  diff: { key: 'diff', label: '디퓨전 시트', mult: 0.68, sizeMul: 1.15 },
  grid: { key: 'grid', label: '허니컴 그리드', mult: 0.88, sizeMul: 0.85 },
};

/** 스포트라이트 원뿔각 [angle(rad), penumbra] */
export const MOD_ANGLE: Record<string, [number, number]> = {
  fresnel: [0.45, 0.35],
  grid: [0.55, 0.5],
  reflector: [0.75, 0.7],
  bare: [1.25, 1.0],
};
export const DEFAULT_ANGLE: [number, number] = [0.98, 1.0];

/** 기재 kind에 맞는 모디파이어 목록 (cob면 cob 전용, 아니면 비-cob) */
export function modsFor(fixKey: string): string[] {
  const isCob = FIXTURES[fixKey].kind === 'cob';
  return Object.keys(MODIFIERS).filter((k) => (isCob ? !!MODIFIERS[k].cob : !MODIFIERS[k].cob));
}
