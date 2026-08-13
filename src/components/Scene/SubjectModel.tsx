/**
 * SubjectModel.tsx — 피사체(조각상/석상, 앉기/서기).
 * 단일 대리석 재질 + 고전 조각풍 빈 눈 + 받침대(플린스).
 * 조명 아래 형태·명암을 관찰하기 좋고 언캐니밸리를 피한다.
 */
import { Quaternion, Vector3 } from 'three';
import type { SimState } from '../../sim/types';
import { lin } from './sceneColor';

/** 대리석(밝은 웜 스톤, 선형값) */
const STONE = lin(0.62, 0.6, 0.55);
/** 음영/헤어용 약간 어두운 석재 */
const STONE_D = lin(0.5, 0.485, 0.44);
/** 받침대(짙은 석재) */
const BASE = lin(0.32, 0.31, 0.29);

const MAT = { color: STONE, roughness: 0.52, metalness: 0.0 } as const;
const MAT_D = { color: STONE_D, roughness: 0.55, metalness: 0.0 } as const;

type P = [number, number, number];

/** 두 점을 잇는 캡슐(사지) */
function Limb({ a, b, r }: { a: P; b: P; r: number }) {
  const va = new Vector3(...a), vb = new Vector3(...b);
  const dir = new Vector3().subVectors(vb, va);
  const len = dir.length();
  const mid = new Vector3().addVectors(va, vb).multiplyScalar(0.5);
  const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={mid.toArray()} quaternion={quat} castShadow receiveShadow>
      <capsuleGeometry args={[r, Math.max(0.02, len - 2 * r), 5, 14]} />
      <meshStandardMaterial {...MAT} />
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
  const sx = 0.185;
  const hipY = sit ? eyeH - 0.82 : eyeH - 0.9;
  const hx = 0.1;

  const shoulderL: P = [-sx, shoulderY, 0];
  const shoulderR: P = [sx, shoulderY, 0];
  const elbowL: P = sit ? [-sx - 0.02, shoulderY - 0.24, 0.06] : [-sx - 0.02, shoulderY - 0.27, 0.02];
  const elbowR: P = sit ? [sx + 0.02, shoulderY - 0.24, 0.06] : [sx + 0.02, shoulderY - 0.27, 0.02];
  const wristL: P = sit ? [-hx - 0.02, hipY + 0.05, 0.28] : [-sx - 0.01, shoulderY - 0.52, 0.05];
  const wristR: P = sit ? [hx + 0.02, hipY + 0.05, 0.28] : [sx + 0.01, shoulderY - 0.52, 0.05];

  const kneeL: P = sit ? [-hx, hipY - 0.02, 0.4] : [-hx, hipY - 0.44, 0.02];
  const kneeR: P = sit ? [hx, hipY - 0.02, 0.4] : [hx, hipY - 0.44, 0.02];
  const ankleL: P = sit ? [-hx, 0.07, 0.36] : [-hx, 0.1, 0.04];
  const ankleR: P = sit ? [hx, 0.07, 0.36] : [hx, 0.1, 0.04];

  const torsoTop = shoulderY - 0.02;
  const torsoBottom = hipY + 0.04;
  const torsoMid = (torsoTop + torsoBottom) / 2;

  return (
    <group position={[subj.x, 0, subj.z]} rotation={[0, subj.yaw * (Math.PI / 180), 0]}>
      {/* ===== 머리 ===== */}
      <mesh position={[0, headY, 0]} scale={[0.9, 1.1, 0.95]} castShadow receiveShadow>
        <sphereGeometry args={[0.097, 48, 48]} />
        <meshStandardMaterial {...MAT} />
      </mesh>
      {/* 눈 (고전 조각풍 — 빈 눈, 살짝 함몰) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.033, eyeH + 0.003, 0.077]}>
          <mesh scale={[1.35, 0.7, 0.3]}>
            <sphereGeometry args={[0.016, 18, 14]} />
            <meshStandardMaterial {...MAT_D} />
          </mesh>
          {/* 윗눈꺼풀 */}
          <mesh position={[0, 0.008, 0.004]} rotation={[0.35, 0, 0]} scale={[1.5, 0.7, 0.55]}>
            <sphereGeometry args={[0.016, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial {...MAT} />
          </mesh>
        </group>
      ))}
      {/* 눈썹 능선 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.036, eyeH + 0.032, 0.08]} rotation={[0, 0, s * -0.1]} scale={[1, 0.3, 0.5]}>
          <boxGeometry args={[0.034, 0.011, 0.012]} />
          <meshStandardMaterial {...MAT} />
        </mesh>
      ))}
      {/* 코 */}
      <mesh position={[0, eyeH - 0.022, 0.088]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.017, 0.055, 16]} />
        <meshStandardMaterial {...MAT} />
      </mesh>
      {/* 입 (은은한 능선) */}
      <mesh position={[0, eyeH - 0.07, 0.079]} scale={[1, 0.5, 0.5]}>
        <boxGeometry args={[0.042, 0.012, 0.014]} />
        <meshStandardMaterial {...MAT} />
      </mesh>
      {/* 입술 크레바스 */}
      <mesh position={[0, eyeH - 0.072, 0.084]} scale={[1, 0.25, 0.3]}>
        <boxGeometry args={[0.038, 0.006, 0.008]} />
        <meshStandardMaterial {...MAT_D} />
      </mesh>
      {/* 귀 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.088, eyeH - 0.01, 0.0]} scale={[0.5, 1, 0.7]} castShadow>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshStandardMaterial {...MAT} />
        </mesh>
      ))}
      {/* 헤어 (석재로 조각, 살짝 어둡게) */}
      <mesh position={[0, headY + 0.05, -0.012]} scale={[1.09, 1.02, 1.13]} castShadow>
        <sphereGeometry args={[0.099, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial {...MAT_D} />
      </mesh>
      <mesh position={[0, headY - 0.015, -0.055]} scale={[1.02, 1.08, 0.72]} castShadow>
        <sphereGeometry args={[0.099, 24, 24]} />
        <meshStandardMaterial {...MAT_D} />
      </mesh>

      {/* ===== 목 ===== */}
      <mesh position={[0, neckY, 0.005]} castShadow receiveShadow>
        <cylinderGeometry args={[0.047, 0.058, 0.14, 20]} />
        <meshStandardMaterial {...MAT} />
      </mesh>

      {/* ===== 몸통 ===== */}
      {/* 승모근 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, shoulderY + 0.05, -0.005]} rotation={[0, 0, s * 0.6]} scale={[1, 0.55, 0.75]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial {...MAT} />
        </mesh>
      ))}
      {/* 어깨 */}
      <mesh position={[0, shoulderY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.098, sx * 2 - 0.06, 6, 20]} />
        <meshStandardMaterial {...MAT} />
      </mesh>
      {/* 흉곽→허리 */}
      <mesh position={[0, torsoMid, 0]} scale={[1, 1, 0.72]} castShadow receiveShadow>
        <capsuleGeometry args={[0.185, Math.max(0.2, torsoTop - torsoBottom), 8, 24]} />
        <meshStandardMaterial {...MAT} />
      </mesh>
      {/* 골반 */}
      <mesh position={[0, hipY, 0]} scale={[1.1, 0.8, 0.8]} castShadow>
        <sphereGeometry args={[0.17, 24, 20]} />
        <meshStandardMaterial {...MAT} />
      </mesh>

      {/* ===== 팔 ===== */}
      <Limb a={shoulderL} b={elbowL} r={0.052} />
      <Limb a={shoulderR} b={elbowR} r={0.052} />
      <Limb a={elbowL} b={wristL} r={0.042} />
      <Limb a={elbowR} b={wristR} r={0.042} />
      {[wristL, wristR].map((w, i) => (
        <mesh key={i} position={w} castShadow>
          <sphereGeometry args={[0.05, 16, 14]} />
          <meshStandardMaterial {...MAT} />
        </mesh>
      ))}

      {/* ===== 다리 ===== */}
      <Limb a={[-hx, hipY - 0.06, sit ? 0.05 : 0]} b={kneeL} r={0.075} />
      <Limb a={[hx, hipY - 0.06, sit ? 0.05 : 0]} b={kneeR} r={0.075} />
      <Limb a={kneeL} b={ankleL} r={0.058} />
      <Limb a={kneeR} b={ankleR} r={0.058} />
      {[ankleL, ankleR].map((an, i) => (
        <mesh key={i} position={[an[0], 0.04, an[2] + 0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.085, 0.07, 0.2]} />
          <meshStandardMaterial {...MAT} />
        </mesh>
      ))}

      {/* ===== 받침대 ===== */}
      {sit ? (
        // 앉은 자세: 석재 좌대(블록)
        <mesh position={[0, (hipY - 0.05) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, hipY - 0.05, 0.42]} />
          <meshStandardMaterial {...{ color: BASE, roughness: 0.6, metalness: 0.0 }} />
        </mesh>
      ) : (
        // 선 자세: 바닥의 낮은 원형 플린스 (발이 살짝 묻히는 조각 받침)
        <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.07, 32]} />
          <meshStandardMaterial {...{ color: BASE, roughness: 0.6, metalness: 0.0 }} />
        </mesh>
      )}
    </group>
  );
}
