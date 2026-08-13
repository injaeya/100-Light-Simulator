/**
 * optics.ts — 광학/노출 계산 유틸리티
 *
 * 모든 계산은 실제 사진/촬영 광학 공식을 기반으로 한다.
 * 거리 단위는 미터(m), 초점거리/센서 크기는 밀리미터(mm) 기준.
 */

/** 35mm 풀프레임 기준 대각선 (mm) */
export const FULL_FRAME_DIAGONAL = 43.27;

export interface Sensor {
  /** 센서 가로 (mm) */
  width: number;
  /** 센서 세로 (mm) */
  height: number;
}

/** 센서 대각선 길이 (mm) */
export function sensorDiagonal(sensor: Sensor): number {
  return Math.hypot(sensor.width, sensor.height);
}

/** 35mm 환산 크롭 팩터 */
export function cropFactor(sensor: Sensor): number {
  return FULL_FRAME_DIAGONAL / sensorDiagonal(sensor);
}

/** 35mm 환산 초점거리 (mm) */
export function equivalentFocalLength(focalLength: number, sensor: Sensor): number {
  return focalLength * cropFactor(sensor);
}

export interface FieldOfView {
  /** 수평 화각 (도) */
  horizontal: number;
  /** 수직 화각 (도) */
  vertical: number;
  /** 대각 화각 (도) */
  diagonal: number;
}

/** 센서 크기와 초점거리로부터 화각(도) 계산 */
export function fieldOfView(focalLength: number, sensor: Sensor): FieldOfView {
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const angle = (dim: number) => toDeg(2 * Math.atan(dim / (2 * focalLength)));
  return {
    horizontal: angle(sensor.width),
    vertical: angle(sensor.height),
    diagonal: angle(sensorDiagonal(sensor)),
  };
}

/** 허용 착란원(Circle of Confusion, mm) — 센서 대각선 / 1500 */
export function circleOfConfusion(sensor: Sensor): number {
  return sensorDiagonal(sensor) / 1500;
}

export interface DepthOfField {
  /** 근거리 한계 (m) */
  near: number;
  /** 원거리 한계 (m, Infinity 가능) */
  far: number;
  /** 전체 심도 (m, Infinity 가능) */
  total: number;
  /** 과초점 거리 (m) */
  hyperfocal: number;
  /** 앞쪽 심도 (m) */
  frontDepth: number;
  /** 뒤쪽 심도 (m, Infinity 가능) */
  backDepth: number;
}

/**
 * 피사계 심도 계산
 * @param focalLength 초점거리 (mm)
 * @param aperture 조리개 값 (f-number)
 * @param distance 피사체까지 거리 (m)
 * @param sensor 센서 크기
 */
export function depthOfField(
  focalLength: number,
  aperture: number,
  distance: number,
  sensor: Sensor,
): DepthOfField {
  const coc = circleOfConfusion(sensor); // mm
  const f = focalLength; // mm
  const s = distance * 1000; // mm 로 변환

  // 과초점 거리 (mm)
  const H = (f * f) / (aperture * coc) + f;

  const near = (s * (H - f)) / (H + s - 2 * f);
  const farDenom = H - s;
  const far = farDenom <= 0 ? Infinity : (s * (H - f)) / farDenom;

  const nearM = near / 1000;
  const farM = far === Infinity ? Infinity : far / 1000;

  return {
    near: nearM,
    far: farM,
    total: farM === Infinity ? Infinity : farM - nearM,
    hyperfocal: H / 1000,
    frontDepth: distance - nearM,
    backDepth: farM === Infinity ? Infinity : farM - distance,
  };
}

/**
 * 노출값(EV) 계산 — ISO 100 기준 EV100
 * @param aperture 조리개 값 (N)
 * @param shutter 셔터 속도 (초 단위, 예: 1/50 => 0.02)
 * @param iso ISO 감도
 */
export function exposureValue(aperture: number, shutter: number, iso: number): number {
  // EV = log2(N^2 / t) - log2(ISO/100)
  const evAtIso100 = Math.log2((aperture * aperture) / shutter);
  return evAtIso100 - Math.log2(iso / 100);
}

/** 조도(lux)에 대응하는 적정 노출 EV (ISO100) */
export function evFromLux(lux: number): number {
  // 반사식 표준: EV = log2(lux / 2.5)
  return Math.log2(lux / 2.5);
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 색온도(Kelvin) → 근사 RGB (0..1)
 * Tanner Helland 근사식 기반.
 * @param kelvin 1000..40000
 */
export function kelvinToRGB(kelvin: number): RGB {
  const temp = Math.min(40000, Math.max(1000, kelvin)) / 100;
  let r: number;
  let g: number;
  let b: number;

  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
  }

  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  }

  const clamp = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return { r: clamp(r), g: clamp(g), b: clamp(b) };
}

/** RGB(0..1) → CSS hex 문자열 */
export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** 역제곱 법칙에 의한 상대 조도 (기준거리 1m에서 intensity) */
export function inverseSquareFalloff(intensity: number, distance: number): number {
  const d = Math.max(0.01, distance);
  return intensity / (d * d);
}

/* ------------------------------------------------------------------ */
/* 측광(Photometry) — 광속(lm) → 광도(cd) → 조도(lux)                    */
/* ------------------------------------------------------------------ */

/**
 * 원뿔 빔의 입체각 (steradian)
 * Ω = 2π (1 − cos(θ)),  θ = 반각(half-angle)
 * @param halfAngleDeg 빔 반각 (도)
 */
export function coneSolidAngle(halfAngleDeg: number): number {
  const half = (Math.min(90, Math.max(0, halfAngleDeg)) * Math.PI) / 180;
  return 2 * Math.PI * (1 - Math.cos(half));
}

/**
 * 광속(루멘) → 광도(칸델라)
 * 지향성 광원: I = Φ / Ω  (Ω = 빔 입체각)
 * 전방향 광원: I = Φ / 4π
 *
 * @param lumens 광속 Φ (lm)
 * @param coneAngleDeg 전각(full cone angle, 도). 전방향(point)은 360 전달
 */
export function luminousIntensity(lumens: number, coneAngleDeg: number): number {
  // 전방향(구형 분포)
  if (coneAngleDeg >= 360) {
    return lumens / (4 * Math.PI);
  }
  const omega = coneSolidAngle(coneAngleDeg / 2);
  // 아주 좁은 빔에서 0 분모 방지
  return lumens / Math.max(1e-4, omega);
}

/**
 * 조도(lux) — 역제곱 법칙
 * E = I / d²
 * @param candela 광도 (cd)
 * @param distance 거리 (m)
 */
export function illuminance(candela: number, distance: number): number {
  const d = Math.max(0.01, distance);
  return candela / (d * d);
}

/**
 * 카메라 노출 배율 (톤매핑 노출로 사용)
 *
 * 노출 방정식에서 센서 도달 광량 H ∝ (t · S) / N² 이므로,
 * 동일 장면 휘도에 대해 이 값이 클수록 화면이 밝아진다.
 * (조리개를 조이면 N↑ → 어두워지고, 셔터/ISO↑ → 밝아진다)
 *
 * @param aperture 조리개 N (f-number)
 * @param shutter 셔터 t (초)
 * @param iso ISO 감도 S
 * @param k 보정 상수 (씬 휘도 스케일에 맞춘 캘리브레이션)
 */
export function exposureMultiplier(
  aperture: number,
  shutter: number,
  iso: number,
  k: number,
): number {
  return (k * (shutter * (iso / 100))) / (aperture * aperture);
}

/** 조도(lux)를 사람이 읽기 좋은 문자열로 */
export function formatLux(lux: number): string {
  if (!isFinite(lux)) return '∞';
  if (lux >= 1000) return `${(lux / 1000).toFixed(1)}k lx`;
  return `${Math.round(lux)} lx`;
}

/** 셔터 속도(초)를 "1/x" 표기로 포맷 */
export function formatShutter(shutter: number): string {
  if (shutter >= 1) return `${shutter}"`;
  return `1/${Math.round(1 / shutter)}`;
}

/** 거리(m) 사람이 읽기 좋은 포맷 */
export function formatDistance(m: number): string {
  if (m === Infinity) return '∞';
  if (m < 1) return `${Math.round(m * 100)}cm`;
  return `${m.toFixed(2)}m`;
}
