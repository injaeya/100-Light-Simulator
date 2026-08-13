/**
 * Space.tsx — 공간(세트) 렌더링 (물리 기반 재질)
 */
import { SPACE_PRESETS, type SpaceId } from '../../data/presets';

interface SpaceProps {
  spaceId: SpaceId;
}

export function Space({ spaceId }: SpaceProps) {
  const preset = SPACE_PRESETS.find((s) => s.id === spaceId)!;
  const { size, floorColor, wallColor } = preset;

  // 공간별 바닥 반사 특성 (무대=약간 광택, 스튜디오=매트)
  const floorRoughness = spaceId === 'stage' ? 0.35 : spaceId === 'studio' ? 0.85 : 0.6;
  const floorMetalness = spaceId === 'stage' ? 0.15 : 0.0;

  if (spaceId === 'empty') {
    return (
      <>
        <gridHelper args={[size.w, size.w, '#3a3a44', '#1c1c22']} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[size.w, size.d]} />
          <meshStandardMaterial color={floorColor} roughness={0.9} envMapIntensity={0.4} />
        </mesh>
      </>
    );
  }

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size.w, size.d]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={floorRoughness}
          metalness={floorMetalness}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* 뒷벽 */}
      <mesh position={[0, size.h / 2, -size.d / 2]} receiveShadow>
        <planeGeometry args={[size.w, size.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} envMapIntensity={0.4} />
      </mesh>

      {/* 좌측벽 */}
      <mesh position={[-size.w / 2, size.h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[size.d, size.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.94} envMapIntensity={0.35} />
      </mesh>

      {/* 우측벽 (반사/바운스 보강) */}
      <mesh position={[size.w / 2, size.h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[size.d, size.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.94} envMapIntensity={0.35} />
      </mesh>

      {/* 스튜디오: 바닥-뒷벽 이음부 호리존(코브) 근사 — 부드러운 라운드 */}
      {spaceId === 'studio' && (
        <mesh
          position={[0, 0, -size.d / 2 + 0.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <cylinderGeometry args={[0.8, 0.8, size.w, 32, 1, true, 0, Math.PI / 2]} />
          <meshStandardMaterial color={wallColor} roughness={0.88} side={2} envMapIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
