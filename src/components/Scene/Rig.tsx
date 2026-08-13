/**
 * Rig.tsx — 조명 리그: 기재 스포트라이트 + 태양 + 창광 + 바운스 앰비언트
 * 광도(cd)를 three 물리 광원 intensity 로, WB 보정 색으로.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Object3D, type DirectionalLight, type SpotLight } from 'three';
import { lightAim, lightVec, stageFace } from '../../sim/coords';
import { lightQuality } from '../../sim/modifiers';
import { FIXTURES } from '../../sim/fixtures';
import { kelvinCSS, wbFactor } from '../../sim/kelvin';
import { effCd, effSize, type Analysis } from '../../sim/photometry';
import type { LightState, SimState } from '../../sim/types';
import { lin } from './sceneColor';
import { FixtureModel } from './FixtureModel';
import { BeamGizmo } from './BeamGizmo';

function useTarget(pos: [number, number, number]) {
  const obj = useMemo(() => new Object3D(), []);
  useEffect(() => {
    obj.position.set(pos[0], pos[1], pos[2]);
    obj.updateMatrixWorld();
  }, [obj, pos]);
  return obj;
}

function FixtureLight({
  L,
  sim,
  showHelpers,
  showBeams,
  selected,
  onSelect,
}: {
  L: LightState;
  sim: SimState;
  showHelpers: boolean;
  showBeams: boolean;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const ref = useRef<SpotLight>(null);
  const p = lightVec(sim, L);
  // 조준 타깃(인물/배경/자유). 자유 배치·자유 조준 시 임의 방향
  const t = lightAim(sim, L);
  const target = useTarget([t.x, t.y, t.z]);
  const cd = effCd(L);
  const kind = FIXTURES[L.fix].kind;
  // 조명 종류(모디파이어)별 광질: 빔 각도·엣지 부드러움·그림자 경도
  const q = lightQuality(L.mod);
  const angle = q.angle;
  const penumbra = q.penumbra;
  const wf = wbFactor(L.kelvin, sim.expo.wb);
  const col = lin(wf.r, wf.g, wf.b);
  const shadowRadius = Math.min(24, Math.max(0.5, (effSize(L) / Math.max(0.3, L.dist)) * 13 * q.softness));

  useEffect(() => {
    if (ref.current) ref.current.target = target;
  }, [target]);

  return (
    <group>
      {L.on && (
        <>
          <primitive object={target} />
          <spotLight
            ref={ref}
            position={[p.x, p.y, p.z]}
            color={col}
            intensity={cd}
            angle={angle}
            penumbra={penumbra}
            decay={2}
            distance={0}
            castShadow={L.shadow && kind !== 'bounce'}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0004}
            shadow-radius={shadowRadius}
          />
        </>
      )}
      {/* 실제 기자재 3D 모델 (스탠드+바디+모디파이어+발광면) */}
      {showHelpers && (
        <FixtureModel
          L={L}
          p={[p.x, p.y, p.z]}
          t={[t.x, t.y, t.z]}
          selected={selected}
          onSelect={onSelect}
        />
      )}
      {/* 빔 범위 그물 — 선택된 조명만 (반사판 제외) */}
      {showBeams && selected && L.on && kind !== 'bounce' && (
        <BeamGizmo
          p={[p.x, p.y, p.z]}
          t={[t.x, t.y, t.z]}
          angleRad={angle}
          omni={false}
          color={kelvinCSS(L.kelvin)}
        />
      )}
    </group>
  );
}

/** 창문 확산광 (면광원 근사 → 넓은 스포트) */
function WindowLights({ sim, analysis }: { sim: SimState; analysis: Analysis }) {
  const face = stageFace(sim);
  return (
    <>
      {analysis.wd.wins.map((w) => {
        if (w.I <= 0.5) return null;
        const wf = wbFactor(w.k, sim.expo.wb);
        return (
          <WindowLight key={w.W.id} pos={[w.pos.x, w.pos.y, w.pos.z]} face={[face.x, face.y, face.z]} intensity={w.I} color={lin(wf.r, wf.g, wf.b)} />
        );
      })}
    </>
  );
}
function WindowLight({ pos, face, intensity, color }: { pos: [number, number, number]; face: [number, number, number]; intensity: number; color: ReturnType<typeof lin> }) {
  const ref = useRef<SpotLight>(null);
  const target = useTarget(face);
  useEffect(() => { if (ref.current) ref.current.target = target; }, [target]);
  return (
    <>
      <primitive object={target} />
      <spotLight ref={ref} position={pos} color={color} intensity={intensity} angle={1.2} penumbra={1} decay={2} distance={0} />
    </>
  );
}

/** 태양 직사광 */
function Sun({ sim, analysis }: { sim: SimState; analysis: Analysis }) {
  const ref = useRef<DirectionalLight>(null);
  const face = stageFace(sim);
  const sv = analysis.wd.sv;
  const on = analysis.wd.sunLux > 10 && !analysis.wd.sk.night;
  const pos: [number, number, number] = [face.x + sv.x * 30, face.y + sv.y * 30, face.z + sv.z * 30];
  const target = useTarget([0, 0, 0]);
  const wf = wbFactor(analysis.wd.sk.sunK, sim.expo.wb);
  useEffect(() => { if (ref.current) ref.current.target = target; }, [target]);
  if (!on) return null;
  const ext = Math.max(sim.room.w, sim.room.d) * 0.75;
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={ref}
        position={pos}
        intensity={analysis.wd.sunLux}
        color={lin(wf.r, wf.g, wf.b)}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-camera-left={-ext}
        shadow-camera-right={ext}
        shadow-camera-top={ext}
        shadow-camera-bottom={-ext}
        shadow-bias={-0.0004}
      />
    </>
  );
}

export function Rig({
  sim,
  analysis,
  showHelpers,
  showBeams,
  selectedLightId,
  onSelect,
}: {
  sim: SimState;
  analysis: Analysis;
  showHelpers: boolean;
  showBeams: boolean;
  selectedLightId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      <ambientLight intensity={analysis.bounce} />
      {sim.lights.map((L) => (
        <FixtureLight key={L.id} L={L} sim={sim} showHelpers={showHelpers} showBeams={showBeams} selected={L.id === selectedLightId} onSelect={onSelect} />
      ))}
      <WindowLights sim={sim} analysis={analysis} />
      <Sun sim={sim} analysis={analysis} />
    </>
  );
}
