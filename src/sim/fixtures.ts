/**
 * fixtures.ts — 실제 판매 조명 기재 라이브러리 (docs 부록 A)
 * cd = 표준 리플렉터 기준 1m 조도(lux)의 근사치 (제조사 공개 스펙 기반).
 */

export type FixKind = 'panel' | 'tube' | 'cob' | 'prac' | 'bounce';

export interface Fixture {
  key: string;
  label: string;
  /** 표준 리플렉터 1m 조도(lx) ≈ 광도(cd) */
  cd: number;
  /** 소비전력(W) */
  W: number;
  kind: FixKind;
  /** 발광면 크기(m). cob는 모디파이어 크기 사용 */
  size?: number;
  /** 튜브 길이(m) */
  len?: number;
  /** 색온도 범위 [min,max] K */
  cct: [number, number];
}

export const FIXTURES: Record<string, Fixture> = {
  mc: { key: 'mc', label: 'Aputure MC (미니 RGB)', cd: 150, W: 5, kind: 'panel', size: 0.09, cct: [2500, 7500] },
  pavo30: { key: 'pavo30', label: 'Nanlite PavoTube II 30X', cd: 500, W: 30, kind: 'tube', size: 0.06, len: 1.15, cct: [2700, 7500] },
  p60c: { key: 'p60c', label: 'Amaran P60c (60W 패널)', cd: 1800, W: 60, kind: 'panel', size: 0.32, cct: [2500, 7500] },
  sl60: { key: 'sl60', label: 'Godox SL60II (60W COB)', cd: 4500, W: 60, kind: 'cob', cct: [5600, 5600] },
  am100: { key: 'am100', label: 'Amaran 100d (100W COB)', cd: 12000, W: 100, kind: 'cob', cct: [5500, 5500] },
  vl150: { key: 'vl150', label: 'Godox VL150 (150W COB)', cd: 18000, W: 150, kind: 'cob', cct: [5600, 5600] },
  am200x: { key: 'am200x', label: 'Amaran 200x (200W 바이컬러)', cd: 20000, W: 200, kind: 'cob', cct: [2700, 6500] },
  ls300x: { key: 'ls300x', label: 'Aputure LS 300X (300W)', cd: 28000, W: 300, kind: 'cob', cct: [2700, 6500] },
  forza300: { key: 'forza300', label: 'Nanlite Forza 300B (300W)', cd: 30000, W: 300, kind: 'cob', cct: [2700, 6500] },
  nova300: { key: 'nova300', label: 'Aputure Nova P300c (패널)', cd: 6000, W: 300, kind: 'panel', size: 0.58, cct: [2000, 10000] },
  ls600d: { key: 'ls600d', label: 'Aputure LS 600d Pro (600W)', cd: 55000, W: 600, kind: 'cob', cct: [5600, 5600] },
  prac: { key: 'prac', label: '실내등 / 프랙티컬', cd: 300, W: 15, kind: 'prac', size: 0.22, cct: [2400, 4500] },
  bounce: { key: 'bounce', label: '반사판 (실버 / 화이트)', cd: 350, W: 0, kind: 'bounce', size: 1.0, cct: [2000, 9000] },
};

export const FIXTURE_KEYS = Object.keys(FIXTURES);
