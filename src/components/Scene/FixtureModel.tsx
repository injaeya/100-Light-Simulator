/**
 * FixtureModel.tsx — 실제 촬영 기자재 3D 모델
 * 조명 스탠드(삼각대) + 기재 바디 + 모디파이어(소프트박스/돔/프레넬/우산/패널/튜브) + 발광면.
 * 그룹을 타겟 방향으로 lookAt 하여 발광면이 −Z(피사체)를 향하게 한다.
 */
import { useEffect, useRef } from 'react';
import { DoubleSide, Group } from 'three';
import { FIXTURES } from '../../sim/fixtures';
import { kelvinRGB } from '../../sim/kelvin';
import { effCd, effSize } from '../../sim/photometry';
import type { LightState } from '../../sim/types';
import { lin } from './sceneColor';

const METAL = { color: '#1b1b1f', roughness: 0.5, metalness: 0.7 } as const;
const BODY = { color: '#2a2a30', roughness: 0.45, metalness: 0.5 } as const;

/** 조명 스탠드(삼각대) — 바닥에서 기재 높이까지 (수직, lookAt 영향 없음) */
function Stand({ x, z, top }: { x: number; z: number; top: number }) {
  if (top < 0.5) return null;
  const legLen = Math.min(0.7, top * 0.55);
  return (
    <group position={[x, 0, z]}>
      {/* 기둥 */}
      <mesh position={[0, top / 2, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.022, top, 10]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {/* 삼각대 다리 3개 */}
      {[0, 120, 240].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <mesh
            key={deg}
            position={[Math.sin(a) * legLen * 0.35, legLen * 0.28, Math.cos(a) * legLen * 0.35]}
            rotation={[Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.012, legLen, 8]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        );
      })}
      {/* 베이스 허브 */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 10]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
    </group>
  );
}

/** 기재 헤드(바디+모디파이어+발광면). 로컬 −Z 가 발광 방향. */
function Head({ L, emissive }: { L: LightState; emissive: ReturnType<typeof lin> }) {
  const kind = FIXTURES[L.fix].kind;
  const sz = Math.min(1.6, effSize(L));
  const front = sz / 2;
  const mod = L.mod;

  const EmFace = ({ r, seg = 32, z = -0.02 }: { r: number; seg?: number; z?: number }) => (
    <mesh position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
      <circleGeometry args={[r, seg]} />
      <meshBasicMaterial color={emissive} toneMapped side={DoubleSide} />
    </mesh>
  );
  const EmRect = ({ w, h, z = -0.02 }: { w: number; h: number; z?: number }) => (
    <mesh position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={emissive} toneMapped side={DoubleSide} />
    </mesh>
  );

  // 튜브 라이트
  if (kind === 'tube') {
    const len = FIXTURES[L.fix].len || 1.1;
    return (
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.028, 0.028, len, 16]} />
          <meshStandardMaterial {...BODY} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, len * 0.96, 16]} />
          <meshBasicMaterial color={emissive} toneMapped />
        </mesh>
      </group>
    );
  }
  // 평판 패널
  if (kind === 'panel') {
    const s = FIXTURES[L.fix].size || 0.32;
    return (
      <group>
        <mesh position={[0, 0, 0.03]} castShadow>
          <boxGeometry args={[s * 1.06, s * 0.7, 0.05]} />
          <meshStandardMaterial {...BODY} />
        </mesh>
        <EmRect w={s} h={s * 0.64} z={0.005} />
      </group>
    );
  }
  // 반사판
  if (kind === 'bounce') {
    return (
      <mesh castShadow>
        <boxGeometry args={[sz, sz * 1.1, 0.02]} />
        <meshStandardMaterial color="#e8e8ee" roughness={0.35} metalness={0.4} side={DoubleSide} />
      </mesh>
    );
  }
  // 프랙티컬(전구)
  if (kind === 'prac') {
    return (
      <group>
        <mesh position={[0, 0, 0.08]}>
          <coneGeometry args={[0.13, 0.16, 20, 1, true]} />
          <meshStandardMaterial color="#e9e2d0" roughness={0.7} side={DoubleSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.06, 20, 20]} />
          <meshBasicMaterial color={emissive} toneMapped />
        </mesh>
      </group>
    );
  }

  // COB — 바디 배럴 (세로 실린더를 눕힘)
  const Barrel = () => (
    <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.075, 0.09, 0.22, 20]} />
      <meshStandardMaterial {...BODY} />
    </mesh>
  );

  // 소프트박스류 프러스텀 (radialSegments: 사각/팔각)
  const Softbox = ({ seg }: { seg: number }) => (
    <group>
      <Barrel />
      <mesh position={[0, 0, -front / 2]} rotation={[Math.PI / 2, 0, seg === 4 ? Math.PI / 4 : 0]} castShadow>
        <cylinderGeometry args={[front, 0.06, front, seg, 1, true]} />
        <meshStandardMaterial color="#141418" roughness={0.6} side={DoubleSide} />
      </mesh>
      {seg === 4 ? <EmRect w={sz * 0.98} h={sz * 0.98} z={-front} /> : <EmFace r={front * 0.98} seg={seg} z={-front} />}
    </group>
  );

  if (mod === 'sb60' || mod === 'book') return <Softbox seg={4} />;
  if (mod === 'octa150') return <Softbox seg={8} />;
  if (mod === 'dome' || mod === 'domexl' || mod === 'lantern') {
    return (
      <group>
        <Barrel />
        <mesh position={[0, 0, -front * 0.5]} scale={[1, 1, 0.7]}>
          <sphereGeometry args={[front, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#dcdce2" roughness={0.5} side={DoubleSide} transparent opacity={0.85} />
        </mesh>
        <EmFace r={front * 0.9} z={-front * 0.85} />
      </group>
    );
  }
  if (mod === 'umbrella') {
    return (
      <group>
        <Barrel />
        {/* 우산(뒤로 열림) */}
        <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[front, front * 0.7, 16, 1, true]} />
          <meshStandardMaterial color="#c9c9d0" roughness={0.5} side={DoubleSide} />
        </mesh>
        <EmFace r={front * 0.55} z={-0.03} />
      </group>
    );
  }
  if (mod === 'fresnel') {
    return (
      <group>
        <Barrel />
        {/* 프레넬 헤드 */}
        <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.13, 0.14, 24]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <EmFace r={0.12} z={-0.09} />
      </group>
    );
  }
  // reflector / bare / grid / diff / none → 리플렉터
  return (
    <group>
      <Barrel />
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.08, 0.16, 20, 1, true]} />
        <meshStandardMaterial color="#c9c9cf" roughness={0.35} metalness={0.6} side={DoubleSide} />
      </mesh>
      <EmFace r={0.075} z={-0.02} />
    </group>
  );
}

export function FixtureModel({
  L,
  p,
  t,
  selected,
  onSelect,
}: {
  L: LightState;
  p: [number, number, number];
  t: [number, number, number];
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const headRef = useRef<Group>(null);
  useEffect(() => {
    if (headRef.current) headRef.current.lookAt(t[0], t[1], t[2]);
  }, [t, p]);

  const cd = effCd(L);
  const A = Math.max(0.006, effSize(L) ** 2 * 0.72);
  const rad = L.on ? Math.min(1500, cd / A) : 0.002;
  const kc = kelvinRGB(L.kelvin);
  const emissive = lin(rad * kc.r + 0.003, rad * kc.g + 0.003, rad * kc.b + 0.003);

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(L.id); }}>
      <Stand x={p[0]} z={p[2]} top={p[1]} />
      <group ref={headRef} position={p}>
        <Head L={L} emissive={emissive} />
        {selected && (
          <mesh>
            <sphereGeometry args={[Math.max(0.24, effSize(L) * 0.55), 16, 12]} />
            <meshBasicMaterial color="#4ea1ff" wireframe transparent opacity={0.35} toneMapped={false} />
          </mesh>
        )}
      </group>
    </group>
  );
}
