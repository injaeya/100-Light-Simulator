/**
 * CameraPanel.tsx — 카메라 위치 + 노출 컨트롤
 */
import { useSimulatorStore } from '../../store/simulatorStore';
import { kelvinCSS } from '../../sim/kelvin';
import {
  LENS_ORDER,
  getLens,
  isPrime,
  apertureStops,
  horizontalFov,
} from '../../sim/lenses';
import { Panel, Field, Slider, Select } from './controls';

const ISO = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 50, 1 / 60, 1 / 125, 1 / 250, 1 / 500, 1 / 1000];
const ND = [0, 1, 2, 3, 4, 5, 6];

const LENS_OPTIONS = LENS_ORDER.map((id) => ({ value: id, label: getLens(id).label }));

function fmtF(f: number): string {
  return `f/${Number.isInteger(f) ? f : f.toFixed(1)}`;
}

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
  const setFocal = useSimulatorStore((s) => s.setFocal);
  const setLens = useSimulatorStore((s) => s.setLens);
  const fitExposureNow = useSimulatorStore((s) => s.fitExposureNow);

  const lens = getLens(cam.lens);
  const prime = isPrime(lens);
  const fStops = apertureStops(lens, cam.focal);
  const fIdx = nearestIndex(fStops, expo.f);
  const fov = Math.round(horizontalFov(cam.focal));

  return (
    <Panel
      title="카메라 · 노출"
      subtitle="Sony α · FE 마운트(풀프레임)"
      actions={
        <button className="ghost-btn" type="button" onClick={fitExposureNow}>
          적정 노출
        </button>
      }
    >
      <Field label="렌즈" value={<span className={`lens-badge lens-${lens.grade}`}>{lens.grade}</span>}>
        <Select options={LENS_OPTIONS} value={cam.lens} onChange={setLens} />
      </Field>

      {prime ? (
        <Field label="초점거리 (단렌즈)" value={`${cam.focal}mm · ${fov}° 화각`}>
          <div className="lens-fixed">고정 {lens.focalMin}mm</div>
        </Field>
      ) : (
        <Field label="초점거리 (줌)" value={`${cam.focal}mm · ${fov}° 화각`}>
          <Slider
            min={lens.focalMin}
            max={lens.focalMax}
            step={1}
            value={cam.focal}
            onChange={setFocal}
          />
        </Field>
      )}

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
      <Field
        label="조리개"
        value={
          <span>
            {fmtF(fStops[fIdx])}
            <span className="field-hint"> · 개방 {fmtF(fStops[0])}</span>
          </span>
        }
      >
        <Slider
          min={0}
          max={fStops.length - 1}
          step={1}
          value={fIdx}
          onChange={(i) => setExpo({ f: fStops[i] })}
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
