import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { SceneView } from './components/Scene/SceneView';
import { PresetPanel } from './components/Panels/PresetPanel';
import { CameraPanel } from './components/Panels/CameraPanel';
import { PlacementPanel } from './components/Panels/PlacementPanel';
import { LightsPanel } from './components/Panels/LightsPanel';
import { WindowsPanel } from './components/Panels/WindowsPanel';
import { LightMeter, MeterOverlay } from './components/Panels/LightMeter';
import { PlanView } from './components/Panels/PlanView';
import { useSimulatorStore } from './store/simulatorStore';
import './App.css';

type Tab = 'preset' | 'camera' | 'space' | 'lights' | 'windows' | 'meter';
const TABS: { id: Tab; label: string }[] = [
  { id: 'preset', label: '프리셋' },
  { id: 'space', label: '공간' },
  { id: 'camera', label: '카메라' },
  { id: 'lights', label: '조명' },
  { id: 'windows', label: '창문' },
  { id: 'meter', label: '미터' },
];

function PanelFor({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'preset': return <PresetPanel />;
    case 'camera': return <CameraPanel />;
    case 'space': return <PlacementPanel />;
    case 'lights': return <LightsPanel />;
    case 'windows': return <WindowsPanel />;
    case 'meter': return <LightMeter />;
  }
}

export default function App() {
  const view = useSimulatorStore((s) => s.view);
  const setView = useSimulatorStore((s) => s.setView);
  const theme = useSimulatorStore((s) => s.theme);
  const toggleTheme = useSimulatorStore((s) => s.toggleTheme);
  const showPlan = useSimulatorStore((s) => s.showPlan);
  const showMeter = useSimulatorStore((s) => s.showMeter);
  const [tab, setTab] = useState<Tab>('preset');

  // 모바일 바텀시트 — 드래그 스냅(peek / half / full)
  type Snap = 'peek' | 'half' | 'full';
  const [snap, setSnap] = useState<Snap>('peek');
  const [dragH, setDragH] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const snapPx = () => {
    const ih = window.innerHeight;
    return { peek: 108, half: Math.round(ih * 0.5), full: Math.round(ih * 0.9) };
  };
  const onHandleDown = (e: ReactPointerEvent) => {
    const h = sheetRef.current?.getBoundingClientRect().height ?? snapPx()[snap];
    drag.current = { startY: e.clientY, startH: h, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onHandleMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - e.clientY;
    if (Math.abs(dy) > 4) d.moved = true;
    const { peek, full } = snapPx();
    setDragH(Math.min(full, Math.max(peek, d.startH + dy)));
  };
  const onHandleUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      setSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'));
      setDragH(null);
      return;
    }
    const { peek, half, full } = snapPx();
    const h = dragH ?? d.startH;
    const targets: [Snap, number][] = [['peek', peek], ['half', half], ['full', full]];
    let best = targets[0];
    for (const t of targets) if (Math.abs(t[1] - h) < Math.abs(best[1] - h)) best = t;
    setSnap(best[0]);
    setDragH(null);
  };
  const openTab = (id: Tab) => {
    setTab(id);
    if (snap === 'peek') setSnap('half');
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand">
          <span className="brand-mark">◉</span>
          <div>
            <h1 className="brand-title">LIGHTPLAN</h1>
            <p className="brand-sub">촬영 조명 프리비주얼</p>
          </div>
        </div>
        <div className="topbar-right">
          <div className="view-toggle">
            <button className={`vt-btn ${view === 'cam' ? 'active' : ''}`} onClick={() => setView('cam')}>촬영뷰</button>
            <button className={`vt-btn ${view === 'free' ? 'active' : ''}`} onClick={() => setView('free')}>자유뷰</button>
          </div>
          <button className="theme-btn" onClick={toggleTheme} aria-label="테마 전환" title="라이트/다크 테마">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* 데스크톱 좌측 — 탭으로 넘기며 설정 */}
        <aside className="sidebar-tabs desktop-only">
          <div className="tab-rail">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="tab-panel">
            <PanelFor tab={tab} />
          </div>
        </aside>

        <div className="viewport">
          <SceneView />
          {showMeter && <MeterOverlay />}
          {showPlan && <PlanView />}
          <div className="viewport-hint desktop-only">
            {view === 'free' ? '드래그: 회전 · 휠: 줌' : '촬영뷰 — 카메라 방위/거리/높이는 좌측 탭에서'}
          </div>
        </div>
      </main>

      {/* 모바일 하단 시트 — 드래그로 높이 조절(peek/half/full) */}
      <div
        ref={sheetRef}
        className={`sheet mobile-only sheet-${snap}`}
        style={dragH != null ? { height: dragH, transition: 'none' } : undefined}
      >
        <div
          className="sheet-handle"
          role="button"
          tabIndex={0}
          aria-label="설정 시트 크기 조절"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span className="sheet-grip" />
        </div>
        <div className="sheet-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`sheet-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => openTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="sheet-body">
          <PanelFor tab={tab} />
        </div>
      </div>
    </div>
  );
}
