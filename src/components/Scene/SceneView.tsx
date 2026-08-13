/**
 * SceneView.tsx — 3D 뷰포트. 촬영 카메라(cam) / 자유 궤도(free) 전환.
 * 노출은 측광 톤매핑 공식(ISO·셔터·조리개·ND)으로.
 */
import { useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, AdaptiveDpr } from '@react-three/drei';
import { ACESFilmicToneMapping, PerspectiveCamera as ThreePerspectiveCamera, SRGBColorSpace } from 'three';
import { activeCam, camAim, camPos, faceC } from '../../sim/coords';
import { analyze, toneMappingExposure } from '../../sim/photometry';
import { useSimulatorStore, type Store } from '../../store/simulatorStore';
import { useSim } from '../../store/useSim';
import type { SimState } from '../../sim/types';
import { Room } from './Room';
import { SubjectModel } from './SubjectModel';
import { Rig } from './Rig';

function ExposureRig({ sim }: { sim: SimState }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const exposure = Math.min(8, Math.max(0.0002, toneMappingExposure(sim)));
  // 렌더 직전 매 프레임 적용 (demand 모드에서도 확실히 반영)
  useFrame(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
  });
  useEffect(() => { invalidate(); }, [invalidate, exposure]);
  return null;
}

/** 촬영 카메라: 활성 카메라 위치에서 조준점을 봄, 초점거리 → 수직화각 */
function ShotCamera({ sim }: { sim: SimState }) {
  const cam = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const C = activeCam(sim);
    const cp = camPos(sim, C);
    const at = camAim(sim, C);
    cam.position.set(cp.x, cp.y, cp.z);
    cam.lookAt(at.x, at.y, at.z);
    if (cam instanceof ThreePerspectiveCamera) {
      cam.fov = (2 * Math.atan(10.125 / C.focal) * 180) / Math.PI;
    }
    cam.updateProjectionMatrix();
    invalidate();
  }, [cam, invalidate, sim]);
  return null;
}

export function SceneView() {
  const sim = useSim();
  const view = useSimulatorStore((s: Store) => s.view);
  const theme = useSimulatorStore((s) => s.theme);
  const showHelpers = useSimulatorStore((s) => s.showHelpers);
  const showBeams = useSimulatorStore((s) => s.showBeams);
  const selectedLightId = useSimulatorStore((s) => s.selectedLightId);
  const selectLight = useSimulatorStore((s) => s.selectLight);

  const analysis = useMemo(() => analyze(sim), [sim]);
  const fc = faceC(sim);

  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace, powerPreference: 'high-performance' }}
      onPointerMissed={() => selectLight(null)}
    >
      <color attach="background" args={[theme === 'light' ? '#c4c6cc' : '#050507']} />
      <PerspectiveCamera makeDefault fov={45} near={0.05} far={400} position={[4.6, 2.4, 5.2]} />
      <ExposureRig sim={sim} />

      {view === 'cam' ? (
        <ShotCamera sim={sim} />
      ) : (
        <OrbitControls makeDefault target={[fc.x, fc.y, fc.z]} minDistance={0.6} maxDistance={40} enableDamping />
      )}

      <Room sim={sim} />
      <SubjectModel sim={sim} />
      <Rig sim={sim} analysis={analysis} showHelpers={showHelpers} showBeams={showBeams} selectedLightId={selectedLightId} onSelect={selectLight} />

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
