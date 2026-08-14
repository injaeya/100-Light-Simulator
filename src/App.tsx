import { useEffect, useState } from 'react';
import { SceneView } from './components/Scene/SceneView';
import { PresetPanel } from './components/Panels/PresetPanel';
import { CameraPanel } from './components/Panels/CameraPanel';
import { PlacementPanel } from './components/Panels/PlacementPanel';
import { LightsPanel } from './components/Panels/LightsPanel';
import { WindowsPanel } from './components/Panels/WindowsPanel';
import { LightMeter } from './components/Panels/LightMeter';
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
  const [tab, setTab] = useState<Tab>('preset');
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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
        {/* 데스크톱 좌측 — 피사체·공간 먼저, 카메라 다음 */}
        <aside className="sidebar sidebar-left desktop-only">
          <PresetPanel />
          <PlacementPanel />
          <CameraPanel />
        </aside>

        <div className="viewport">
          <SceneView />
          {showPlan && <PlanView />}
          <div className="viewport-hint desktop-only">
            {view === 'free' ? '드래그: 회전 · 휠: 줌' : '촬영뷰 — 카메라 방위/거리/높이는 좌측에서'}
          </div>
        </div>

        {/* 데스크톱 우측 */}
        <aside className="sidebar sidebar-right desktop-only">
          <LightsPanel />
          <WindowsPanel />
          <LightMeter />
        </aside>
      </main>

      {/* 모바일 하단 시트 */}
      <div className={`sheet mobile-only ${expanded ? 'expanded' : 'collapsed'}`}>
        <button className="sheet-handle" onClick={() => setExpanded((e) => !e)} aria-label="시트 토글">
          <span className="sheet-grip" />
        </button>
        <div className="sheet-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`sheet-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => { setTab(t.id); setExpanded(true); }}
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
