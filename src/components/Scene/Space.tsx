/**
 * Space.tsx — 공간(세트) 렌더링
 */
import { SPACE_PRESETS, type SpaceId } from '../../data/presets';

interface SpaceProps {
  spaceId: SpaceId;
}

export function Space({ spaceId }: SpaceProps) {
  const preset = SPACE_PRESETS.find((s) => s.id === spaceId)!;
  const { size, floorColor, wallColor } = preset;

  if (spaceId === 'empty') {
    return (
      <>
        <gridHelper args={[size.w, size.w, '#3a3a44', '#222228']} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[size.w, size.d]} />
          <meshStandardMaterial color={floorColor} roughness={0.95} />
        </mesh>
      </>
    );
  }

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size.w, size.d]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      {/* 뒷벽 */}
      <mesh position={[0, size.h / 2, -size.d / 2]} receiveShadow>
        <planeGeometry args={[size.w, size.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>

      {/* 좌측벽 */}
      <mesh
        position={[-size.w / 2, size.h / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[size.d, size.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>

      {/* 스튜디오: 무한대 배경(호리존) 곡면 느낌의 큰 바닥-벽 연결 */}
      {spaceId === 'studio' && (
        <mesh position={[0, 0.001, -size.d / 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[size.w, size.d / 2]} />
          <meshStandardMaterial color={wallColor} roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}
