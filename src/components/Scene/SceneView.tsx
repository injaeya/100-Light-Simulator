/**
 * SceneView.tsx — 3D 뷰포트 (Canvas + 카메라 + 컨트롤)
 */
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { fieldOfView } from '../../lib/optics';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Space } from './Space';
import { Subject } from './Subject';
import { Lights } from './Lights';

function CameraRig() {
  const camera = useSimulatorStore((s) => s.camera);
  const exposureComp = useSimulatorStore((s) => s.exposureCompensation);

  // 수직 화각을 three.js PerspectiveCamera fov 로 사용
  const vfov = fieldOfView(camera.focalLength, camera.sensor).vertical;

  // 노출 보정 → 톤매핑 노출로 반영 (스톱 → 배율)
  const exposure = Math.pow(2, exposureComp);

  return (
    <PerspectiveCamera
      makeDefault
      fov={vfov}
      position={[camera.subjectDistance * 0.9, 1.5, camera.subjectDistance]}
      near={0.05}
      far={200}
      onUpdate={(cam) => cam.updateProjectionMatrix()}
      // exposure 는 gl 에서 처리하지만, 카메라 리렌더 트리거용으로 참조
      userData={{ exposure }}
    />
  );
}

export function SceneView() {
  const space = useSimulatorStore((s) => s.space);
  const selectLight = useSimulatorStore((s) => s.selectLight);
  const exposureComp = useSimulatorStore((s) => s.exposureCompensation);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: Math.pow(2, exposureComp),
      }}
      onPointerMissed={() => selectLight(null)}
    >
      <color attach="background" args={['#0b0b0f']} />
      <CameraRig />
      <OrbitControls
        makeDefault
        target={[0, 1.2, 0]}
        minDistance={0.8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 1.9}
        enableDamping
      />

      <Space spaceId={space} />
      <Subject />
      <Lights />

      {/* 피사체 접지 그림자 보강 */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={10}
        blur={2.4}
        far={4}
        resolution={512}
        color="#000000"
      />
    </Canvas>
  );
}
