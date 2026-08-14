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

/** 의자(나무) 톤 */
const CHAIR = lin(0.14, 0.1, 0.07);
const CHAIR_D = lin(0.09, 0.065, 0.045);
/** 바닥 단(플랫폼) */
const RISER_TOP = lin(0.16, 0.16, 0.17);
const RISER_SIDE = lin(0.1, 0.1, 0.11);

export function SubjectModel({ sim }: { sim: SimState }) {
  const { subj, room } = sim;
  const sit = subj.pose === 'sit';
  const eyeH = subj.eyeH;
  const riser = room.riser;

  const headY = eyeH + 0.02;
  const neckY = eyeH - 0.16;
  const shoulderY = eyeH - 0.32;
  const torsoTop = shoulderY - 0.02;
  const torsoBottom = sit ? eyeH - 0.86 : eyeH - 0.98;
  const torsoMid = (torsoTop + torsoBottom) / 2;
  const torsoLen = torsoTop - torsoBottom;

  // 의자 치수(피사체 힙 높이 = 좌면)
  const seatY = Math.max(0.3, torsoBottom);
  const legX = 0.19, legZ = 0.19, legR = 0.02;

  return (
    <group position={[subj.x, riser, subj.z]} rotation={[0, subj.yaw * (Math.PI / 180), 0]}>
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

      {/* 의자(앉은 자세) — 좌면·등받이·다리 4개. 등받이는 피사체 뒤(-Z) */}
      {sit && (
        <group>
          {/* 좌면 */}
          <mesh position={[0, seatY - 0.03, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.06, 0.42]} />
            <meshStandardMaterial color={CHAIR} roughness={0.72} />
          </mesh>
          {/* 등받이(뒤) */}
          <mesh position={[0, seatY + 0.24, -0.19]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.5, 0.05]} />
            <meshStandardMaterial color={CHAIR} roughness={0.72} />
          </mesh>
          {/* 다리 4개 (좌면에서 바닥까지) */}
          {[
            [legX, legZ],
            [-legX, legZ],
            [legX, -legZ],
            [-legX, -legZ],
          ].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, (seatY - 0.06) / 2, lz]} castShadow receiveShadow>
              <cylinderGeometry args={[legR, legR, Math.max(0.1, seatY - 0.06), 12]} />
              <meshStandardMaterial color={CHAIR_D} roughness={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {/* 바닥 단(플랫폼) — riser>0 일 때, 피사체 발밑에 세움 */}
      {riser > 0.005 && (
        <group>
          <mesh position={[0, -riser / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6, riser, 1.6]} />
            <meshStandardMaterial color={RISER_SIDE} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1.6, 1.6]} />
            <meshStandardMaterial color={RISER_TOP} roughness={0.85} />
          </mesh>
        </group>
      )}
    </group>
  );
}
