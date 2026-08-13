/**
 * simulatorStore.ts — 시뮬레이터 전역 상태 (zustand)
 */
import { create } from 'zustand';
import type { Sensor } from '../lib/optics';
import {
  FIXTURE_PRESETS,
  SENSOR_PRESETS,
  type FixtureType,
  type SpaceId,
} from '../data/presets';

export type Vec3 = [number, number, number];

/** 조명 인스턴스 */
export interface Light {
  id: string;
  name: string;
  type: FixtureType;
  position: Vec3;
  /** 조준 대상 좌표 (피사체 방향) */
  target: Vec3;
  /** 광속 (루멘, lm) — 실제 광량 단위 */
  lumens: number;
  /** 색온도 (K) */
  kelvin: number;
  /** 확산각 (도) */
  coneAngle: number;
  enabled: boolean;
}

/** 카메라 설정 */
export interface CameraSettings {
  sensorId: string;
  sensor: Sensor;
  focalLength: number;
  aperture: number;
  shutter: number;
  iso: number;
  /** 피사체까지 거리 (m) */
  subjectDistance: number;
}

interface SimulatorState {
  space: SpaceId;
  camera: CameraSettings;
  lights: Light[];
  selectedLightId: string | null;
  /** 노출/뷰 옵션 */
  showHelpers: boolean;
  exposureCompensation: number;
  /** 포스트프로세싱(실사 효과) 마스터 토글 */
  postFx: boolean;
  /** 피사계 심도(보케) 토글 */
  depthOfField: boolean;

  /* actions */
  setSpace: (space: SpaceId) => void;
  updateCamera: (patch: Partial<CameraSettings>) => void;
  setSensor: (sensorId: string) => void;
  addLight: (type: FixtureType) => void;
  removeLight: (id: string) => void;
  updateLight: (id: string, patch: Partial<Light>) => void;
  selectLight: (id: string | null) => void;
  toggleHelpers: () => void;
  setExposureCompensation: (v: number) => void;
  togglePostFx: () => void;
  toggleDepthOfField: () => void;
  resetLights: () => void;
}

let lightCounter = 0;
function nextLightId(): string {
  lightCounter += 1;
  return `light-${lightCounter}`;
}

function createLight(type: FixtureType, position: Vec3): Light {
  const preset = FIXTURE_PRESETS[type];
  return {
    id: nextLightId(),
    name: preset.label,
    type,
    position,
    target: [0, 1.2, 0],
    lumens: preset.defaultLumens,
    kelvin: preset.defaultKelvin,
    coneAngle: preset.defaultConeAngle,
    enabled: true,
  };
}

/** 기본 3점 조명 세팅 */
function defaultThreePointLights(): Light[] {
  const key = createLight('softbox', [2.6, 2.4, 2.6]);
  key.name = '키 라이트';
  key.lumens = 12000;

  const fill = createLight('panel', [-2.6, 1.9, 2.2]);
  fill.name = '필 라이트';
  fill.lumens = 6000;

  const back = createLight('fresnel', [-1.5, 3.2, -3]);
  back.name = '백 라이트';
  back.kelvin = 6500;
  back.lumens = 12000;

  return [key, fill, back];
}

const defaultSensorPreset = SENSOR_PRESETS.find((s) => s.id === 'full-frame')!;

export const useSimulatorStore = create<SimulatorState>((set) => ({
  space: 'interview',
  camera: {
    sensorId: defaultSensorPreset.id,
    sensor: defaultSensorPreset.sensor,
    focalLength: 50,
    aperture: 2.8,
    shutter: 1 / 50,
    iso: 400,
    subjectDistance: 2.5,
  },
  lights: defaultThreePointLights(),
  selectedLightId: null,
  showHelpers: true,
  exposureCompensation: 0,
  postFx: true,
  depthOfField: false,

  setSpace: (space) => set({ space }),

  updateCamera: (patch) =>
    set((state) => ({ camera: { ...state.camera, ...patch } })),

  setSensor: (sensorId) =>
    set((state) => {
      const preset = SENSOR_PRESETS.find((s) => s.id === sensorId);
      if (!preset) return state;
      return {
        camera: { ...state.camera, sensorId, sensor: preset.sensor },
      };
    }),

  addLight: (type) =>
    set((state) => {
      const angle = (state.lights.length * Math.PI) / 4;
      const pos: Vec3 = [Math.cos(angle) * 3.5, 2.4, Math.sin(angle) * 3.5];
      const light = createLight(type, pos);
      return { lights: [...state.lights, light], selectedLightId: light.id };
    }),

  removeLight: (id) =>
    set((state) => ({
      lights: state.lights.filter((l) => l.id !== id),
      selectedLightId: state.selectedLightId === id ? null : state.selectedLightId,
    })),

  updateLight: (id, patch) =>
    set((state) => ({
      lights: state.lights.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),

  selectLight: (id) => set({ selectedLightId: id }),

  toggleHelpers: () => set((state) => ({ showHelpers: !state.showHelpers })),

  setExposureCompensation: (v) => set({ exposureCompensation: v }),

  togglePostFx: () => set((state) => ({ postFx: !state.postFx })),

  toggleDepthOfField: () => set((state) => ({ depthOfField: !state.depthOfField })),

  resetLights: () => set({ lights: defaultThreePointLights(), selectedLightId: null }),
}));
