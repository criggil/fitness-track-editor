import { useRef, useState } from 'react';
import { Activity, FileUp, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTrackStore } from '../store/useTrackStore';
import { LanguageSwitcher } from './LanguageSwitcher';

export function DropZone() {
  const { t } = useI18n();
  const loadBytes = useTrackStore((s) => s.loadBytes);
  const loadDemo = useTrackStore((s) => s.loadDemo);
  const error = useTrackStore((s) => s.error);
  const clearError = useTrackStore((s) => s.clearError);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    clearError();
    const buf = await file.arrayBuffer();
    loadBytes(new Uint8Array(buf), file.name);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitcher />
      </div>

      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('dropzone.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 flex items-center justify-center gap-3">
            <Activity className="w-8 h-8 text-sky-400" />
            {t('app.title')}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            {t('dropzone.subtitle')}
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            isDragging
              ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".fit,.FIT"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 group-hover:border-sky-500/50 group-hover:bg-sky-500/10 transition-colors">
            <FileUp className="w-7 h-7 text-sky-400" />
          </div>
          <p className="text-base font-medium text-slate-100">
            {t('dropzone.prompt')}
          </p>
          <p className="text-xs text-slate-500 mt-2">{t('dropzone.sdkNote')}</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={loadDemo}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t('dropzone.loadDemo')}
          </button>
        </div>
      </div>
    </div>
  );
}
