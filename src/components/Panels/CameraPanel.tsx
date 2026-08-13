/**
 * CameraPanel.tsx — 카메라/렌즈/노출 설정 패널
 */
import {
  APERTURE_STOPS,
  ISO_STOPS,
  SENSOR_PRESETS,
  SHUTTER_SPEEDS,
} from '../../data/presets';
import {
  depthOfField,
  equivalentFocalLength,
  exposureValue,
  fieldOfView,
  formatDistance,
  formatShutter,
} from '../../lib/optics';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Field, Panel, Select, Slider } from './controls';

/** 배열에서 가장 가까운 값의 인덱스 */
function nearestIndex(arr: number[], v: number): number {
  let best = 0;
  let bestDiff = Infinity;
  arr.forEach((a, i) => {
    const d = Math.abs(a - v);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  });
  return best;
}

export function CameraPanel() {
  const camera = useSimulatorStore((s) => s.camera);
  const updateCamera = useSimulatorStore((s) => s.updateCamera);
  const setSensor = useSimulatorStore((s) => s.setSensor);

  const fov = fieldOfView(camera.focalLength, camera.sensor);
  const eqFocal = equivalentFocalLength(camera.focalLength, camera.sensor);
  const dof = depthOfField(
    camera.focalLength,
    camera.aperture,
    camera.subjectDistance,
    camera.sensor,
  );
  const ev = exposureValue(camera.aperture, camera.shutter, camera.iso);

  const apertureIdx = nearestIndex(APERTURE_STOPS, camera.aperture);
  const shutterIdx = nearestIndex(SHUTTER_SPEEDS, camera.shutter);
  const isoIdx = nearestIndex(ISO_STOPS, camera.iso);

  return (
    <Panel title="카메라 · 렌즈" subtitle="센서 · 초점거리 · 노출 3요소">
      <Field label="센서 / 바디">
        <Select
          value={camera.sensorId}
          onChange={setSensor}
          options={SENSOR_PRESETS.map((s) => ({ value: s.id, label: s.label }))}
        />
      </Field>

      <Field
        label="초점거리"
        value={`${camera.focalLength}mm · 환산 ${Math.round(eqFocal)}mm`}
      >
        <Slider
          min={14}
          max={200}
          step={1}
          value={camera.focalLength}
          onChange={(v) => updateCamera({ focalLength: v })}
        />
      </Field>

      <Field
        label="조리개"
        value={`f/${APERTURE_STOPS[apertureIdx]}`}
      >
        <Slider
          min={0}
          max={APERTURE_STOPS.length - 1}
          step={1}
          value={apertureIdx}
          onChange={(i) => updateCamera({ aperture: APERTURE_STOPS[i] })}
        />
      </Field>

      <Field label="셔터" value={formatShutter(SHUTTER_SPEEDS[shutterIdx])}>
        <Slider
          min={0}
          max={SHUTTER_SPEEDS.length - 1}
          step={1}
          value={shutterIdx}
          onChange={(i) => updateCamera({ shutter: SHUTTER_SPEEDS[i] })}
        />
      </Field>

      <Field label="ISO" value={ISO_STOPS[isoIdx]}>
        <Slider
          min={0}
          max={ISO_STOPS.length - 1}
          step={1}
          value={isoIdx}
          onChange={(i) => updateCamera({ iso: ISO_STOPS[i] })}
        />
      </Field>

      <Field label="피사체 거리" value={formatDistance(camera.subjectDistance)}>
        <Slider
          min={0.5}
          max={12}
          step={0.1}
          value={camera.subjectDistance}
          onChange={(v) => updateCamera({ subjectDistance: v })}
        />
      </Field>

      {/* 계산 결과 요약 */}
      <div className="readout">
        <div className="readout-row">
          <span>화각 (수평)</span>
          <strong>{fov.horizontal.toFixed(1)}°</strong>
        </div>
        <div className="readout-row">
          <span>피사계 심도</span>
          <strong>
            {dof.total === Infinity ? '∞' : formatDistance(dof.total)}
          </strong>
        </div>
        <div className="readout-row">
          <span>심도 범위</span>
          <strong>
            {formatDistance(dof.near)} – {formatDistance(dof.far)}
          </strong>
        </div>
        <div className="readout-row">
          <span>노출값 (EV100)</span>
          <strong>{ev.toFixed(1)} EV</strong>
        </div>
      </div>
    </Panel>
  );
}
