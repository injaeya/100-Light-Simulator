/**
 * kelvin.ts — 색온도 → RGB (Tanner Helland 근사) + 화이트밸런스
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function kelvinRGB(k: number): RGB {
  const t = k / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }
  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const n = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return { r: n(r), g: n(g), b: n(b) };
}

export function kelvinCSS(k: number): string {
  const c = kelvinRGB(k);
  return `rgb(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0})`;
}

/**
 * 화이트밸런스 보정 계수 (채널별). 광원 색온도를 WB 기준에서 봤을 때의 색.
 * WB와 같은 색온도면 (1,1,1). 휘도 보존 정규화.
 */
export function wbFactor(kelvin: number, wb: number): RGB {
  const c = kelvinRGB(kelvin), w = kelvinRGB(wb);
  let r = c.r / Math.max(0.02, w.r),
    g = c.g / Math.max(0.02, w.g),
    b = c.b / Math.max(0.02, w.b);
  const l = Math.max(0.05, 0.2126 * r + 0.7152 * g + 0.0722 * b);
  return { r: r / l, g: g / l, b: b / l };
}
