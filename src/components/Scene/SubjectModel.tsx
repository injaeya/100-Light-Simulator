/**
 * SubjectModel.tsx — 피사체(초기 컨셉: 단순 마네킹).
 * 얼굴은 이목구비 없이 매끈하게 두어 조명의 "밝기"와 "원근감(입체·깊이)"만
 * 관찰할 수 있게 한다. 코만 남겨 빛 방향/깊이 가늠용 기준으로.
 */
import type { SimState } from '../../sim/types';
import { lin } from './sceneColor';

/** 중립 무광 피부(매끈한 그라디언트로 밝기·형태가 잘 읽힘) */
const SKIN = lin(0.34, 0.25, 0.19);
const CLOTH = lin(0.1, 0.11, 0.14);
const CLOTH_D = lin(0.06, 0.07, 0.09);

export function SubjectModel({ sim }: { sim: SimState }) {
  const { subj } = sim;
  const sit = subj.pose === 'sit';
  const eyeH = subj.eyeH;

  const headY = eyeH + 0.02;
  const neckY = eyeH - 0.16;
  const shoulderY = eyeH - 0.32;
  const torsoTop = shoulderY - 0.02;
  const torsoBottom = sit ? eyeH - 0.86 : eyeH - 0.98;
  const torsoMid = (torsoTop + torsoBottom) / 2;
  const torsoLen = torsoTop - torsoBottom;

  return (
    <group position={[subj.x, 0, subj.z]} rotation={[0, subj.yaw * (Math.PI / 180), 0]}>
      {/* 머리 (매끈한 계란형 — 이목구비 없음, 밝기·원근감만) */}
      <mesh position={[0, headY, 0]} scale={[0.92, 1.12, 0.98]} castShadow receiveShadow>
        <sphereGeometry args={[0.1, 64, 64]} />
        <meshStandardMaterial color={SKIN} roughness={0.58} metalness={0} />
      </mesh>
      {/* 코 (빛 방향·깊이 기준) */}
      <mesh position={[0, eyeH - 0.02, 0.096]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.018, 0.055, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.58} />
      </mesh>

      {/* 목 */}
      <mesh position={[0, neckY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.048, 0.058, 0.14, 24]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      {/* 어깨 */}
      <mesh position={[0, shoulderY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.1, 0.34, 8, 24]} />
        <meshStandardMaterial color={CLOTH} roughness={0.82} />
      </mesh>
      {/* 몸통 */}
      <mesh position={[0, torsoMid, 0]} scale={[1, 1, 0.82]} castShadow receiveShadow>
        <capsuleGeometry args={[0.2, Math.max(0.2, torsoLen), 8, 24]} />
        <meshStandardMaterial color={CLOTH} roughness={0.85} />
      </mesh>
      {/* 하반신 */}
      <mesh position={[0, torsoBottom - 0.26, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.2, 0.56, 24]} />
        <meshStandardMaterial color={CLOTH_D} roughness={0.88} />
      </mesh>

      {/* 스툴(앉은 자세) */}
      {sit && (
        <group>
          <mesh position={[0, torsoBottom - 0.56, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
            <meshStandardMaterial color={lin(0.02, 0.02, 0.025)} roughness={0.5} metalness={0.4} />
          </mesh>
          {[0, 120, 240].map((d) => {
            const a = (d * Math.PI) / 180;
            return (
              <mesh key={d} position={[Math.sin(a) * 0.15, (torsoBottom - 0.58) / 2, Math.cos(a) * 0.15]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, torsoBottom - 0.58, 8]} />
                <meshStandardMaterial color={lin(0.02, 0.02, 0.02)} roughness={0.4} metalness={0.6} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
