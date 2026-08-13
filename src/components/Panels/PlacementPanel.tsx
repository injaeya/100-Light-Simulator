/**
 * PlacementPanel.tsx — 피사체 · 방 · 환경(자연광) 배치 컨트롤
 */
import { useSimulatorStore } from '../../store/simulatorStore';
import type { FloorTex, Gender, Pose, Season, Sky, SkyMode } from '../../sim/types';
import { Panel, Field, Slider, Segmented, Select } from './controls';

export function PlacementPanel() {
  const subj = useSimulatorStore((s) => s.subj);
  const room = useSimulatorStore((s) => s.room);
  const env = useSimulatorStore((s) => s.env);
  const setSubj = useSimulatorStore((s) => s.setSubj);
  const setRoom = useSimulatorStore((s) => s.setRoom);
  const setEnv = useSimulatorStore((s) => s.setEnv);

  return (
    <Panel title="공간 · 환경">
      {/* ----- 피사체 ----- */}
      <Field label="성별">
        <Segmented<Gender>
          options={[
            { value: 'female', label: '여성' },
            { value: 'male', label: '남성' },
          ]}
          value={subj.gender}
          onChange={(v) => setSubj({ gender: v })}
        />
      </Field>
      <Field label="자세">
        <Segmented<Pose>
          options={[
            { value: 'sit', label: '앉기' },
            { value: 'stand', label: '서기' },
          ]}
          value={subj.pose}
          onChange={(v) => setSubj({ pose: v })}
        />
      </Field>
      <Field label="피사체 X" value={`${subj.x.toFixed(2)}m`}>
        <Slider min={-4} max={4} step={0.05} value={subj.x} onChange={(v) => setSubj({ x: v })} />
      </Field>
      <Field label="피사체 Z" value={`${subj.z.toFixed(2)}m`}>
        <Slider min={-9} max={0} step={0.05} value={subj.z} onChange={(v) => setSubj({ z: v })} />
      </Field>
      <Field label="피사체 방향 yaw" value={`${subj.yaw}°`}>
        <Slider min={-180} max={180} step={1} value={subj.yaw} onChange={(v) => setSubj({ yaw: v })} />
      </Field>
      <Field label="눈높이" value={`${subj.eyeH.toFixed(2)}m`}>
        <Slider min={0.8} max={1.9} step={0.01} value={subj.eyeH} onChange={(v) => setSubj({ eyeH: v })} />
      </Field>

      {/* ----- 방 ----- */}
      <Field label="방 너비 w" value={`${room.w.toFixed(1)}m`}>
        <Slider min={2} max={16} step={0.1} value={room.w} onChange={(v) => setRoom({ w: v })} />
      </Field>
      <Field label="방 깊이 d" value={`${room.d.toFixed(1)}m`}>
        <Slider min={2} max={20} step={0.1} value={room.d} onChange={(v) => setRoom({ d: v })} />
      </Field>
      <Field label="방 높이 h" value={`${room.h.toFixed(1)}m`}>
        <Slider min={2} max={7} step={0.1} value={room.h} onChange={(v) => setRoom({ h: v })} />
      </Field>
      <Field label="반사율 albedo" value={room.albedo.toFixed(2)}>
        <Slider min={0.05} max={0.9} step={0.01} value={room.albedo} onChange={(v) => setRoom({ albedo: v })} />
      </Field>
      <Field label="바닥">
        <Select<FloorTex>
          options={[
            { value: 'wood', label: '나무' },
            { value: 'concrete', label: '콘크리트' },
            { value: 'carpet', label: '카펫' },
            { value: 'tile', label: '타일' },
          ]}
          value={room.floor}
          onChange={(v) => setRoom({ floor: v })}
        />
      </Field>

      {/* ----- 환경 ----- */}
      <Field label="모드">
        <Segmented<SkyMode>
          options={[
            { value: 'day', label: '낮' },
            { value: 'night', label: '밤' },
          ]}
          value={env.mode}
          onChange={(v) => setEnv({ mode: v })}
        />
      </Field>
      <Field label="시각" value={`${env.time}시`}>
        <Slider min={4} max={22} step={0.5} value={env.time} onChange={(v) => setEnv({ time: v })} />
      </Field>
      <Field label="하늘">
        <Select<Sky>
          options={[
            { value: 'clear', label: '맑음' },
            { value: 'cloud', label: '구름' },
            { value: 'overcast', label: '흐림' },
          ]}
          value={env.sky}
          onChange={(v) => setEnv({ sky: v })}
        />
      </Field>
      <Field label="계절">
        <Select<Season>
          options={[
            { value: 'summer', label: '여름' },
            { value: 'mid', label: '봄가을' },
            { value: 'winter', label: '겨울' },
          ]}
          value={env.season}
          onChange={(v) => setEnv({ season: v })}
        />
      </Field>
      <Field label="방위 orient" value={`${env.orient}°`}>
        <Slider min={0} max={359} step={5} value={env.orient} onChange={(v) => setEnv({ orient: v })} />
      </Field>
      <Field label="실내등 amb" value={`${env.amb} lx 실내등`}>
        <Slider min={0} max={300} step={5} value={env.amb} onChange={(v) => setEnv({ amb: v })} />
      </Field>
    </Panel>
  );
}
