/**
 * SubjectModel.tsx — 피사체(앉기/서기) 프록시. subj 위치/방향/눈높이 반영.
 */
import type { SimState } from '../../sim/types';
import { lin } from './sceneColor';

export function SubjectModel({ sim }: { sim: SimState }) {
  const { subj } = sim;
  const sit = subj.pose === 'sit';
  const eyeH = subj.eyeH;
  // 눈높이 기준으로 각 부위 y 배치
  const headY = eyeH + 0.02;
  const neckY = eyeH - 0.14;
  const shoulderY = eyeH - 0.3;
  const torsoTop = eyeH - 0.32;
  const torsoBottom = sit ? eyeH - 0.85 : eyeH - 0.95;
  const torsoMid = (torsoTop + torsoBottom) / 2;
  const torsoLen = torsoTop - torsoBottom;
  const skin = lin(0.22, 0.14, 0.1);
  const shirt = lin(0.05, 0.08, 0.14);

  return (
    <group position={[subj.x, 0, subj.z]} rotation={[0, subj.yaw * (Math.PI / 180), 0]}>
      {/* 머리 */}
      <mesh position={[0, headY, 0]} castShadow>
        <sphereGeometry args={[0.105, 40, 40]} />
        <meshStandardMaterial color={skin} roughness={0.62} />
      </mesh>
      {/* 코 (명암 관찰) */}
      <mesh position={[0, headY - 0.01, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.02, 0.05, 12]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      {/* 목 */}
      <mesh position={[0, neckY, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.12, 20]} />
        <meshStandardMaterial color={skin} roughness={0.65} />
      </mesh>
      {/* 어깨 */}
      <mesh position={[0, shoulderY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.1, 0.32, 6, 20]} />
        <meshStandardMaterial color={shirt} roughness={0.82} />
      </mesh>
      {/* 몸통 */}
      <mesh position={[0, torsoMid, 0]} castShadow>
        <capsuleGeometry args={[0.19, Math.max(0.2, torsoLen), 6, 20]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>
      {/* 하반신 */}
      <mesh position={[0, torsoBottom - 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.19, 0.5, 20]} />
        <meshStandardMaterial color={lin(0.03, 0.03, 0.04)} roughness={0.9} />
      </mesh>
      {/* 스툴(앉은 자세) */}
      {sit && (
        <mesh position={[0, torsoBottom - 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
          <meshStandardMaterial color={lin(0.02, 0.02, 0.02)} roughness={0.5} metalness={0.4} />
        </mesh>
      )}
    </group>
  );
}
