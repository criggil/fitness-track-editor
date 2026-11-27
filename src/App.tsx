import { useEffect, useState } from 'react';
import {
  Activity,
  Download,
  FolderOpen,
  Layers,
  Map as MapIcon,
  Redo2,
  RotateCcw,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react';
import { DropZone } from './components/DropZone';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { RawFitEditor } from './components/RawFitEditor';
import { ScenariosTab } from './components/ScenariosTab';
import { SummaryBar } from './components/SummaryBar';
import { TelemetryCharts } from './components/TelemetryCharts';
import { TrackMap } from './components/TrackMap';
import { useI18n } from './i18n';
import { useTrackStore } from './store/useTrackStore';
import { formatFileSize } from './utils/format';

type WorkspaceTab = 'overview' | 'scenarios' | 'raw';

export function App() {
  const { t } = useI18n();
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

  const [tab, setTab] = useState<WorkspaceTab>('overview');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLSelectElement
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
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 sm:px-6 pt-3">
        <div className="max-w-[1600px] mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
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
                  {pastCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono">
                      {t('app.editsCount', { count: pastCount })}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {lastActionLabel
                    ? lastActionLabel
                    : t('app.messagesSummary', {
                        messages: summary.totalMesgCount,
                        records: summary.recordCount,
                      })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <LanguageSwitcher />

              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-0.5">
                <button
                  type="button"
                  disabled={pastCount === 0}
                  onClick={undo}
                  title={t('app.undoTooltip')}
                  className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={futureCount === 0}
                  onClick={redo}
                  title={t('app.redoTooltip')}
                  className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pastCount === 0}
                  onClick={resetToOriginal}
                  title={t('app.resetTooltip')}
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
                {t('app.openAnother')}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {t('app.exportFit')}
              </button>
            </div>
          </div>

          {/* 3 Main Tabs */}
          <div className="flex items-center gap-1 -mb-px">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                tab === 'overview'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              {t('tab.overview')}
            </button>

            <button
              type="button"
              onClick={() => setTab('scenarios')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                tab === 'scenarios'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('tab.scenarios')}
            </button>

            <button
              type="button"
              onClick={() => setTab('raw')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                tab === 'raw'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {t('tab.raw', { count: summary.totalMesgCount })}
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

        {tab === 'overview' && (
          <div className="space-y-4">
            <TrackMap />
            <TelemetryCharts />
          </div>
        )}

        {tab === 'scenarios' && <ScenariosTab />}

        {tab === 'raw' && <RawFitEditor />}
      </main>
    </div>
  );
}

export default App;
