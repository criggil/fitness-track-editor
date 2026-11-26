import { useMemo, useState } from 'react';
import { useTrackStore } from '../store/useTrackStore';
import { formatFitValue } from '../utils/format';

const PAGE_SIZE = 50;

export function FitInspector() {
  const entries = useTrackStore((s) => s.entries);
  const [selectedType, setSelectedType] = useState<string>('sessionMesgs');
  const [page, setPage] = useState(0);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const list = map.get(e.mesgName) ?? [];
      list.push(e);
      map.set(e.mesgName, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [entries]);

  const activeName = useMemo(() => {
    if (grouped.some(([name]) => name === selectedType)) return selectedType;
    return grouped.find(([name]) => name === 'sessionMesgs')?.[0] ?? grouped[0]?.[0] ?? '';
  }, [grouped, selectedType]);

  const activeItems = useMemo(() => {
    return grouped.find(([name]) => name === activeName)?.[1] ?? [];
  }, [grouped, activeName]);

  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = activeItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const columns = useMemo(() => {
    const set = new Set<string>();
    for (const item of slice) {
      for (const k of Object.keys(item.mesg)) {
        if (item.mesg[k] != null) set.add(k);
      }
    }
    return Array.from(set);
  }, [slice]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col h-[560px]">
      <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-2 bg-slate-900">
        {grouped.map(([name, list]) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setSelectedType(name);
              setPage(0);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              name === activeName
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800/80 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {name} <span className="text-slate-500">({list.length})</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {slice.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Нет сообщений выбранного типа.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="sticky top-0 bg-slate-950/95 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2 font-medium text-slate-500">#</th>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-medium whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {slice.map((item, idx) => (
                <tr key={safePage * PAGE_SIZE + idx} className="hover:bg-slate-800/40">
                  <td className="px-3 py-1.5 text-slate-500 whitespace-nowrap">
                    {safePage * PAGE_SIZE + idx}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-1.5 text-slate-200 whitespace-nowrap max-w-[260px] truncate"
                      title={formatFitValue(item.mesg[col])}
                    >
                      {item.mesg[col] != null ? formatFitValue(item.mesg[col]) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 bg-slate-900">
          <span>
            Показано {safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, activeItems.length)} из{' '}
            {activeItems.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
            >
              Назад
            </button>
            <span>
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
