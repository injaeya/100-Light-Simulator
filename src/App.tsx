import { SceneView } from './components/Scene/SceneView';
import { CameraPanel } from './components/Panels/CameraPanel';
import { LightsPanel } from './components/Panels/LightsPanel';
import { ScenePanel } from './components/Panels/ScenePanel';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand">
          <span className="brand-mark">◉</span>
          <div>
            <h1 className="brand-title">Light Simulator</h1>
            <p className="brand-sub">카메라 · 렌즈 · 조명 셋업 시뮬레이터</p>
          </div>
        </div>
        <div className="topbar-meta">전문 촬영 조명 프리비주얼라이제이션</div>
      </header>

      <main className="app-main">
        <aside className="sidebar sidebar-left">
          <ScenePanel />
          <CameraPanel />
        </aside>

        <div className="viewport">
          <SceneView />
          <div className="viewport-hint">
            드래그: 회전 · 휠: 줌 · 우클릭 드래그: 이동 · 조명 클릭: 선택
          </div>
        </div>

        <aside className="sidebar sidebar-right">
          <LightsPanel />
        </aside>
      </main>
    </div>
  );
}
