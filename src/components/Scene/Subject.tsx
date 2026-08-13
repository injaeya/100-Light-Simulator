/**
 * Subject.tsx — 피사체 (간단한 인물/마네킹 프록시)
 * 조명 방향/그림자 관찰용 기준 오브젝트.
 */
export function Subject() {
  return (
    <group position={[0, 0, 0]}>
      {/* 머리 */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial color="#c9a58a" roughness={0.7} />
      </mesh>
      {/* 목 */}
      <mesh position={[0, 1.46, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.12, 16]} />
        <meshStandardMaterial color="#bd987e" roughness={0.7} />
      </mesh>
      {/* 몸통 */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
        <meshStandardMaterial color="#3d5a80" roughness={0.85} />
      </mesh>
      {/* 다리(스툴에 앉은 느낌의 하반신 프록시) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.55, 16]} />
        <meshStandardMaterial color="#293241" roughness={0.9} />
      </mesh>
      {/* 스툴 */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}
