/**
 * Lights.tsx — 스토어의 조명들을 물리 기반 Three.js 광원으로 렌더링
 *
 * three r155+ 는 물리 광원 단위를 사용한다:
 *   - SpotLight / PointLight 의 intensity 는 광도(칸델라, cd)
 *   - decay = 2 → 역제곱 법칙(E = I / d²) 적용
 * 따라서 광속(lm)을 빔 입체각으로 나눠 광도(cd)로 환산해 넣으면
 * 실제 조명의 밝기·거리 감쇠·빔 확산이 물리적으로 재현된다.
 */
import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide, Object3D, type SpotLight as ThreeSpotLight } from 'three';
import { FIXTURE_PRESETS } from '../../data/presets';
import { kelvinToRGB, luminousIntensity, rgbToHex } from '../../lib/optics';
import type { Light } from '../../store/simulatorStore';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useExposure } from './useExposure';

interface LightItemProps {
  light: Light;
  exposure: number;
  showHelpers: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

function LightItem({ light, exposure, showHelpers, selected, onSelect }: LightItemProps) {
  const spotRef = useRef<ThreeSpotLight>(null);
  const targetObj = useMemo(() => new Object3D(), []);
  const color = rgbToHex(kelvinToRGB(light.kelvin));
  const preset = FIXTURE_PRESETS[light.type];

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

  const isOmni = light.type === 'point';

  // 광속(lm) → 광도(cd). 카메라 노출을 곱해 HDR 입력에 반영
  // (수학적으로 ACES(radiance × exposure) 와 동일).
  const candela =
    luminousIntensity(light.lumens, isOmni ? 360 : light.coneAngle) * exposure;

  // 기구 부드러움 → 페넘브라(빔 가장자리 감쇠). 소프트박스=1에 가깝게.
  const penumbra = Math.min(1, 0.15 + preset.softness * 0.85);

  return (
    <group>
      {isOmni ? (
        <pointLight
          position={light.position}
          color={color}
          intensity={candela}
          decay={2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.0005}
        />
      ) : (
        <>
          <primitive object={targetObj} />
          <spotLight
            ref={spotRef}
            position={light.position}
            color={color}
            intensity={candela}
            angle={(light.coneAngle * Math.PI) / 180 / 2}
            penumbra={penumbra}
            decay={2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
          />
        </>
      )}

      {/* 조명 기구 시각 표현 (헬퍼) */}
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
          {/* 헬퍼는 톤매핑 영향을 받지 않도록 basic 재질 사용 */}
          <meshBasicMaterial color={color} toneMapped={false} side={DoubleSide} />
        </mesh>
      )}

      {/* 선택된 조명 강조 링 */}
      {showHelpers && selected && (
        <mesh position={light.position} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.46, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
            side={DoubleSide}
            transparent
            opacity={0.85}
          />
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
  const exposure = useExposure();

  return (
    <>
      {/*
        환경광(바운스 근사). 완전 암부를 막는 미세한 값.
        노출을 곱해 다른 광원과 동일한 스케일 유지.
      */}
      <ambientLight intensity={10 * exposure} />
      {lights.map((light) => (
        <LightItem
          key={light.id}
          light={light}
          exposure={exposure}
          showHelpers={showHelpers}
          selected={light.id === selectedLightId}
          onSelect={selectLight}
        />
      ))}
    </>
  );
}
