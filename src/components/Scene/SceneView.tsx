/**
 * SceneView.tsx — 3D 뷰포트 (Canvas + 카메라 + 물리 기반 렌더링)
 */
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  ContactShadows,
  Environment,
  Lightformer,
  AdaptiveDpr,
} from '@react-three/drei';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { fieldOfView } from '../../lib/optics';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Space } from './Space';
import { Subject } from './Subject';
import { Lights } from './Lights';
import { Effects } from './Effects';
import { useExposure } from './useExposure';

function CameraRig() {
  const camera = useSimulatorStore((s) => s.camera);

  // 수직 화각을 three.js PerspectiveCamera fov 로 사용 (렌즈 화각 정확 반영)
  const vfov = fieldOfView(camera.focalLength, camera.sensor).vertical;

  return (
    <PerspectiveCamera
      makeDefault
      fov={vfov}
      position={[camera.subjectDistance * 0.85, 1.55, camera.subjectDistance]}
      near={0.05}
      far={200}
    />
  );
}

/**
 * 로컬 IBL(이미지 기반 조명) — 원격 HDRI 없이 Lightformer 로 구성.
 * 사실적인 반사/바운스 앰비언트를 제공하되, 주 조명(3점)이 지배하도록 약하게.
 */
function StudioEnvironment() {
  const exposure = useExposure();
  return (
    <Environment
      resolution={128}
      frames={1}
      background={false}
      environmentIntensity={0.18 * exposure}
    >
      {/* 상단 대형 소프트 소스 (천장 바운스 근사) */}
      <Lightformer
        form="rect"
        intensity={1.2}
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 12, 1]}
        color="#ffffff"
      />
      {/* 정면 약한 필 */}
      <Lightformer
        form="rect"
        intensity={0.5}
        position={[0, 2, 8]}
        rotation={[0, 0, 0]}
        scale={[8, 5, 1]}
        color="#cfd8ff"
      />
      {/* 측면 림 반사 */}
      <Lightformer
        form="rect"
        intensity={0.6}
        position={[-8, 3, -4]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[6, 6, 1]}
        color="#ffe9cf"
      />
    </Environment>
  );
}

export function SceneView() {
  const space = useSimulatorStore((s) => s.space);
  const selectLight = useSimulatorStore((s) => s.selectLight);
  const postFx = useSimulatorStore((s) => s.postFx);

  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        outputColorSpace: SRGBColorSpace,
        powerPreference: 'high-performance',
      }}
      onPointerMissed={() => selectLight(null)}
    >
      <color attach="background" args={['#0a0a0d']} />

      <CameraRig />
      <OrbitControls
        makeDefault
        target={[0, 1.2, 0]}
        minDistance={0.8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 1.9}
        enableDamping
      />

      <StudioEnvironment />
      <Space spaceId={space} />
      <Subject />
      <Lights />

      {/* 피사체 접지 그림자 보강 (정적 씬이므로 1회 베이크) */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.6}
        scale={12}
        blur={2.6}
        far={5}
        resolution={512}
        frames={1}
        color="#000000"
      />

      {/* 사진 실사급 포스트프로세싱 */}
      {postFx && <Effects />}

      {/* 인터랙션 중 해상도 자동 저하 → 조작 부드럽게 */}
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
