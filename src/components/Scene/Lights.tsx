/**
 * Lights.tsx — 스토어의 조명들을 Three.js 광원 + 시각 헬퍼로 렌더링
 */
import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide, Object3D, type SpotLight as ThreeSpotLight } from 'three';
import { kelvinToRGB, rgbToHex } from '../../lib/optics';
import type { Light } from '../../store/simulatorStore';
import { useSimulatorStore } from '../../store/simulatorStore';

/** 출력(와트 상당) → three.js intensity 로 대략 매핑 */
function toThreeIntensity(intensity: number): number {
  return (intensity / 1000) * 3;
}

interface LightItemProps {
  light: Light;
  showHelpers: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

function LightItem({ light, showHelpers, selected, onSelect }: LightItemProps) {
  const spotRef = useRef<ThreeSpotLight>(null);
  const targetObj = useMemo(() => new Object3D(), []);
  const color = rgbToHex(kelvinToRGB(light.kelvin));

  // 스포트라이트 타겟 좌표 갱신 + 연결
  useEffect(() => {
    targetObj.position.set(light.target[0], light.target[1], light.target[2]);
    targetObj.updateMatrixWorld();
    if (spotRef.current) {
      spotRef.current.target = targetObj;
    }
  }, [targetObj, light.target]);

  if (!light.enabled) {
    return showHelpers ? (
      <mesh
        position={light.position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(light.id);
        }}
      >
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#555" wireframe />
      </mesh>
    ) : null;
  }

  const threeIntensity = toThreeIntensity(light.intensity);
  const isOmni = light.type === 'point';
  const penumbra = light.type === 'softbox' || light.type === 'panel' ? 0.9 : 0.4;

  return (
    <group>
      {isOmni ? (
        <pointLight
          position={light.position}
          color={color}
          intensity={threeIntensity}
          distance={20}
          decay={2}
          castShadow
        />
      ) : (
        <>
          <primitive object={targetObj} />
          <spotLight
            ref={spotRef}
            position={light.position}
            color={color}
            intensity={threeIntensity}
            angle={(light.coneAngle * Math.PI) / 180 / 2}
            penumbra={penumbra}
            distance={30}
            decay={2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        </>
      )}

      {/* 조명 기구 시각 표현 */}
      {showHelpers && (
        <mesh
          position={light.position}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(light.id);
          }}
        >
          {light.type === 'softbox' || light.type === 'panel' ? (
            <boxGeometry args={[0.6, 0.6, 0.12]} />
          ) : light.type === 'tube' ? (
            <cylinderGeometry args={[0.05, 0.05, 0.8, 12]} />
          ) : (
            <coneGeometry args={[0.18, 0.32, 16]} />
          )}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 1.6 : 0.7}
            side={DoubleSide}
          />
        </mesh>
      )}

      {/* 선택된 조명 강조 링 */}
      {showHelpers && selected && (
        <mesh position={light.position} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.46, 32]} />
          <meshBasicMaterial color="#ffffff" side={DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

export function Lights() {
  const lights = useSimulatorStore((s) => s.lights);
  const showHelpers = useSimulatorStore((s) => s.showHelpers);
  const selectedLightId = useSimulatorStore((s) => s.selectedLightId);
  const selectLight = useSimulatorStore((s) => s.selectLight);

  return (
    <>
      {/* 아주 약한 환경광 (완전 암부 방지) */}
      <ambientLight intensity={0.06} />
      {lights.map((light) => (
        <LightItem
          key={light.id}
          light={light}
          showHelpers={showHelpers}
          selected={light.id === selectedLightId}
          onSelect={selectLight}
        />
      ))}
    </>
  );
}
