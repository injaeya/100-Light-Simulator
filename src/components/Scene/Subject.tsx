/**
 * Subject.tsx — 피사체 (조명 관찰용 인물 프록시)
 * 물리 기반 재질(피부/의상)로 조명 방향·질감·그림자를 사실적으로 관찰.
 */
export function Subject() {
  return (
    <group position={[0, 0, 0]}>
      {/* 머리 */}
      <mesh position={[0, 1.63, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.13, 48, 48]} />
        <meshPhysicalMaterial
          color="#caa088"
          roughness={0.62}
          clearcoat={0.15}
          clearcoatRoughness={0.5}
          sheen={0.3}
          sheenColor="#ffd9c0"
          envMapIntensity={0.8}
        />
      </mesh>
      {/* 코 (측광/명암 관찰용 입체 디테일) */}
      <mesh position={[0, 1.61, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.025, 0.06, 12]} />
        <meshPhysicalMaterial color="#c69a82" roughness={0.6} envMapIntensity={0.7} />
      </mesh>
      {/* 목 */}
      <mesh position={[0, 1.47, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.052, 0.062, 0.12, 24]} />
        <meshPhysicalMaterial color="#bd917a" roughness={0.65} envMapIntensity={0.7} />
      </mesh>
      {/* 어깨 */}
      <mesh position={[0, 1.32, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.11, 0.34, 8, 24]} />
        <meshStandardMaterial color="#37506f" roughness={0.82} envMapIntensity={0.5} />
      </mesh>
      {/* 몸통 */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.21, 0.5, 8, 24]} />
        <meshStandardMaterial color="#3d5a80" roughness={0.85} envMapIntensity={0.45} />
      </mesh>
      {/* 하반신 */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.21, 0.55, 24]} />
        <meshStandardMaterial color="#26303f" roughness={0.9} envMapIntensity={0.4} />
      </mesh>
      {/* 스툴 상판 */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.23, 0.23, 0.04, 32]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.45} metalness={0.5} envMapIntensity={1} />
      </mesh>
      {/* 스툴 다리 */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.2, 12]} />
        <meshStandardMaterial color="#0d0d10" roughness={0.35} metalness={0.7} envMapIntensity={1} />
      </mesh>
    </group>
  );
}
