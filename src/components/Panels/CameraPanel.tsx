/**
 * CameraPanel.tsx — 카메라 위치 + 노출 컨트롤
 */
import { useSimulatorStore } from '../../store/simulatorStore';
import { kelvinCSS } from '../../sim/kelvin';
import { Panel, Field, Slider } from './controls';

const ISO = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 50, 1 / 60, 1 / 125, 1 / 250, 1 / 500, 1 / 1000];
const FSTOPS = [1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const ND = [0, 1, 2, 3, 4, 5, 6];

function nearestIndex(arr: number[], v: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - v);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function fmtShutter(s: number): string {
  if (s >= 1) return `${s}"`;
  return `1/${Math.round(1 / s)}`;
}

export function CameraPanel() {
  const cam = useSimulatorStore((s) => s.cam);
  const expo = useSimulatorStore((s) => s.expo);
  const setCam = useSimulatorStore((s) => s.setCam);
  const setExpo = useSimulatorStore((s) => s.setExpo);
  const fitExposureNow = useSimulatorStore((s) => s.fitExposureNow);

  return (
    <Panel
      title="카메라 · 노출"
      actions={
        <button className="ghost-btn" type="button" onClick={fitExposureNow}>
          적정 노출
        </button>
      }
    >
      <Field label="초점거리" value={`${cam.focal}mm`}>
        <Slider min={14} max={200} step={1} value={cam.focal} onChange={(v) => setCam({ focal: v })} />
      </Field>
      <Field label="카메라 방위 az" value={`${cam.az}°`}>
        <Slider min={-180} max={180} step={1} value={cam.az} onChange={(v) => setCam({ az: v })} />
      </Field>
      <Field label="카메라 거리 dist" value={`${cam.dist.toFixed(2)}m`}>
        <Slider min={0.5} max={8} step={0.05} value={cam.dist} onChange={(v) => setCam({ dist: v })} />
      </Field>
      <Field label="카메라 높이 h" value={`${cam.h.toFixed(2)}m`}>
        <Slider min={0.3} max={3} step={0.02} value={cam.h} onChange={(v) => setCam({ h: v })} />
      </Field>

      <Field label="ISO" value={ISO[nearestIndex(ISO, expo.iso)]}>
        <Slider
          min={0}
          max={ISO.length - 1}
          step={1}
          value={nearestIndex(ISO, expo.iso)}
          onChange={(i) => setExpo({ iso: ISO[i] })}
        />
      </Field>
      <Field label="셔터" value={fmtShutter(SHUTTER[nearestIndex(SHUTTER, expo.shutter)])}>
        <Slider
          min={0}
          max={SHUTTER.length - 1}
          step={1}
          value={nearestIndex(SHUTTER, expo.shutter)}
          onChange={(i) => setExpo({ shutter: SHUTTER[i] })}
        />
      </Field>
      <Field label="조리개" value={`f/${FSTOPS[nearestIndex(FSTOPS, expo.f)]}`}>
        <Slider
          min={0}
          max={FSTOPS.length - 1}
          step={1}
          value={nearestIndex(FSTOPS, expo.f)}
          onChange={(i) => setExpo({ f: FSTOPS[i] })}
        />
      </Field>
      <Field label="ND" value={`ND ${ND[nearestIndex(ND, expo.nd)]}`}>
        <Slider
          min={0}
          max={ND.length - 1}
          step={1}
          value={nearestIndex(ND, expo.nd)}
          onChange={(i) => setExpo({ nd: ND[i] })}
        />
      </Field>
      <Field
        label="화이트밸런스 wb"
        value={
          <span className="kelvin-value">
            <span className="kelvin-swatch" style={{ background: kelvinCSS(expo.wb) }} />
            {`${expo.wb}K`}
          </span>
        }
      >
        <Slider min={2000} max={10000} step={100} value={expo.wb} onChange={(v) => setExpo({ wb: v })} />
      </Field>
    </Panel>
  );
}
