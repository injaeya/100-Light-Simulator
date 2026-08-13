/**
 * CameraPanel.tsx — 카메라(다대) 목록·배치·렌즈 + 전역 노출
 * 카메라를 추가/삭제/선택하고, 활성 카메라의 위치(인물 기준/자유)·조준·렌즈를 편집한다.
 * 노출(ISO/셔터/조리개/ND/WB)은 전체 공용이며 조리개는 활성 렌즈 범위로 제한된다.
 */
import { useSimulatorStore } from '../../store/simulatorStore';
import { kelvinCSS } from '../../sim/kelvin';
import { activeCam } from '../../sim/coords';
import { useSim } from '../../store/useSim';
import {
  LENS_ORDER,
  getLens,
  isPrime,
  apertureStops,
  horizontalFov,
} from '../../sim/lenses';
import type { CamAim } from '../../sim/types';
import { Panel, Field, Slider, Select, Segmented } from './controls';

const ISO = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 50, 1 / 60, 1 / 125, 1 / 250, 1 / 500, 1 / 1000];
const ND = [0, 1, 2, 3, 4, 5, 6];

const LENS_OPTIONS = LENS_ORDER.map((id) => ({ value: id, label: getLens(id).label }));

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

function fmtF(f: number): string {
  return `f/${Number.isInteger(f) ? f : f.toFixed(1)}`;
}

export function CameraPanel() {
  const sim = useSim();
  const cams = sim.cams;
  const activeCamId = sim.activeCamId;
  const expo = sim.expo;
  const setCam = useSimulatorStore((s) => s.setCam);
  const addCam = useSimulatorStore((s) => s.addCam);
  const removeCam = useSimulatorStore((s) => s.removeCam);
  const selectCam = useSimulatorStore((s) => s.selectCam);
  const setExpo = useSimulatorStore((s) => s.setExpo);
  const setFocal = useSimulatorStore((s) => s.setFocal);
  const setLens = useSimulatorStore((s) => s.setLens);
  const fitExposureNow = useSimulatorStore((s) => s.fitExposureNow);

  const cam = activeCam(sim);
  const lens = getLens(cam.lens);
  const prime = isPrime(lens);
  const fStops = apertureStops(lens, cam.focal);
  const fIdx = nearestIndex(fStops, expo.f);
  const fov = Math.round(horizontalFov(cam.focal));
  const hx = sim.room.w / 2, hz = sim.room.d / 2;

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
      {/* 카메라 목록(다대) */}
      <div className="light-list">
        {cams.map((c) => (
          <div
            key={c.id}
            className={`light-row ${c.id === activeCamId ? 'selected' : ''}`}
            onClick={() => selectCam(c.id)}
          >
            <span className="cam-mark">◉</span>
            <span className="light-name">{c.name}</span>
            <span className="light-type">{getLens(c.lens).short} · {c.focal}mm</span>
            {cams.length > 1 && (
              <button
                className="icon-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCam(c.id);
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="add-fixtures">
        <span className="add-label">카메라 {cams.length}대</span>
        <button className="ghost-btn" type="button" onClick={addCam}>
          + 카메라 추가
        </button>
      </div>

      {/* 활성 카메라 이름 */}
      <Field label="이름">
        <input
          className="text-input"
          type="text"
          value={cam.name}
          onChange={(e) => setCam({ name: e.target.value })}
        />
      </Field>

      {/* 렌즈 */}
      <Field label="렌즈" value={<span className={`lens-badge lens-${lens.grade}`}>{lens.grade}</span>}>
        <Select options={LENS_OPTIONS} value={cam.lens} onChange={setLens} />
      </Field>
      {prime ? (
        <Field label="초점거리 (단렌즈)" value={`${cam.focal}mm · ${fov}° 화각`}>
          <div className="lens-fixed">고정 {lens.focalMin}mm</div>
        </Field>
      ) : (
        <Field label="초점거리 (줌)" value={`${cam.focal}mm · ${fov}° 화각`}>
          <Slider min={lens.focalMin} max={lens.focalMax} step={1} value={cam.focal} onChange={setFocal} />
        </Field>
      )}

      {/* 배치 */}
      <Field label="배치">
        <Segmented<'stage' | 'free'>
          options={[
            { value: 'stage', label: '인물 기준' },
            { value: 'free', label: '자유 배치' },
          ]}
          value={cam.place}
          onChange={(v) => setCam({ place: v })}
        />
      </Field>
      {cam.place === 'stage' ? (
        <>
          <Field label="방위 az" value={`${cam.az}°`}>
            <Slider min={-180} max={180} step={1} value={cam.az} onChange={(v) => setCam({ az: v })} />
          </Field>
          <Field label="거리 dist" value={`${cam.dist.toFixed(2)}m`}>
            <Slider min={0.5} max={12} step={0.05} value={cam.dist} onChange={(v) => setCam({ dist: v })} />
          </Field>
        </>
      ) : (
        <>
          <Field label="위치 X (좌우)" value={`${cam.x.toFixed(2)}m`}>
            <Slider min={-hx} max={hx} step={0.05} value={cam.x} onChange={(v) => setCam({ x: v })} />
          </Field>
          <Field label="위치 Z (앞뒤)" value={`${cam.z.toFixed(2)}m`}>
            <Slider min={-hz} max={hz} step={0.05} value={cam.z} onChange={(v) => setCam({ z: v })} />
          </Field>
        </>
      )}
      <Field label="높이 h" value={`${cam.h.toFixed(2)}m`}>
        <Slider min={0.3} max={Math.max(3, sim.room.h - 0.1)} step={0.02} value={cam.h} onChange={(v) => setCam({ h: v })} />
      </Field>

      {/* 조준 */}
      <Field label="조준">
        <Segmented<CamAim>
          options={[
            { value: 'subj', label: '인물' },
            { value: 'free', label: '자유' },
          ]}
          value={cam.aim}
          onChange={(v) => setCam({ aim: v })}
        />
      </Field>
      {cam.aim === 'free' && (
        <>
          <Field label="조준 X" value={`${cam.tx.toFixed(2)}m`}>
            <Slider min={-hx} max={hx} step={0.05} value={cam.tx} onChange={(v) => setCam({ tx: v })} />
          </Field>
          <Field label="조준 Z" value={`${cam.tz.toFixed(2)}m`}>
            <Slider min={-hz} max={hz} step={0.05} value={cam.tz} onChange={(v) => setCam({ tz: v })} />
          </Field>
          <Field label="조준 높이" value={`${cam.ty.toFixed(2)}m`}>
            <Slider min={0} max={Math.max(3, sim.room.h - 0.1)} step={0.02} value={cam.ty} onChange={(v) => setCam({ ty: v })} />
          </Field>
        </>
      )}

      {/* 전역 노출 */}
      <div className="panel-divider" />
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
        <Slider min={0} max={fStops.length - 1} step={1} value={fIdx} onChange={(i) => setExpo({ f: fStops[i] })} />
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
