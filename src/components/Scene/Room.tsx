/**
 * Room.tsx — 방(바닥·천장·구멍뚫린 벽), 창(유리·커튼), 스카이돔
 */
import { useMemo } from 'react';
import {
  BackSide,
  DoubleSide,
  FrontSide,
  Matrix4,
  Path,
  Quaternion,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three';
import { walls, winCenter } from '../../sim/coords';
import { skyState } from '../../sim/daylight';
import { kelvinRGB, wbFactor } from '../../sim/kelvin';
import type { SimState, WallId, WinState } from '../../sim/types';
import { FLOOR_COLOR, lin } from './sceneColor';

/** 한 벽의 구멍뚫린 지오메트리 생성 (월드 좌표로 베이크) */
function useWallGeometry(
  wallId: WallId,
  sim: SimState,
): ShapeGeometry {
  const { room, env, wins } = sim;
  return useMemo(() => {
    const wl = walls(room, env.orient)[wallId];
    const half = wl.half;
    const H = room.h;
    // 벽 외곽 (u: -half..half, v: 0..H)
    const shape = new Shape();
    shape.moveTo(-half, 0);
    shape.lineTo(half, 0);
    shape.lineTo(half, H);
    shape.lineTo(-half, H);
    shape.lineTo(-half, 0);
    // 창 구멍
    for (const W of wins) {
      if (W.wall !== wallId) continue;
      const u0 = W.u - W.w / 2, u1 = W.u + W.w / 2, v0 = W.sill, v1 = W.sill + W.h;
      const hole = new Path();
      hole.moveTo(u0, v0);
      hole.lineTo(u1, v0);
      hole.lineTo(u1, v1);
      hole.lineTo(u0, v1);
      hole.lineTo(u0, v0);
      shape.holes.push(hole);
    }
    const geo = new ShapeGeometry(shape);
    // local(u,v,0) → origin + u·uDir + v·up
    const up = new Vector3(0, 1, 0);
    const m = new Matrix4().makeBasis(wl.uDir, up, wl.n).setPosition(wl.origin);
    geo.applyMatrix4(m);
    geo.computeVertexNormals();
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallId, room.w, room.d, room.h, env.orient, JSON.stringify(wins.map((w) => [w.wall, w.u, w.w, w.h, w.sill]))]);
}

function Wall({ wallId, sim, color }: { wallId: WallId; sim: SimState; color: ReturnType<typeof lin> }) {
  const geo = useWallGeometry(wallId, sim);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.96} side={FrontSide} shadowSide={DoubleSide} />
    </mesh>
  );
}

/** 창 유리 + 커튼 (구멍 위치에 겹쳐 배치) */
function WindowPane({ W, sim }: { W: WinState; sim: SimState }) {
  const { room, env } = sim;
  const wl = walls(room, env.orient)[W.wall];
  const center = winCenter(W, room, env.orient);
  const sk = skyState(sim);
  const cur = W.curtain / 100;
  // 벽 평면 방향
  const quat = useMemo(() => {
    const up = new Vector3(0, 1, 0);
    const m = new Matrix4().makeBasis(wl.uDir, up, wl.n);
    return new Quaternion().setFromRotationMatrix(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wl.uDir.x, wl.uDir.z, wl.n.x, wl.n.z]);

  const curtainRGB = wbFactor(sk.skyK, sim.expo.wb);
  const curtainL = 0.25;

  return (
    <group position={[center.x, center.y, center.z]} quaternion={quat}>
      {/* 유리 */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[W.w, W.h]} />
        <meshStandardMaterial color={lin(0.7, 0.78, 0.9)} transparent opacity={0.1} roughness={0.05} side={DoubleSide} />
      </mesh>
      {/* 커튼 */}
      {W.curtain < 98 && (
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[W.w, W.h]} />
          <meshBasicMaterial
            color={lin(curtainL * curtainRGB.r, curtainL * curtainRGB.g, curtainL * curtainRGB.b)}
            transparent
            opacity={Math.min(1, Math.max(0, 1 - cur)) * 0.9}
            side={DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

export function Room({ sim }: { sim: SimState }) {
  const { room, env } = sim;
  const alb = room.albedo;
  const wallColor = lin(alb, alb, alb * 0.985);
  const ceilColor = lin(alb * 1.05, alb * 1.05, alb * 1.04);
  const floorC = FLOOR_COLOR[room.floor] || FLOOR_COLOR.wood;
  const sk = skyState(sim);
  // 스카이돔은 창 너머로만 보이는 실외광. 톤매핑에서 분리(고정 밝기)해 실내 노출과 무관하게 표현.
  const skyL = sk.night ? 0.06 : 0.75;
  const skyC = kelvinRGB(sk.night ? 12000 : sk.skyK);

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[room.w, room.d]} />
        <meshStandardMaterial color={lin(floorC[0], floorC[1], floorC[2])} roughness={0.85} />
      </mesh>
      {/* 천장 — 조명 조건(방 높이·바운스)에는 관여하되 화면에는 보이지 않음
          (colorWrite/depthWrite 끔: 렌더/깊이에 안 그려져 시야를 가리지 않음) */}
      <mesh position={[0, room.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[room.w, room.d]} />
        <meshStandardMaterial color={ceilColor} roughness={0.97} side={DoubleSide} colorWrite={false} depthWrite={false} />
      </mesh>
      {/* 벽 4면 */}
      {(['left', 'right', 'back', 'front'] as WallId[]).map((id) => (
        <Wall key={id} wallId={id} sim={sim} color={wallColor} />
      ))}
      {/* 창 */}
      {env && sim.wins.map((W) => (W.on ? <WindowPane key={W.id} W={W} sim={sim} /> : null))}
      {/* 스카이돔 (창 너머 실외광, 톤매핑 무관) */}
      <mesh scale={200}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={lin(skyL * skyC.r, skyL * skyC.g, skyL * skyC.b)} side={BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
}
