/**
 * LightMeter.tsx — analyze() 결과를 실시간 표시하는 노출계/측광 미터
 */
import { useMemo, useState } from 'react';
import { useSim } from '../../store/useSim';
import { analyze } from '../../sim/photometry';
import { FIXTURES } from '../../sim/fixtures';
import { MODIFIERS } from '../../sim/modifiers';
import { nearestStop } from '../../sim/coords';
import { kelvinCSS } from '../../sim/kelvin';
import type { LightState } from '../../sim/types';
import { Panel } from './controls';

function softLabel(soft: number): string {
  if (soft > 0.6) return '매우 부드러움';
  if (soft > 0.34) return '부드러움';
  if (soft > 0.16) return '보통';
  return '단단함';
}

/** 미터 본문(그리드 + 광원 기여). Panel/오버레이 공용. max: 광원 표시 개수 제한 */
function MeterBody({ max }: { max?: number }) {
  const sim = useSim();
  const a = useMemo(() => analyze(sim), [sim]);

  const ratio = a.stops >= 0 ? Math.pow(2, a.stops) : 1;
  const errAbs = Math.abs(a.err);
  const errLabel = errAbs < 0.15 ? '적정' : a.err > 0 ? `+${a.err.toFixed(1)} 과노출` : `${a.err.toFixed(1)} 부족`;
  const errClass = errAbs < 0.4 ? 'ok' : errAbs < 1 ? 'warn' : 'bad';
  const recF = nearestStop(a.fRec);
  const keyName =
    a.key && a.key.kind === 'fix'
      ? (a.key.ref as LightState).name
      : a.key
        ? a.key.name
        : '-';

  const sorted = a.src.slice().sort((x, y) => (y.lux || 0) - (x.lux || 0));
  const shown = max ? sorted.slice(0, max) : sorted;

  return (
    <>
      <div className="meter-grid">
        <div className="meter-cell">
          <span className="meter-k">얼굴 조도</span>
          <strong className="meter-v">{Math.round(a.front).toLocaleString()}<em> lx</em></strong>
        </div>
        <div className="meter-cell">
          <span className="meter-k">명암비</span>
          <strong className="meter-v">{a.stops.toFixed(2)}<em> st</em></strong>
          <span className="meter-sub">{ratio.toFixed(1)} : 1</span>
        </div>
        <div className={`meter-cell ${errClass}`}>
          <span className="meter-k">노출</span>
          <strong className="meter-v">{errLabel}</strong>
          <span className="meter-sub">권장 f/{recF < 10 ? recF.toFixed(1) : Math.round(recF)}</span>
        </div>
        <div className="meter-cell">
          <span className="meter-k">키 라이트</span>
          <strong className="meter-v meter-name">{keyName}</strong>
          <span className="meter-sub">그림자 {softLabel(a.soft)}</span>
        </div>
        <div className="meter-cell">
          <span className="meter-k">혼합 색온도</span>
          <strong className="meter-v">
            <span className="kelvin-swatch" style={{ background: kelvinCSS(Math.round(a.mixK)) }} />
            {Math.round(a.mixK)}<em> K</em>
          </strong>
        </div>
        <div className="meter-cell">
          <span className="meter-k">바운스</span>
          <strong className="meter-v">{Math.round(a.bounce).toLocaleString()}<em> lx</em></strong>
        </div>
      </div>

      {/* 광원별 기여 */}
      <div className="meter-sources">
        <div className="meter-src-head">
          <span>광원</span>
          <span>얼굴 조도</span>
        </div>
        {a.src.length === 0 && <p className="hint">켜진 광원이 없습니다.</p>}
        {shown.map((s, i) => {
          const isFix = s.kind === 'fix';
          const L = isFix ? (s.ref as LightState) : null;
          const sub = L ? `${FIXTURES[L.fix].label.split(' ')[0]} · ${MODIFIERS[L.mod].label}` : s.kind === 'win' ? '창광' : '직사광';
          const share = a.front > 0 ? Math.min(100, ((s.lux || 0) / a.front) * 100) : 0;
          return (
            <div className="meter-src" key={i}>
              <span className="meter-src-dot" style={{ background: kelvinCSS(s.k) }} />
              <div className="meter-src-info">
                <span className="meter-src-name">{s.name}</span>
                <span className="meter-src-sub">{sub}</span>
              </div>
              <div className="meter-src-bar">
                <div className="meter-src-fill" style={{ width: `${share}%`, background: kelvinCSS(s.k) }} />
              </div>
              <span className="meter-src-lux">{Math.round(s.lux || 0).toLocaleString()}</span>
            </div>
          );
        })}
        {max && sorted.length > max && <p className="hint">외 {sorted.length - max}개 — 미터 탭에서 전체 보기</p>}
      </div>
    </>
  );
}

/** 미터 탭 패널 */
export function LightMeter() {
  return (
    <Panel title="라이트 미터" subtitle="실시간 측광 · 노출계">
      <MeterBody />
    </Panel>
  );
}

/** 뷰포트 오버레이(배치도처럼 떠 있는 미터 카드) */
export function MeterOverlay() {
  // 모바일에선 기본 접힘
  const [collapsed, setCollapsed] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 900px)').matches,
  );
  return (
    <div className={`meter-overlay ${collapsed ? 'collapsed' : ''}`}>
      <button className="plan-head" type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
        <span>라이트 미터</span>
        <span className="plan-sub">{collapsed ? '▸ 펼치기' : '실시간 노출계'}</span>
      </button>
      {!collapsed && <MeterBody max={4} />}
    </div>
  );
}
