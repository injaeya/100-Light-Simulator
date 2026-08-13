/**
 * PlanView.tsx — 상부 배치도(플랜뷰) 오버레이.
 * 방·창문·피사체(방향)·스테이지·카메라·조명(조준선)을 위에서 내려다본 배치도로.
 * 조명 dot 클릭 시 선택.
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useSim } from '../../store/useSim';
import { useSimulatorStore } from '../../store/simulatorStore';
import { camAim, camPos, DIR, lightAim, lightVec, stageFace } from '../../sim/coords';
import { winCenter } from '../../sim/coords';
import { kelvinCSS } from '../../sim/kelvin';
import type { WinState } from '../../sim/types';

const BOX_W = 224;
const BOX_H = 208;
const PAD = 16;

/** 드래그 대상 */
type Drag = { id: number; kind: 'pos' | 'aim' | 'campos' | 'camaim' } | null;

export function PlanView() {
  const sim = useSim();
  const selectedLightId = useSimulatorStore((s) => s.selectedLightId);
  const selectLight = useSimulatorStore((s) => s.selectLight);
  const updateLight = useSimulatorStore((s) => s.updateLight);
  const updateCam = useSimulatorStore((s) => s.updateCam);
  const selectCam = useSimulatorStore((s) => s.selectCam);
  const { room } = sim;

  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag>(null);

  // 월드(x,z) → SVG. -z(뒷벽)=위, +z(앞/카메라)=아래.
  const s = Math.min((BOX_W - 2 * PAD) / room.w, (BOX_H - 2 * PAD) / room.d);
  const rw = room.w * s, rd = room.d * s;
  const ox = (BOX_W - rw) / 2, oy = (BOX_H - rd) / 2;
  const X = (x: number) => ox + (x + room.w / 2) * s;
  const Y = (z: number) => oy + (z + room.d / 2) * s;

  // SVG 포인터 → 월드(x,z). viewBox 스케일 보정.
  const toWorld = (e: ReactPointerEvent) => {
    const el = svgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * BOX_W;
    const py = ((e.clientY - r.top) / r.height) * BOX_H;
    return { x: (px - ox) / s - room.w / 2, z: (py - oy) / s - room.d / 2 };
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag) return;
    const w = toWorld(e);
    if (!w) return;
    if (drag.kind === 'pos') updateLight(drag.id, { place: 'free', x: w.x, z: w.z });
    else if (drag.kind === 'aim') updateLight(drag.id, { aim: 'free', tx: w.x, tz: w.z });
    else if (drag.kind === 'campos') updateCam(drag.id, { place: 'free', x: w.x, z: w.z });
    else updateCam(drag.id, { aim: 'free', tx: w.x, tz: w.z });
  };
  const endDrag = () => setDrag(null);

  const subjX = X(sim.subj.x), subjY = Y(sim.subj.z);
  const fdir = DIR(sim.subj.yaw); // facing (sin,0,cos)
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
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOX_W} ${BOX_H}`}
        className="plan-svg"
        style={{ touchAction: 'none' }}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
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

        {/* 조명 조준선 + dot (드래그로 자유 배치) */}
        {sim.lights.map((L) => {
          if (!L.on) return null;
          const p = lightVec(sim, L);
          const t = lightAim(sim, L);
          const col = kelvinCSS(L.kelvin);
          const lx = X(p.x), ly = Y(p.z);
          const tx = X(t.x), ty = Y(t.z);
          const sel = L.id === selectedLightId;
          return (
            <g key={L.id}>
              <line x1={lx} y1={ly} x2={tx} y2={ty} stroke={col} strokeWidth={1} strokeDasharray="2 2" opacity={0.55} />
              {sel && <circle cx={lx} cy={ly} r={7} fill="none" stroke="#4ea1ff" strokeWidth={1.5} />}
              {/* 조명 위치 핸들 */}
              <circle
                cx={lx}
                cy={ly}
                r={sel ? 5.5 : 4.5}
                fill={col}
                stroke="#000"
                strokeWidth={0.6}
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  selectLight(L.id);
                  setDrag({ id: L.id, kind: 'pos' });
                }}
              />
              {/* 선택 조명의 조준 핸들 (드래그로 조준 자유 이동) */}
              {sel && (
                <rect
                  x={tx - 4}
                  y={ty - 4}
                  width={8}
                  height={8}
                  fill="none"
                  stroke={col}
                  strokeWidth={1.4}
                  transform={`rotate(45 ${tx} ${ty})`}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    setDrag({ id: L.id, kind: 'aim' });
                  }}
                />
              )}
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

        {/* 카메라(다대) — 드래그로 자유 배치, 클릭으로 활성 지정 */}
        {sim.cams.map((C) => {
          const cp = camPos(sim, C);
          const at = camAim(sim, C);
          const cx = X(cp.x), cy = Y(cp.z);
          const act = C.id === sim.activeCamId;
          return (
            <g key={C.id}>
              <line x1={cx} y1={cy} x2={X(at.x)} y2={Y(at.z)} className="plan-cam-line" opacity={act ? 0.9 : 0.4} />
              {act && <circle cx={cx} cy={cy} r={8} fill="none" stroke="#4ea1ff" strokeWidth={1.5} />}
              <rect
                x={cx - 4}
                y={cy - 4}
                width={8}
                height={8}
                className="plan-cam"
                rx={1.5}
                transform={`rotate(45 ${cx} ${cy})`}
                opacity={act ? 1 : 0.55}
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  selectCam(C.id);
                  setDrag({ id: C.id, kind: 'campos' });
                }}
              />
            </g>
          );
        })}
      </svg>
      <div className="plan-legend">
        <span><i className="lg lg-subj" />피사체</span>
        <span><i className="lg lg-stage" />조준</span>
        <span><i className="lg lg-cam" />카메라</span>
      </div>
    </div>
  );
}
