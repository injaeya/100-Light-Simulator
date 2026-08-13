/**
 * SubjectModel.tsx — 피사체(남/여, 앉기/서기).
 * 깔끔한 계란형 두상 + 코 + 성별별 헤어/체형. 과한 얼굴 디테일은 지양.
 */
import type { SimState } from '../../sim/types';
import { lin } from './sceneColor';

const SKIN = lin(0.32, 0.21, 0.15);

export function SubjectModel({ sim }: { sim: SimState }) {
  const { subj } = sim;
  const female = subj.gender === 'female';
  const sit = subj.pose === 'sit';
  const eyeH = subj.eyeH;

  const headY = eyeH + 0.03;
  const neckY = eyeH - 0.15;
  const shoulderY = eyeH - 0.31;
  const chestY = eyeH - 0.46;
  const torsoBottom = sit ? eyeH - 0.86 : eyeH - 0.98;
  const torsoMid = (shoulderY + torsoBottom) / 2;
  const torsoLen = shoulderY - torsoBottom;

  const shoulderW = female ? 0.3 : 0.42;
  const hairColor = female ? lin(0.045, 0.028, 0.02) : lin(0.03, 0.022, 0.018);
  const cloth = female ? lin(0.14, 0.06, 0.1) : lin(0.05, 0.07, 0.11);
  const clothD = female ? lin(0.09, 0.04, 0.065) : lin(0.035, 0.05, 0.08);

  return (
    <group position={[subj.x, 0, subj.z]} rotation={[0, subj.yaw * (Math.PI / 180), 0]}>
      {/* 머리 (계란형) */}
      <mesh position={[0, headY, 0]} scale={[0.9, 1.12, 0.96]} castShadow>
        <sphereGeometry args={[0.096, 48, 48]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>
      {/* 코 */}
      <mesh position={[0, eyeH - 0.01, 0.092]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.015, 0.045, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>

      {/* 헤어 */}
      {female ? (
        <group>
          {/* 두상 캡 (앞머리 라인은 이마 위) */}
          <mesh position={[0, headY + 0.035, -0.012]} scale={[1.08, 1.02, 1.12]}>
            <sphereGeometry args={[0.1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={hairColor} roughness={0.74} />
          </mesh>
          {/* 옆머리 (귀 옆으로 내려옴) */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, eyeH - 0.05, -0.01]} scale={[0.5, 1.3, 0.9]} castShadow>
              <capsuleGeometry args={[0.045, 0.18, 5, 14]} />
              <meshStandardMaterial color={hairColor} roughness={0.76} />
            </mesh>
          ))}
          {/* 뒷머리 (어깨까지, 얼굴 뒤) */}
          <mesh position={[0, shoulderY + 0.14, -0.09]} scale={[1.3, 1.05, 0.7]} castShadow>
            <capsuleGeometry args={[0.11, 0.34, 6, 20]} />
            <meshStandardMaterial color={hairColor} roughness={0.78} />
          </mesh>
        </group>
      ) : (
        // 남성 짧은 머리 (두상에 밀착)
        <mesh position={[0, headY + 0.03, -0.008]} scale={[1.05, 0.95, 1.08]}>
          <sphereGeometry args={[0.1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={hairColor} roughness={0.7} />
        </mesh>
      )}

      {/* 목 */}
      <mesh position={[0, neckY, 0]} castShadow>
        <cylinderGeometry args={[female ? 0.038 : 0.05, female ? 0.05 : 0.062, 0.14, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      {/* 어깨 */}
      <mesh position={[0, shoulderY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[female ? 0.08 : 0.1, shoulderW, 6, 20]} />
        <meshStandardMaterial color={cloth} roughness={0.82} />
      </mesh>

      {/* 여성 상체 볼륨 */}
      {female && (
        <mesh position={[0, chestY, 0.055]} scale={[1.2, 0.7, 0.85]} castShadow>
          <sphereGeometry args={[0.12, 24, 20]} />
          <meshStandardMaterial color={cloth} roughness={0.84} />
        </mesh>
      )}

      {/* 몸통 */}
      <mesh position={[0, torsoMid, 0]} scale={[female ? 0.86 : 1.06, 1, 0.78]} castShadow>
        <capsuleGeometry args={[female ? 0.175 : 0.205, Math.max(0.2, torsoLen), 6, 24]} />
        <meshStandardMaterial color={cloth} roughness={0.85} />
      </mesh>

      {/* 하반신 */}
      <mesh position={[0, torsoBottom - 0.24, 0]} castShadow>
        <cylinderGeometry args={[female ? 0.16 : 0.18, 0.2, 0.52, 24]} />
        <meshStandardMaterial color={clothD} roughness={0.88} />
      </mesh>

      {/* 스툴(앉은 자세) */}
      {sit && (
        <group>
          <mesh position={[0, torsoBottom - 0.52, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.04, 24]} />
            <meshStandardMaterial color={lin(0.02, 0.02, 0.025)} roughness={0.5} metalness={0.4} />
          </mesh>
          {[0, 120, 240].map((d) => {
            const a = (d * Math.PI) / 180;
            return (
              <mesh key={d} position={[Math.sin(a) * 0.14, torsoBottom - 0.78, Math.cos(a) * 0.14]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
                <meshStandardMaterial color={lin(0.02, 0.02, 0.02)} roughness={0.4} metalness={0.6} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
