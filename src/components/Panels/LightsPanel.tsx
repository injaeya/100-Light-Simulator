/**
 * LightsPanel.tsx — 조명 목록 + 추가 + 선택 조명 편집
 */
import { FIXTURE_PRESETS, FIXTURE_TYPES, KELVIN_PRESETS } from '../../data/presets';
import {
  formatLux,
  illuminance,
  kelvinToRGB,
  luminousIntensity,
  rgbToHex,
} from '../../lib/optics';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Field, Panel, Slider } from './controls';

/** 광원에서 피사체까지 직선거리 (m) */
function distanceToSubject(position: [number, number, number], target: [number, number, number]): number {
  return Math.hypot(
    position[0] - target[0],
    position[1] - target[1],
    position[2] - target[2],
  );
}

function LightEditor({ id }: { id: string }) {
  const light = useSimulatorStore((s) => s.lights.find((l) => l.id === id));
  const updateLight = useSimulatorStore((s) => s.updateLight);
  if (!light) return null;

  const swatch = rgbToHex(kelvinToRGB(light.kelvin));
  const isSpot = light.type !== 'point';

  // 측광: 광속 → 광도(cd) → 피사체 조도(lux)
  const candela = luminousIntensity(light.lumens, isSpot ? light.coneAngle : 360);
  const dist = distanceToSubject(light.position, light.target);
  const lux = illuminance(candela, dist);

  return (
    <div className="light-editor">
      <Field label="이름">
        <input
          className="text-input"
          value={light.name}
          onChange={(e) => updateLight(id, { name: e.target.value })}
        />
      </Field>

      <Field label="광속" value={`${light.lumens.toLocaleString()} lm`}>
        <Slider
          min={0}
          max={30000}
          step={100}
          value={light.lumens}
          onChange={(v) => updateLight(id, { lumens: v })}
        />
      </Field>

      {/* 측광 리드아웃 */}
      <div className="readout">
        <div className="readout-row">
          <span>광도</span>
          <strong>{Math.round(candela).toLocaleString()} cd</strong>
        </div>
        <div className="readout-row">
          <span>피사체 조도 ({dist.toFixed(1)}m)</span>
          <strong>{formatLux(lux)}</strong>
        </div>
      </div>

      <Field
        label="색온도"
        value={
          <span className="kelvin-value">
            <span className="kelvin-swatch" style={{ background: swatch }} />
            {light.kelvin}K
          </span>
        }
      >
        <Slider
          min={2000}
          max={10000}
          step={100}
          value={light.kelvin}
          onChange={(v) => updateLight(id, { kelvin: v })}
        />
        <div className="kelvin-presets">
          {KELVIN_PRESETS.map((p) => (
            <button
              key={p.k}
              type="button"
              className="chip"
              onClick={() => updateLight(id, { kelvin: p.k })}
              title={p.label}
            >
              {p.k}K
            </button>
          ))}
        </div>
      </Field>

      {isSpot && (
        <Field label="확산각" value={`${Math.round(light.coneAngle)}°`}>
          <Slider
            min={5}
            max={140}
            step={1}
            value={light.coneAngle}
            onChange={(v) => updateLight(id, { coneAngle: v })}
          />
        </Field>
      )}

      <div className="xyz-group">
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <Field key={axis} label={`위치 ${axis.toUpperCase()}`} value={light.position[i].toFixed(1)}>
            <Slider
              min={-8}
              max={8}
              step={0.1}
              value={light.position[i]}
              onChange={(v) => {
                const pos = [...light.position] as typeof light.position;
                pos[i] = v;
                updateLight(id, { position: pos });
              }}
            />
          </Field>
        ))}
      </div>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={light.enabled}
          onChange={(e) => updateLight(id, { enabled: e.target.checked })}
        />
        <span>{light.enabled ? '켜짐' : '꺼짐'}</span>
      </label>
    </div>
  );
}

export function LightsPanel() {
  const lights = useSimulatorStore((s) => s.lights);
  const selectedLightId = useSimulatorStore((s) => s.selectedLightId);
  const selectLight = useSimulatorStore((s) => s.selectLight);
  const addLight = useSimulatorStore((s) => s.addLight);
  const removeLight = useSimulatorStore((s) => s.removeLight);
  const resetLights = useSimulatorStore((s) => s.resetLights);

  return (
    <Panel
      title="조명"
      subtitle={`${lights.length}개 설치됨`}
      actions={
        <button type="button" className="ghost-btn" onClick={resetLights}>
          3점 조명 초기화
        </button>
      }
    >
      {/* 조명 목록 */}
      <div className="light-list">
        {lights.map((l) => {
          const swatch = rgbToHex(kelvinToRGB(l.kelvin));
          return (
            <div
              key={l.id}
              className={`light-row ${l.id === selectedLightId ? 'selected' : ''} ${
                l.enabled ? '' : 'disabled'
              }`}
              onClick={() => selectLight(l.id)}
            >
              <span className="light-dot" style={{ background: swatch }} />
              <span className="light-name">{l.name}</span>
              <span className="light-type">{FIXTURE_PRESETS[l.type].label}</span>
              <button
                type="button"
                className="icon-btn"
                title="삭제"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLight(l.id);
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* 조명 추가 */}
      <div className="add-fixtures">
        <span className="add-label">조명 추가</span>
        <div className="fixture-grid">
          {FIXTURE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="fixture-btn"
              title={FIXTURE_PRESETS[t].description}
              onClick={() => addLight(t)}
            >
              {FIXTURE_PRESETS[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* 선택 조명 편집 */}
      {selectedLightId ? (
        <LightEditor id={selectedLightId} />
      ) : (
        <p className="hint">목록 또는 3D 뷰에서 조명을 선택하면 세부 조정이 가능합니다.</p>
      )}
    </Panel>
  );
}
