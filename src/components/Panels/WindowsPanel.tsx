/**
 * WindowsPanel.tsx — 창문 목록 · 추가 · 편집
 */
import { useSimulatorStore } from '../../store/simulatorStore';
import type { WallId } from '../../sim/types';
import { Panel, Field, Slider, Select } from './controls';

export function WindowsPanel() {
  const wins = useSimulatorStore((s) => s.wins);
  const selectedWinId = useSimulatorStore((s) => s.selectedWinId);
  const addWin = useSimulatorStore((s) => s.addWin);
  const removeWin = useSimulatorStore((s) => s.removeWin);
  const updateWin = useSimulatorStore((s) => s.updateWin);
  const selectWin = useSimulatorStore((s) => s.selectWin);

  const selected = wins.find((w) => w.id === selectedWinId) ?? null;

  return (
    <Panel
      title="창문"
      subtitle={`${wins.length}개`}
      actions={
        <button className="ghost-btn" type="button" onClick={addWin}>
          추가
        </button>
      }
    >
      <div className="light-list">
        {wins.map((w) => (
          <div
            key={w.id}
            className={`light-row ${w.id === selectedWinId ? 'selected' : ''} ${w.on ? '' : 'disabled'}`}
            onClick={() => selectWin(w.id)}
          >
            <span className="light-name">{`창 ${w.wall}`}</span>
            <button
              className="icon-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeWin(w.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="light-editor">
          <Field label="전원">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={selected.on}
                onChange={(e) => updateWin(selected.id, { on: e.target.checked })}
              />
              <span>{selected.on ? '켜짐' : '꺼짐'}</span>
            </label>
          </Field>
          <Field label="벽">
            <Select<WallId>
              options={[
                { value: 'left', label: '좌' },
                { value: 'right', label: '우' },
                { value: 'back', label: '뒤' },
                { value: 'front', label: '앞' },
              ]}
              value={selected.wall}
              onChange={(v) => updateWin(selected.id, { wall: v })}
            />
          </Field>
          <Field label="위치 u" value={`${selected.u.toFixed(1)}m`}>
            <Slider
              min={-6}
              max={6}
              step={0.1}
              value={selected.u}
              onChange={(v) => updateWin(selected.id, { u: v })}
            />
          </Field>
          <Field label="너비 w" value={`${selected.w.toFixed(1)}m`}>
            <Slider
              min={0.4}
              max={5}
              step={0.1}
              value={selected.w}
              onChange={(v) => updateWin(selected.id, { w: v })}
            />
          </Field>
          <Field label="높이 h" value={`${selected.h.toFixed(1)}m`}>
            <Slider
              min={0.4}
              max={4}
              step={0.1}
              value={selected.h}
              onChange={(v) => updateWin(selected.id, { h: v })}
            />
          </Field>
          <Field label="창턱 sill" value={`${selected.sill.toFixed(2)}m`}>
            <Slider
              min={0}
              max={3}
              step={0.05}
              value={selected.sill}
              onChange={(v) => updateWin(selected.id, { sill: v })}
            />
          </Field>
          <Field label="커튼 curtain" value={`${selected.curtain}% 투과`}>
            <Slider
              min={0}
              max={100}
              step={5}
              value={selected.curtain}
              onChange={(v) => updateWin(selected.id, { curtain: v })}
            />
          </Field>
        </div>
      ) : (
        <p className="hint">창을 추가하거나 선택하세요.</p>
      )}
    </Panel>
  );
}
