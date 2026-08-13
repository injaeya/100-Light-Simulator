/**
 * presets.ts — 카메라/렌즈/조명/공간 프리셋 데이터
 */
import type { Sensor } from '../lib/optics';

/* ------------------------------------------------------------------ */
/* 카메라 센서 프리셋                                                   */
/* ------------------------------------------------------------------ */

export interface SensorPreset {
  id: string;
  label: string;
  /** 예시 바디명 */
  example: string;
  sensor: Sensor;
}

export const SENSOR_PRESETS: SensorPreset[] = [
  {
    id: 'medium-format',
    label: '중형 (Medium Format)',
    example: 'Fujifilm GFX / Hasselblad',
    sensor: { width: 43.8, height: 32.9 },
  },
  {
    id: 'full-frame',
    label: '풀프레임 (Full Frame)',
    example: 'Sony A7 / Canon R5 / Nikon Z',
    sensor: { width: 36, height: 24 },
  },
  {
    id: 'super35',
    label: 'Super 35',
    example: 'ARRI Alexa / RED / FX6',
    sensor: { width: 24.89, height: 18.66 },
  },
  {
    id: 'aps-c',
    label: 'APS-C',
    example: 'Sony A6700 / Fujifilm X-T5',
    sensor: { width: 23.5, height: 15.6 },
  },
  {
    id: 'mft',
    label: '마이크로 4/3 (MFT)',
    example: 'Panasonic GH / OM System',
    sensor: { width: 17.3, height: 13 },
  },
  {
    id: 'one-inch',
    label: '1인치',
    example: 'Sony RX100 / DJI',
    sensor: { width: 13.2, height: 8.8 },
  },
];

/* ------------------------------------------------------------------ */
/* 렌즈(초점거리) 프리셋                                                */
/* ------------------------------------------------------------------ */

export interface FocalPreset {
  focalLength: number;
  label: string;
}

/** 자주 쓰는 초점거리 (35mm 환산 아님, 물리 초점거리) */
export const FOCAL_PRESETS: FocalPreset[] = [
  { focalLength: 14, label: '14mm 초광각' },
  { focalLength: 24, label: '24mm 광각' },
  { focalLength: 35, label: '35mm 준광각' },
  { focalLength: 50, label: '50mm 표준' },
  { focalLength: 85, label: '85mm 인물' },
  { focalLength: 135, label: '135mm 망원' },
  { focalLength: 200, label: '200mm 망원' },
];

/** 조리개 스톱 (표준 1스톱 간격) */
export const APERTURE_STOPS = [1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];

/** 셔터 속도 (초 단위) */
export const SHUTTER_SPEEDS = [
  1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 50, 1 / 60, 1 / 125, 1 / 250, 1 / 500, 1 / 1000,
  1 / 2000,
];

/** ISO 감도 스톱 */
export const ISO_STOPS = [100, 200, 400, 800, 1600, 3200, 6400, 12800];

/* ------------------------------------------------------------------ */
/* 조명 기구 프리셋                                                     */
/* ------------------------------------------------------------------ */

export type FixtureType = 'softbox' | 'spot' | 'fresnel' | 'tube' | 'panel' | 'point';

export interface FixturePreset {
  type: FixtureType;
  label: string;
  /** 기본 광속 (루멘, lm) — 실제 광량 단위 */
  defaultLumens: number;
  /** 기본 색온도 (K) */
  defaultKelvin: number;
  /** 확산각(전각, 도) — 스팟류에서 사용 */
  defaultConeAngle: number;
  /** 부드러움 0(하드)~1(소프트) — 그림자 페넘브라/확산에 반영 */
  softness: number;
  description: string;
}

/*
 * 광속(lm) 값은 실제 촬영용 기구를 참고한 근사치.
 * (예: 100W급 LED 소프트박스 ≈ 9,000 lm, 60W 백열 전구 ≈ 800 lm)
 * 렌더링 시 luminousIntensity()로 빔 입체각에 따라 광도(cd)로 환산된다.
 */
export const FIXTURE_PRESETS: Record<FixtureType, FixturePreset> = {
  softbox: {
    type: 'softbox',
    label: '소프트박스',
    defaultLumens: 9000,
    defaultKelvin: 5600,
    defaultConeAngle: 90,
    softness: 0.95,
    description: '부드럽고 넓은 확산광. 인물/인터뷰 키라이트에 적합.',
  },
  panel: {
    type: 'panel',
    label: 'LED 패널',
    defaultLumens: 5000,
    defaultKelvin: 5600,
    defaultConeAngle: 110,
    softness: 0.75,
    description: '가변 색온도 LED 평판. 필/보조광으로 두루 사용.',
  },
  fresnel: {
    type: 'fresnel',
    label: '프레넬',
    defaultLumens: 15000,
    defaultKelvin: 3200,
    defaultConeAngle: 40,
    softness: 0.35,
    description: '집광/확산 조절 가능한 스포트. 백/림 라이트에 유용.',
  },
  spot: {
    type: 'spot',
    label: '스포트',
    defaultLumens: 20000,
    defaultKelvin: 5600,
    defaultConeAngle: 22,
    softness: 0.12,
    description: '좁고 강한 지향성 광. 강조/무대 효과광.',
  },
  tube: {
    type: 'tube',
    label: '튜브 라이트',
    defaultLumens: 2200,
    defaultKelvin: 5600,
    defaultConeAngle: 120,
    softness: 0.8,
    description: '가늘고 긴 광원. 배경 악센트/실용광 연출.',
  },
  point: {
    type: 'point',
    label: '포인트/전구',
    defaultLumens: 800,
    defaultKelvin: 2700,
    defaultConeAngle: 360,
    softness: 0.5,
    description: '전방향 실용광(프랙티컬). 램프/배경 소품광.',
  },
};

/** 실제 사용 가능한 기구 타입 목록 (placeholder 제외) */
export const FIXTURE_TYPES: FixtureType[] = [
  'softbox',
  'panel',
  'fresnel',
  'spot',
  'tube',
  'point',
];

/* ------------------------------------------------------------------ */
/* 공간(세트) 프리셋                                                    */
/* ------------------------------------------------------------------ */

export type SpaceId = 'interview' | 'stage' | 'studio' | 'empty';

export interface SpacePreset {
  id: SpaceId;
  label: string;
  description: string;
  /** 바닥/벽 색 */
  floorColor: string;
  wallColor: string;
  /** 방 크기 (m) */
  size: { w: number; d: number; h: number };
}

export const SPACE_PRESETS: SpacePreset[] = [
  {
    id: 'interview',
    label: '인터뷰',
    description: '앉은 피사체 + 배경. 3점 조명 연습에 적합.',
    floorColor: '#2a2a30',
    wallColor: '#3a3a44',
    size: { w: 8, d: 8, h: 3.2 },
  },
  {
    id: 'stage',
    label: '무대',
    description: '넓고 어두운 무대. 스포트/백라이트 연출.',
    floorColor: '#161619',
    wallColor: '#0e0e12',
    size: { w: 14, d: 12, h: 6 },
  },
  {
    id: 'studio',
    label: '스튜디오',
    description: '무한대 배경(호리존). 제품/인물 촬영.',
    floorColor: '#d8d8dc',
    wallColor: '#e8e8ec',
    size: { w: 10, d: 10, h: 4 },
  },
  {
    id: 'empty',
    label: '빈 공간',
    description: '참조 그리드만. 순수 조명 테스트.',
    floorColor: '#202024',
    wallColor: '#000000',
    size: { w: 12, d: 12, h: 4 },
  },
];

/** 색온도 프리셋 (K) */
export const KELVIN_PRESETS = [
  { k: 2700, label: '텅스텐 전구' },
  { k: 3200, label: '텅스텐 스튜디오' },
  { k: 4300, label: '형광등' },
  { k: 5600, label: '데이라이트' },
  { k: 6500, label: '흐린 하늘' },
  { k: 7500, label: '그늘/블루' },
];
