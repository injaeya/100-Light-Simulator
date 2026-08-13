/**
 * PresetPanel.tsx — 공간/조명 프리셋 선택 + 헬퍼 표시 토글
 */
import { useSimulatorStore } from '../../store/simulatorStore';
import { LIGHTING_PRESETS, SPACE_PRESETS } from '../../sim/presets';
import { Panel, Field, Select } from './controls';

export function PresetPanel() {
  const spaceKey = useSimulatorStore((s) => s.spaceKey);
  const lightingKey = useSimulatorStore((s) => s.lightingKey);
  const applySpace = useSimulatorStore((s) => s.applySpace);
  const applyLighting = useSimulatorStore((s) => s.applyLighting);
  const showHelpers = useSimulatorStore((s) => s.showHelpers);
  const toggleHelpers = useSimulatorStore((s) => s.toggleHelpers);
  const showBeams = useSimulatorStore((s) => s.showBeams);
  const toggleBeams = useSimulatorStore((s) => s.toggleBeams);

  const spaceOptions = Object.keys(SPACE_PRESETS).map((k) => ({
    value: k,
    label: SPACE_PRESETS[k].label,
  }));
  const lightingOptions = Object.keys(LIGHTING_PRESETS).map((k) => ({
    value: k,
    label: LIGHTING_PRESETS[k].label,
  }));

  return (
    <Panel title="프리셋">
      <Field label="공간">
        <Select options={spaceOptions} value={spaceKey} onChange={applySpace} />
      </Field>
      <Field label="조명">
        <Select options={lightingOptions} value={lightingKey} onChange={applyLighting} />
      </Field>
      <Field label="표시">
        <label className="toggle-row">
          <input type="checkbox" checked={showHelpers} onChange={toggleHelpers} />
          <span>조명 기자재</span>
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={showBeams} onChange={toggleBeams} />
          <span>빔 범위 (그물)</span>
        </label>
      </Field>
      <p className="hint">공간(방·창·자연광)과 조명(기재 배치)은 독립 적용됩니다.</p>
    </Panel>
  );
}
