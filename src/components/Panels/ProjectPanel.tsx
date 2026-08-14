/**
 * ProjectPanel.tsx — 프로젝트 저장/불러오기/공유/내보내기 (P1)
 * PresetPanel 상단에 삽입되는 섹션(별도 Panel 아님).
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { useSimulatorStore, toPersisted } from '../../store/simulatorStore';
import {
  buildShareUrl,
  decode,
  deleteProject,
  encode,
  listProjects,
  loadProject,
  saveProject,
  type ProjectMeta,
} from '../../store/persist';

function fmt(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ProjectSection() {
  const applyPersisted = useSimulatorStore((s) => s.applyPersisted);
  const resetProject = useSimulatorStore((s) => s.resetProject);

  const [projects, setProjects] = useState<ProjectMeta[]>(() => listProjects());
  const [showList, setShowList] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = (m: string) => {
    setMsg(m);
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 2600);
  };
  const refresh = () => setProjects(listProjects());
  const current = () => toPersisted(useSimulatorStore.getState());

  const onSave = () => {
    const def = `조명셋업 ${new Date().toLocaleDateString()}`;
    const name = window.prompt('프로젝트 이름', def);
    if (name == null) return;
    const n = name.trim();
    if (!n) return;
    saveProject(n, current());
    refresh();
    setShowList(true);
    toast(`'${n}' 저장됨`);
  };
  const onLoad = (id: string, name: string) => {
    const p = loadProject(id);
    if (!p) {
      window.alert('불러오기 실패: 저장 데이터가 손상되었습니다.');
      return;
    }
    applyPersisted(p);
    toast(`'${name}' 불러옴`);
  };
  const onDelete = (id: string, name: string) => {
    if (!window.confirm(`'${name}' 프로젝트를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    deleteProject(id);
    refresh();
  };
  const onShare = async () => {
    const url = buildShareUrl(current());
    try {
      await navigator.clipboard.writeText(url);
      toast('공유 링크가 클립보드에 복사되었습니다.');
    } catch {
      window.prompt('아래 링크를 복사하세요', url);
    }
  };
  const onExport = () => {
    const blob = new Blob([encode(current())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightplan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('JSON 내보내기 완료');
  };
  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const text = await f.text();
    const p = decode(text);
    if (!p) {
      window.alert('가져오기 실패: 파일 형식이 올바르지 않거나 지원하지 않는 버전입니다.');
      return;
    }
    applyPersisted(p);
    toast('가져오기 완료');
  };
  const onReset = () => {
    if (!window.confirm('현재 설정을 초기화할까요? 저장하지 않은 변경은 사라집니다.')) return;
    resetProject();
    toast('초기화됨');
  };

  return (
    <div className="proj-section">
      <div className="proj-actions">
        <button className="proj-btn" type="button" onClick={onSave}>💾 저장</button>
        <button className="proj-btn" type="button" onClick={() => setShowList((v) => !v)}>📂 불러오기</button>
        <button className="proj-btn" type="button" onClick={onShare}>🔗 공유</button>
        <button className="proj-btn" type="button" onClick={onExport}>⬇ 내보내기</button>
        <button className="proj-btn" type="button" onClick={() => fileRef.current?.click()}>⬆ 가져오기</button>
        <button className="proj-btn danger" type="button" onClick={onReset}>↺ 초기화</button>
      </div>
      {msg && <p className="proj-msg">{msg}</p>}
      {showList && (
        <div className="proj-list">
          {projects.length === 0 && <p className="hint">저장된 프로젝트가 없습니다.</p>}
          {projects.map((pr) => (
            <div className="proj-row" key={pr.id}>
              <button className="proj-load" type="button" onClick={() => onLoad(pr.id, pr.name)}>
                <span className="proj-name">{pr.name}</span>
                <span className="proj-at">{fmt(pr.at)}</span>
              </button>
              <button className="icon-btn" type="button" onClick={() => onDelete(pr.id, pr.name)} aria-label="삭제">✕</button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
      <div className="proj-divider" />
    </div>
  );
}
