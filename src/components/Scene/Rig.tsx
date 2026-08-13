/**
 * Rig.tsx — 조명 리그: 기재 스포트라이트 + 태양 + 창광 + 바운스 앰비언트
 * 광도(cd)를 three 물리 광원 intensity 로, WB 보정 색으로.
 */
import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide, Object3D, type DirectionalLight, type SpotLight } from 'three';
import { bgPoint, faceC, lightVec } from '../../sim/coords';
import { DEFAULT_ANGLE, MOD_ANGLE } from '../../sim/modifiers';
import { FIXTURES } from '../../sim/fixtures';
import { kelvinRGB, wbFactor } from '../../sim/kelvin';
import { effCd, effSize, type Analysis } from '../../sim/photometry';
import type { LightState, SimState } from '../../sim/types';
import { lin } from './sceneColor';

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
  selected,
  onSelect,
}: {
  L: LightState;
  sim: SimState;
  showHelpers: boolean;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const ref = useRef<SpotLight>(null);
  const p = lightVec(sim, L);
  const t = L.aim === 'bg' ? bgPoint(sim) : faceC(sim);
  const target = useTarget([t.x, t.y, t.z]);
  const cd = effCd(L);
  const sz = effSize(L);
  const kind = FIXTURES[L.fix].kind;
  const [angle, penumbra] = MOD_ANGLE[L.mod] || DEFAULT_ANGLE;
  const wf = wbFactor(L.kelvin, sim.expo.wb);
  const col = lin(wf.r, wf.g, wf.b);

  useEffect(() => {
    if (ref.current) ref.current.target = target;
  }, [target]);

  // 발광면 방사휘도(에미시브). 톤매핑을 타므로 노출과 함께 감쇠 (상한으로 과노출 방지)
  const A = Math.max(0.006, sz * sz * 0.72);
  const rad = L.on ? Math.min(2000, cd / A) : 0;
  const kc = kelvinRGB(L.kelvin);
  const emissive = lin(rad * kc.r + 0.004, rad * kc.g + 0.004, rad * kc.b + 0.004);

  const shadowRadius = Math.min(18, Math.max(0.6, (sz / Math.max(0.3, L.dist)) * 13));

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
      {/* 기재 3D 표현 */}
      {showHelpers && (
        <group position={[p.x, p.y, p.z]} onClick={(e) => { e.stopPropagation(); onSelect(L.id); }}>
          <mesh>
            {kind === 'tube' ? (
              <cylinderGeometry args={[0.03, 0.03, FIXTURES[L.fix].len || 1, 12]} />
            ) : kind === 'bounce' ? (
              <boxGeometry args={[sz, sz, 0.03]} />
            ) : (
              <boxGeometry args={[Math.max(0.12, sz * 0.7), Math.max(0.12, sz * 0.7), 0.1]} />
            )}
            <meshBasicMaterial color={emissive} toneMapped side={DoubleSide} />
          </mesh>
          {selected && (
            <mesh>
              <sphereGeometry args={[Math.max(0.16, sz * 0.5), 16, 12]} />
              <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}

/** 창문 확산광 (면광원 근사 → 넓은 스포트) */
function WindowLights({ sim, analysis }: { sim: SimState; analysis: Analysis }) {
  const face = faceC(sim);
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
  const face = faceC(sim);
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
  selectedLightId,
  onSelect,
}: {
  sim: SimState;
  analysis: Analysis;
  showHelpers: boolean;
  selectedLightId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      <ambientLight intensity={analysis.bounce} />
      {sim.lights.map((L) => (
        <FixtureLight key={L.id} L={L} sim={sim} showHelpers={showHelpers} selected={L.id === selectedLightId} onSelect={onSelect} />
      ))}
      <WindowLights sim={sim} analysis={analysis} />
      <Sun sim={sim} analysis={analysis} />
    </>
  );
}
