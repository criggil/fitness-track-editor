import { useEffect, useState } from 'react';
import {
  Activity,
  Download,
  FolderOpen,
  Layers,
  Map as MapIcon,
  Redo2,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { DropZone } from './components/DropZone';
import { EditPanel } from './components/EditPanel';
import { FitInspector } from './components/FitInspector';
import { SummaryBar } from './components/SummaryBar';
import { TelemetryCharts } from './components/TelemetryCharts';
import { TrackMap } from './components/TrackMap';
import { useTrackStore } from './store/useTrackStore';
import { formatFileSize } from './utils/format';

type WorkspaceTab = 'visual' | 'inspector';

export function App() {
  const doc = useTrackStore((s) => s.doc);
  const summary = useTrackStore((s) => s.summary);
  const pastCount = useTrackStore((s) => s.past.length);
  const futureCount = useTrackStore((s) => s.future.length);
  const lastActionLabel = useTrackStore((s) => s.lastActionLabel);
  const exportWarnings = useTrackStore((s) => s.exportWarnings);
  const undo = useTrackStore((s) => s.undo);
  const redo = useTrackStore((s) => s.redo);
  const resetToOriginal = useTrackStore((s) => s.resetToOriginal);
  const closeDocument = useTrackStore((s) => s.closeDocument);
  const exportFit = useTrackStore((s) => s.exportFit);

  const [tab, setTab] = useState<WorkspaceTab>('visual');

  // Keyboard shortcuts for Undo / Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  if (!doc || !summary) {
    return <DropZone />;
  }

  const handleDownload = () => {
    const res = exportFit();
    if (!res) return;
    const blob = new Blob([res.bytes.buffer as ArrayBuffer], {
      type: 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Toolbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 sm:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-100 truncate">
                  {doc.fileName}
                </h1>
                <span className="text-[11px] font-mono text-slate-500 shrink-0">
                  {formatFileSize(doc.fileSize)}
                </span>
                {summary.sport && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {summary.sport}
                    {summary.subSport && summary.subSport !== 'generic'
                      ? ` · ${summary.subSport}`
                      : ''}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {lastActionLabel
                  ? lastActionLabel
                  : `${summary.totalMesgCount} FIT сообщений · ${summary.recordCount} точек`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-0.5">
              <button
                type="button"
                disabled={pastCount === 0}
                onClick={undo}
                title="Отменить (Ctrl/Cmd+Z)"
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={futureCount === 0}
                onClick={redo}
                title="Повторить (Ctrl/Cmd+Shift+Z)"
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pastCount === 0}
                onClick={resetToOriginal}
                title="Сбросить все изменения"
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={closeDocument}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Другой файл
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Экспорт .fit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-4">
        {exportWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 space-y-1">
            {exportWarnings.map((w, i) => (
              <div key={i}>• {w}</div>
            ))}
          </div>
        )}

        <SummaryBar />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="space-y-4 min-w-0">
            {/* View Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('visual')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  tab === 'visual'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Карта и графики
              </button>
              <button
                type="button"
                onClick={() => setTab('inspector')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  tab === 'inspector'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                FIT Инспектор ({summary.totalMesgCount})
              </button>
            </div>

            {tab === 'visual' ? (
              <div className="space-y-4">
                <TrackMap />
                <TelemetryCharts />
              </div>
            ) : (
              <FitInspector />
            )}
          </div>

          <EditPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
