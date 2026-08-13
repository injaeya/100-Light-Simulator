/**
 * ScenePanel.tsx — 공간 선택 + 뷰 옵션 + 노출 보정
 */
import { SPACE_PRESETS } from '../../data/presets';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Field, Panel, Slider } from './controls';

export function ScenePanel() {
  const space = useSimulatorStore((s) => s.space);
  const setSpace = useSimulatorStore((s) => s.setSpace);
  const showHelpers = useSimulatorStore((s) => s.showHelpers);
  const toggleHelpers = useSimulatorStore((s) => s.toggleHelpers);
  const exposureComp = useSimulatorStore((s) => s.exposureCompensation);
  const setExposureComp = useSimulatorStore((s) => s.setExposureCompensation);

  const current = SPACE_PRESETS.find((s) => s.id === space)!;

  return (
    <Panel title="공간 · 뷰" subtitle="세트 선택과 표시 옵션">
      <Field label="공간">
        <div className="space-grid">
          {SPACE_PRESETS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`space-btn ${s.id === space ? 'active' : ''}`}
              onClick={() => setSpace(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>
      <p className="hint">{current.description}</p>

      <Field
        label="노출 보정"
        value={`${exposureComp > 0 ? '+' : ''}${exposureComp.toFixed(1)} EV`}
      >
        <Slider
          min={-3}
          max={3}
          step={0.1}
          value={exposureComp}
          onChange={setExposureComp}
        />
      </Field>

      <label className="toggle-row">
        <input type="checkbox" checked={showHelpers} onChange={toggleHelpers} />
        <span>조명 기구 헬퍼 표시</span>
      </label>
    </Panel>
  );
}
