/**
 * SubjectModel.tsx — 피사체(중립 인물, 앉기/서기).
 * 얼굴 이목구비 + 헤어 + 팔/다리 관절로 마네킹 티를 줄인다.
 */
import { Quaternion, Vector3 } from 'three';
import type { SimState } from '../../sim/types';
import { lin } from './sceneColor';

const SKIN = lin(0.34, 0.23, 0.17);
const HAIR = lin(0.035, 0.025, 0.02);
const CLOTH = lin(0.07, 0.09, 0.13);
const CLOTH_D = lin(0.045, 0.06, 0.09);
const PANTS = lin(0.03, 0.035, 0.05);

type P = [number, number, number];

/** 두 점을 잇는 캡슐(사지) */
function Limb({ a, b, r, color, rough = 0.82 }: { a: P; b: P; r: number; color: ReturnType<typeof lin>; rough?: number }) {
  const va = new Vector3(...a), vb = new Vector3(...b);
  const dir = new Vector3().subVectors(vb, va);
  const len = dir.length();
  const mid = new Vector3().addVectors(va, vb).multiplyScalar(0.5);
  const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={mid.toArray()} quaternion={quat} castShadow>
      <capsuleGeometry args={[r, Math.max(0.02, len - 2 * r), 5, 12]} />
      <meshStandardMaterial color={color} roughness={rough} />
    </mesh>
  );
}

export function SubjectModel({ sim }: { sim: SimState }) {
  const { subj } = sim;
  const sit = subj.pose === 'sit';
  const eyeH = subj.eyeH;

  const headY = eyeH + 0.03;
  const neckY = eyeH - 0.16;
  const shoulderY = eyeH - 0.32;
  const sx = 0.185; // 어깨 반폭
  const hipY = sit ? eyeH - 0.82 : eyeH - 0.9;
  const hx = 0.1;

  // 팔 관절
  const shoulderL: P = [-sx, shoulderY, 0];
  const shoulderR: P = [sx, shoulderY, 0];
  const elbowL: P = sit ? [-sx - 0.02, shoulderY - 0.24, 0.06] : [-sx - 0.02, shoulderY - 0.27, 0.02];
  const elbowR: P = sit ? [sx + 0.02, shoulderY - 0.24, 0.06] : [sx + 0.02, shoulderY - 0.27, 0.02];
  const wristL: P = sit ? [-hx - 0.02, hipY + 0.05, 0.28] : [-sx - 0.01, shoulderY - 0.52, 0.05];
  const wristR: P = sit ? [hx + 0.02, hipY + 0.05, 0.28] : [sx + 0.01, shoulderY - 0.52, 0.05];

  // 다리 관절
  const kneeL: P = sit ? [-hx, hipY - 0.02, 0.4] : [-hx, hipY - 0.44, 0.02];
  const kneeR: P = sit ? [hx, hipY - 0.02, 0.4] : [hx, hipY - 0.44, 0.02];
  const ankleL: P = sit ? [-hx, 0.07, 0.36] : [-hx, 0.08, 0.04];
  const ankleR: P = sit ? [hx, 0.07, 0.36] : [hx, 0.08, 0.04];

  const torsoTop = shoulderY - 0.02;
  const torsoBottom = hipY + 0.04;
  const torsoMid = (torsoTop + torsoBottom) / 2;

  return (
    <group position={[subj.x, 0, subj.z]} rotation={[0, subj.yaw * (Math.PI / 180), 0]}>
      {/* ===== 머리 ===== */}
      <mesh position={[0, headY, 0]} scale={[0.9, 1.1, 0.95]} castShadow>
        <sphereGeometry args={[0.097, 48, 48]} />
        <meshStandardMaterial color={SKIN} roughness={0.5} />
      </mesh>
      {/* 눈 (작은 아몬드 + 윗눈꺼풀로 자연스러운 눈매) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.033, eyeH + 0.003, 0.078]}>
          {/* 흰자 (작고 함몰) */}
          <mesh scale={[1.3, 0.66, 0.3]}>
            <sphereGeometry args={[0.015, 20, 16]} />
            <meshStandardMaterial color={lin(0.42, 0.4, 0.38)} roughness={0.4} />
          </mesh>
          {/* 홍채/동공 */}
          <mesh position={[0, -0.001, 0.005]}>
            <sphereGeometry args={[0.0072, 16, 16]} />
            <meshStandardMaterial color={lin(0.03, 0.022, 0.018)} roughness={0.3} />
          </mesh>
          {/* 윗눈꺼풀 (응시 완화) */}
          <mesh position={[0, 0.007, 0.004]} rotation={[0.35, 0, 0]} scale={[1.45, 0.7, 0.55]}>
            <sphereGeometry args={[0.016, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={SKIN} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* 눈썹 (얇고 은은하게) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.036, eyeH + 0.03, 0.081]} rotation={[0, 0, s * -0.1]} scale={[1, 0.28, 0.4]}>
          <boxGeometry args={[0.032, 0.01, 0.008]} />
          <meshStandardMaterial color={lin(0.06, 0.045, 0.035)} roughness={0.7} />
        </mesh>
      ))}
      {/* 코 */}
      <mesh position={[0, eyeH - 0.022, 0.088]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.015, 0.05, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.5} />
      </mesh>
      {/* 입 (얇은 가로선) */}
      <mesh position={[0, eyeH - 0.068, 0.079]} scale={[1, 0.5, 0.5]}>
        <boxGeometry args={[0.04, 0.009, 0.012]} />
        <meshStandardMaterial color={lin(0.28, 0.14, 0.12)} roughness={0.5} />
      </mesh>
      {/* 귀 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.088, eyeH - 0.01, 0.0]} scale={[0.5, 1, 0.7]} castShadow>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
      ))}
      {/* 헤어 (이마 드러나게, 두상 볼륨 + 뒤통수/구레나룻) */}
      <mesh position={[0, headY + 0.05, -0.012]} scale={[1.08, 1.02, 1.12]}>
        <sphereGeometry args={[0.099, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={HAIR} roughness={0.72} />
      </mesh>
      <mesh position={[0, headY - 0.015, -0.055]} scale={[1.02, 1.08, 0.72]}>
        <sphereGeometry args={[0.099, 24, 24]} />
        <meshStandardMaterial color={HAIR} roughness={0.74} />
      </mesh>
      {/* 구레나룻 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.086, eyeH + 0.02, -0.02]} scale={[0.4, 1, 0.7]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color={HAIR} roughness={0.75} />
        </mesh>
      ))}

      {/* ===== 목 ===== */}
      <mesh position={[0, neckY, 0.005]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.14, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>

      {/* ===== 몸통 ===== */}
      {/* 승모근(목→어깨 경사) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, shoulderY + 0.05, -0.005]} rotation={[0, 0, s * 0.6]} scale={[1, 0.55, 0.75]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={CLOTH} roughness={0.82} />
        </mesh>
      ))}
      {/* 어깨 */}
      <mesh position={[0, shoulderY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.095, sx * 2 - 0.06, 6, 20]} />
        <meshStandardMaterial color={CLOTH} roughness={0.82} />
      </mesh>
      {/* 흉곽→허리 (약간 테이퍼) */}
      <mesh position={[0, torsoMid, 0]} scale={[1, 1, 0.72]} castShadow>
        <capsuleGeometry args={[0.185, Math.max(0.2, torsoTop - torsoBottom), 8, 24]} />
        <meshStandardMaterial color={CLOTH} roughness={0.84} />
      </mesh>
      {/* 골반 */}
      <mesh position={[0, hipY, 0]} scale={[1.1, 0.8, 0.8]} castShadow>
        <sphereGeometry args={[0.17, 24, 20]} />
        <meshStandardMaterial color={CLOTH_D} roughness={0.85} />
      </mesh>

      {/* ===== 팔 ===== */}
      <Limb a={shoulderL} b={elbowL} r={0.052} color={CLOTH} />
      <Limb a={shoulderR} b={elbowR} r={0.052} color={CLOTH} />
      <Limb a={elbowL} b={wristL} r={0.042} color={sit ? SKIN : CLOTH} />
      <Limb a={elbowR} b={wristR} r={0.042} color={sit ? SKIN : CLOTH} />
      {/* 손 */}
      {[wristL, wristR].map((w, i) => (
        <mesh key={i} position={w} castShadow>
          <sphereGeometry args={[0.05, 16, 14]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
      ))}

      {/* ===== 다리 ===== */}
      <Limb a={[-hx, hipY - 0.06, sit ? 0.05 : 0]} b={kneeL} r={0.075} color={PANTS} />
      <Limb a={[hx, hipY - 0.06, sit ? 0.05 : 0]} b={kneeR} r={0.075} color={PANTS} />
      <Limb a={kneeL} b={ankleL} r={0.058} color={PANTS} />
      <Limb a={kneeR} b={ankleR} r={0.058} color={PANTS} />
      {/* 발 */}
      {[ankleL, ankleR].map((an, i) => (
        <mesh key={i} position={[an[0], 0.03, an[2] + 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.06, 0.19]} />
          <meshStandardMaterial color={lin(0.02, 0.02, 0.02)} roughness={0.6} />
        </mesh>
      ))}

      {/* 스툴(앉은 자세) */}
      {sit && (
        <group>
          <mesh position={[0, hipY - 0.04, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
            <meshStandardMaterial color={lin(0.02, 0.02, 0.025)} roughness={0.5} metalness={0.4} />
          </mesh>
          {[0, 120, 240].map((d) => {
            const a = (d * Math.PI) / 180;
            return (
              <mesh key={d} position={[Math.sin(a) * 0.15, (hipY - 0.06) / 2, Math.cos(a) * 0.15]} rotation={[Math.cos(a) * 0.12, 0, -Math.sin(a) * 0.12]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, hipY - 0.06, 8]} />
                <meshStandardMaterial color={lin(0.02, 0.02, 0.02)} roughness={0.4} metalness={0.6} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
