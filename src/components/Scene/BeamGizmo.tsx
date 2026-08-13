/**
 * BeamGizmo.tsx — 조명 빔 범위/방향을 와이어프레임(그물)으로 시각화.
 * 스포트: 광원→타겟 방향의 와이어 콘 + 도달 지점 풋프린트 링.
 * 전방향(point): 위치를 나타내는 와이어 구.
 */
import { useMemo } from 'react';
import { DoubleSide, Quaternion, Vector3 } from 'three';

interface Props {
  p: [number, number, number];
  t: [number, number, number];
  /** 스포트 반각(rad) */
  angleRad: number;
  omni: boolean;
  color: string;
}

export function BeamGizmo({ p, t, angleRad, omni, color }: Props) {
  const g = useMemo(() => {
    const vp = new Vector3(...p), vt = new Vector3(...t);
    const dir = new Vector3().subVectors(vt, vp);
    const len = Math.max(0.2, dir.length());
    const radius = Math.min(6, Math.max(0.05, len * Math.tan(Math.min(1.45, angleRad))));
    const mid = new Vector3().addVectors(vp, vt).multiplyScalar(0.5);
    // 콘 정점(+Y)이 광원 p에 오도록: +Y 를 (p−t) 방향에 정렬
    const coneQuat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), vp.clone().sub(vt).normalize());
    // 풋프린트 링은 dir(전방)을 향하도록: +Z 를 dir 에 정렬
    const ringQuat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), dir.clone().normalize());
    return { len, radius, mid: mid.toArray() as [number, number, number], coneQuat, ringQuat };
  }, [p, t, angleRad]);

  if (omni) {
    return (
      <mesh position={p}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.28} toneMapped={false} />
      </mesh>
    );
  }

  return (
    <group>
      {/* 빔 콘 (그물) */}
      <mesh position={g.mid} quaternion={g.coneQuat}>
        <coneGeometry args={[g.radius, g.len, 20, 1, true]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.14} toneMapped={false} side={DoubleSide} />
      </mesh>
      {/* 도달 지점 풋프린트 링 */}
      <mesh position={t} quaternion={g.ringQuat}>
        <ringGeometry args={[g.radius * 0.82, g.radius, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} side={DoubleSide} />
      </mesh>
    </group>
  );
}
