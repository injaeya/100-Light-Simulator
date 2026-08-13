/**
 * sceneColor.ts — 선형 반사율을 그대로 색으로 쓰기 위한 헬퍼.
 * 측광 모델의 albedo/발산도는 선형값이므로 LinearSRGBColorSpace 로 지정한다.
 */
import { Color, LinearSRGBColorSpace } from 'three';

export function lin(r: number, g: number, b: number): Color {
  return new Color().setRGB(r, g, b, LinearSRGBColorSpace);
}

/** 바닥 종류별 대략 색(선형 근사) */
export const FLOOR_COLOR: Record<string, [number, number, number]> = {
  wood: [0.12, 0.07, 0.035],
  concrete: [0.16, 0.16, 0.17],
  carpet: [0.09, 0.1, 0.12],
  tile: [0.32, 0.31, 0.3],
};
