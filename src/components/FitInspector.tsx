import { useMemo, useState } from 'react';
import { Profile } from '@garmin/fitsdk';
import { Search } from 'lucide-react';
import { useTrackStore } from '../store/useTrackStore';
import { formatFitValue } from '../utils/format';

const PAGE_SIZE = 50;

const profileMessages = Profile.messages as Record<
  number,
  { name?: string; fields?: Record<number, { name: string }> }
>;

export function FitInspector() {
  const entries = useTrackStore((s) => s.entries);
  const [selectedType, setSelectedType] = useState<string>('session');
  const [hideUnsetFields, setHideUnsetFields] = useState<boolean>(false);
  const [fieldQuery, setFieldQuery] = useState<string>('');
  const [page, setPage] = useState(0);

  const grouped = useMemo(() => {
    const map = new Map<string, { mesgNum: number; items: typeof entries }>();
    for (const e of entries) {
      const existing = map.get(e.mesgName);
      if (existing) {
        existing.items.push(e);
      } else {
        map.set(e.mesgName, { mesgNum: e.mesgNum, items: [e] });
      }
    }
    return Array.from(map.entries()).sort(
      (a, b) => b[1].items.length - a[1].items.length,
    );
  }, [entries]);

  const activeGroup = useMemo(() => {
    return (
      grouped.find(([name]) => name === selectedType) ??
      grouped.find(([name]) => name === 'session') ??
      grouped[0] ??
      null
    );
  }, [grouped, selectedType]);

  const activeName = activeGroup?.[0] ?? '';
  const activeMesgNum = activeGroup?.[1].mesgNum ?? null;
  const activeItems = activeGroup?.[1].items ?? [];

  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = activeItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const { columns, populatedSet, totalProfileFields } = useMemo(() => {
    const populated = new Set<string>();
    for (const item of activeItems) {
      for (const [k, v] of Object.entries(item.mesg)) {
        if (v != null) populated.add(k);
      }
    }

    const profileFieldNames: string[] = [];
    if (activeMesgNum != null && profileMessages[activeMesgNum]?.fields) {
      const seen = new Set<string>();
      for (const f of Object.values(profileMessages[activeMesgNum].fields!)) {
        if (f?.name && !seen.has(f.name)) {
          seen.add(f.name);
          profileFieldNames.push(f.name);
        }
      }
    }

    // Populated fields first, then unset FIT Profile fields
    const populatedList = Array.from(populated);
    const unsetList = hideUnsetFields
      ? []
      : profileFieldNames.filter((name) => !populated.has(name));

    const query = fieldQuery.trim().toLowerCase();
    const combined = [...populatedList, ...unsetList];
    const filtered = query
      ? combined.filter((col) => col.toLowerCase().includes(query))
      : combined;

    return {
      columns: filtered,
      populatedSet: populated,
      totalProfileFields: profileFieldNames.length,
    };
  }, [activeItems, activeMesgNum, hideUnsetFields, fieldQuery]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col h-[580px]">
      {/* Message Type Tabs */}
      <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-2 bg-slate-900">
        {grouped.map(([name, group]) => (
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
            {name} <span className="text-slate-500">({group.items.length})</span>
          </button>
        ))}
      </div>

      {/* Field Filter & Unset Toggle */}
      <div className="border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={fieldQuery}
            onChange={(e) => setFieldQuery(e.target.value)}
            placeholder="Поиск поля (например, calories, speed)…"
            className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-slate-500">
            Задано: <span className="text-slate-300">{populatedSet.size}</span>
            {totalProfileFields > 0 && (
              <> / {totalProfileFields} в FIT Profile</>
            )}
          </span>

          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideUnsetFields}
              onChange={(e) => setHideUnsetFields(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-sky-500 cursor-pointer"
            />
            <span>Скрыть незаданные поля</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {slice.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Нет сообщений выбранного типа.
          </div>
        ) : columns.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Нет полей, подходящих под фильтр «{fieldQuery}».
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="sticky top-0 bg-slate-950/95 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2 font-medium text-slate-500">#</th>
                {columns.map((col) => {
                  const isPopulated = populatedSet.has(col);
                  return (
                    <th
                      key={col}
                      className={`px-3 py-2 font-medium whitespace-nowrap ${
                        isPopulated ? 'text-slate-300' : 'text-slate-600 italic'
                      }`}
                      title={
                        isPopulated
                          ? `${col} (задано в файле)`
                          : `${col} (не задано в файле)`
                      }
                    >
                      {col}
                    </th>
                  );
                })}
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
                      title={
                        item.mesg[col] != null
                          ? formatFitValue(item.mesg[col])
                          : 'не задано'
                      }
                    >
                      {item.mesg[col] != null ? (
                        formatFitValue(item.mesg[col])
                      ) : (
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
