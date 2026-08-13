/**
 * LightsPanel.tsx — 조명 목록 · 추가 · 편집
 */
import { useState } from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { FIXTURES, FIXTURE_KEYS } from '../../sim/fixtures';
import { MODIFIERS, modsFor } from '../../sim/modifiers';
import { kelvinCSS } from '../../sim/kelvin';
import type { Aim } from '../../sim/types';
import { Panel, Field, Slider, Segmented, Select } from './controls';

export function LightsPanel() {
  const lights = useSimulatorStore((s) => s.lights);
  const selectedLightId = useSimulatorStore((s) => s.selectedLightId);
  const addLight = useSimulatorStore((s) => s.addLight);
  const removeLight = useSimulatorStore((s) => s.removeLight);
  const updateLight = useSimulatorStore((s) => s.updateLight);
  const selectLight = useSimulatorStore((s) => s.selectLight);

  const [addFix, setAddFix] = useState<string>(FIXTURE_KEYS[0]);

  const selected = lights.find((l) => l.id === selectedLightId) ?? null;

  const fixtureOptions = FIXTURE_KEYS.map((k) => ({ value: k, label: FIXTURES[k].label }));

  return (
    <Panel title="조명" subtitle={`${lights.length}개`}>
      <div className="light-list">
        {lights.map((l) => (
          <div
            key={l.id}
            className={`light-row ${l.id === selectedLightId ? 'selected' : ''} ${l.on ? '' : 'disabled'}`}
            onClick={() => selectLight(l.id)}
          >
            <span className="light-dot" style={{ background: kelvinCSS(l.kelvin) }} />
            <span className="light-name">{l.name}</span>
            <span className="light-type">{FIXTURES[l.fix].label}</span>
            <button
              className="icon-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeLight(l.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="add-fixtures">
        <span className="add-label">조명 추가</span>
        <Select options={fixtureOptions} value={addFix} onChange={setAddFix} />
        <button className="ghost-btn" type="button" onClick={() => addLight(addFix)}>
          추가
        </button>
      </div>

      {selected ? (
        <div className="light-editor">
          <Field label="이름">
            <input
              className="text-input"
              type="text"
              value={selected.name}
              onChange={(e) => updateLight(selected.id, { name: e.target.value })}
            />
          </Field>
          <Field label="전원">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={selected.on}
                onChange={(e) => updateLight(selected.id, { on: e.target.checked })}
              />
              <span>{selected.on ? '켜짐' : '꺼짐'}</span>
            </label>
          </Field>
          <Field label="기재">
            <Select
              options={fixtureOptions}
              value={selected.fix}
              onChange={(v) => updateLight(selected.id, { fix: v })}
            />
          </Field>
          <Field label="모디파이어">
            <Select
              options={modsFor(selected.fix).map((k) => ({ value: k, label: MODIFIERS[k].label }))}
              value={selected.mod}
              onChange={(v) => updateLight(selected.id, { mod: v })}
            />
          </Field>
          <Field label="디머" value={`${selected.dim}%`}>
            <Slider
              min={0}
              max={100}
              step={1}
              value={selected.dim}
              onChange={(v) => updateLight(selected.id, { dim: v })}
            />
          </Field>
          <Field
            label="색온도"
            value={
              <span className="kelvin-value">
                <span className="kelvin-swatch" style={{ background: kelvinCSS(selected.kelvin) }} />
                {`${selected.kelvin}K`}
              </span>
            }
          >
            <Slider
              min={2000}
              max={10000}
              step={100}
              value={selected.kelvin}
              onChange={(v) => updateLight(selected.id, { kelvin: v })}
            />
          </Field>
          <Field label="방위 az" value={`${selected.az}°`}>
            <Slider
              min={-180}
              max={180}
              step={1}
              value={selected.az}
              onChange={(v) => updateLight(selected.id, { az: v })}
            />
          </Field>
          <Field label="거리 dist" value={`${selected.dist.toFixed(2)}m`}>
            <Slider
              min={0.3}
              max={6}
              step={0.05}
              value={selected.dist}
              onChange={(v) => updateLight(selected.id, { dist: v })}
            />
          </Field>
          <Field label="높이 h" value={`${selected.h.toFixed(2)}m`}>
            <Slider
              min={0.3}
              max={4}
              step={0.02}
              value={selected.h}
              onChange={(v) => updateLight(selected.id, { h: v })}
            />
          </Field>
          <Field label="지향">
            <Segmented<Aim>
              options={[
                { value: 'subj', label: '인물' },
                { value: 'bg', label: '배경' },
              ]}
              value={selected.aim}
              onChange={(v) => updateLight(selected.id, { aim: v })}
            />
          </Field>
          <Field label="그림자">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={selected.shadow}
                onChange={(e) => updateLight(selected.id, { shadow: e.target.checked })}
              />
              <span>그림자</span>
            </label>
          </Field>
        </div>
      ) : (
        <p className="hint">목록에서 조명을 선택하세요.</p>
      )}
    </Panel>
  );
}
