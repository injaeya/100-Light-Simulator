/**
 * PlanView.tsx — 상부 배치도(플랜뷰) 오버레이.
 * 방·창문·피사체(방향)·스테이지·카메라·조명(조준선)을 위에서 내려다본 배치도로.
 * 조명 dot 클릭 시 선택.
 */
import { useSim } from '../../store/useSim';
import { useSimulatorStore } from '../../store/simulatorStore';
import { bgPoint, camP, DIR, lightVec, stageFace } from '../../sim/coords';
import { winCenter } from '../../sim/coords';
import { kelvinCSS } from '../../sim/kelvin';
import type { WinState } from '../../sim/types';

const BOX_W = 224;
const BOX_H = 208;
const PAD = 16;

export function PlanView() {
  const sim = useSim();
  const selectedLightId = useSimulatorStore((s) => s.selectedLightId);
  const selectLight = useSimulatorStore((s) => s.selectLight);
  const { room } = sim;

  // 월드(x,z) → SVG. -z(뒷벽)=위, +z(앞/카메라)=아래.
  const s = Math.min((BOX_W - 2 * PAD) / room.w, (BOX_H - 2 * PAD) / room.d);
  const rw = room.w * s, rd = room.d * s;
  const ox = (BOX_W - rw) / 2, oy = (BOX_H - rd) / 2;
  const X = (x: number) => ox + (x + room.w / 2) * s;
  const Y = (z: number) => oy + (z + room.d / 2) * s;

  const subjX = X(sim.subj.x), subjY = Y(sim.subj.z);
  const fdir = DIR(sim.subj.yaw); // facing (sin,0,cos)
  const cp = camP(sim);
  const camX = X(cp.x), camY = Y(cp.z);
  const stg = stageFace(sim);
  const stageX = X(stg.x), stageY = Y(stg.z);

  // 창문 세그먼트
  const winSeg = (W: WinState) => {
    const c = winCenter(W, room, sim.env.orient);
    const half = (W.w * s) / 2;
    const vertical = W.wall === 'left' || W.wall === 'right';
    const cx = X(c.x), cy = Y(c.z);
    return vertical
      ? { x1: cx, y1: cy - half, x2: cx, y2: cy + half }
      : { x1: cx - half, y1: cy, x2: cx + half, y2: cy };
  };

  return (
    <div className="plan-view">
      <div className="plan-head">
        <span>배치도 (상부)</span>
        <span className="plan-sub">뒷벽 ▲</span>
      </div>
      <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} className="plan-svg">
        {/* 방 */}
        <rect x={ox} y={oy} width={rw} height={rd} className="plan-room" rx={3} />
        {/* 창문 */}
        {sim.wins.map((W) =>
          W.on ? (
            (() => {
              const seg = winSeg(W);
              return <line key={W.id} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} className="plan-win" />;
            })()
          ) : null,
        )}

        {/* 조명 조준선 + dot */}
        {sim.lights.map((L) => {
          if (!L.on) return null;
          const p = lightVec(sim, L);
          const t = L.aim === 'bg' ? bgPoint(sim) : stg;
          const col = kelvinCSS(L.kelvin);
          const lx = X(p.x), ly = Y(p.z);
          const sel = L.id === selectedLightId;
          return (
            <g key={L.id} onClick={(e) => { e.stopPropagation(); selectLight(L.id); }} style={{ cursor: 'pointer' }}>
              <line x1={lx} y1={ly} x2={X(t.x)} y2={Y(t.z)} stroke={col} strokeWidth={1} strokeDasharray="2 2" opacity={0.55} />
              {sel && <circle cx={lx} cy={ly} r={7} fill="none" stroke="#4ea1ff" strokeWidth={1.5} />}
              <circle cx={lx} cy={ly} r={4.5} fill={col} stroke="#000" strokeWidth={0.6} />
            </g>
          );
        })}

        {/* 스테이지 앵커(조명 조준 기준) */}
        <g>
          <circle cx={stageX} cy={stageY} r={5} className="plan-stage" />
          <line x1={stageX - 7} y1={stageY} x2={stageX + 7} y2={stageY} className="plan-stage-cross" />
          <line x1={stageX} y1={stageY - 7} x2={stageX} y2={stageY + 7} className="plan-stage-cross" />
        </g>

        {/* 피사체 + 방향 */}
        <line x1={subjX} y1={subjY} x2={X(sim.subj.x + fdir.x * 0.7)} y2={Y(sim.subj.z + fdir.z * 0.7)} className="plan-subj-dir" />
        <circle cx={subjX} cy={subjY} r={6} className="plan-subj" />

        {/* 카메라 */}
        <g>
          <line x1={camX} y1={camY} x2={stageX} y2={stageY} className="plan-cam-line" />
          <rect x={camX - 4} y={camY - 4} width={8} height={8} className="plan-cam" rx={1.5} transform={`rotate(45 ${camX} ${camY})`} />
        </g>
      </svg>
      <div className="plan-legend">
        <span><i className="lg lg-subj" />피사체</span>
        <span><i className="lg lg-stage" />조준</span>
        <span><i className="lg lg-cam" />카메라</span>
      </div>
    </div>
  );
}
