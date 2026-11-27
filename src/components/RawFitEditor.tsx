import { useMemo, useState } from 'react';
import { Profile } from '@garmin/fitsdk';
import {
  Check,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useTrackStore } from '../store/useTrackStore';
import { formatFitValue } from '../utils/format';

const PAGE_SIZE = 50;

interface ProfileFieldMeta {
  name: string;
  type: string;
  baseType: string;
  units?: string;
  array?: boolean;
}

const profileMessages = Profile.messages as Record<
  number,
  { name?: string; fields?: Record<number, ProfileFieldMeta> }
>;

const profileTypes = Profile.types as Record<string, Record<string, string>>;

const NUMERIC_TYPES = new Set([
  'sint8',
  'uint8',
  'uint8z',
  'sint16',
  'uint16',
  'uint16z',
  'sint32',
  'uint32',
  'uint32z',
  'sint64',
  'uint64',
  'uint64z',
  'float32',
  'float64',
  'byte',
]);

function getFieldMetaMap(mesgNum: number | null): Map<string, ProfileFieldMeta> {
  const map = new Map<string, ProfileFieldMeta>();
  if (mesgNum == null || !profileMessages[mesgNum]?.fields) return map;
  for (const f of Object.values(profileMessages[mesgNum].fields!)) {
    if (f?.name && !map.has(f.name)) {
      map.set(f.name, f);
    }
  }
  return map;
}

function getEnumOptions(meta: ProfileFieldMeta | undefined): string[] | null {
  if (!meta) return null;
  const enumObj = profileTypes[meta.type];
  if (!enumObj) return null;
  return Array.from(new Set(Object.values(enumObj)));
}

function isNumericMeta(meta: ProfileFieldMeta | undefined): boolean {
  if (!meta) return false;
  return NUMERIC_TYPES.has(meta.type);
}

function parseInputValue(
  rawText: string,
  meta: ProfileFieldMeta | undefined,
): { ok: true; value: unknown } | { ok: false } {
  const trimmed = rawText.trim();
  if (trimmed === '') return { ok: true, value: undefined };

  if (meta?.type === 'dateTime') {
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return { ok: false };
    return { ok: true, value: d };
  }

  if (getEnumOptions(meta)) {
    return { ok: true, value: trimmed };
  }

  if (isNumericMeta(meta)) {
    const num = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(num)) return { ok: false };
    return { ok: true, value: num };
  }

  if (!meta) {
    const num = Number(trimmed);
    if (trimmed !== '' && Number.isFinite(num)) return { ok: true, value: num };
  }

  return { ok: true, value: trimmed };
}

export function RawFitEditor() {
  const { t } = useI18n();
  const entries = useTrackStore((s) => s.entries);
  const setRawFieldAction = useTrackStore((s) => s.setRawFieldAction);
  const bulkDeleteFieldAction = useTrackStore((s) => s.bulkDeleteFieldAction);
  const bulkFillFieldAction = useTrackStore((s) => s.bulkFillFieldAction);
  const bulkScaleFieldAction = useTrackStore((s) => s.bulkScaleFieldAction);
  const recalculateSummaryAction = useTrackStore((s) => s.recalculateSummaryAction);

  const [selectedType, setSelectedType] = useState<string>('session');
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [hideUnsetFields, setHideUnsetFields] = useState<boolean>(false);
  const [fieldQuery, setFieldQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<string>('');
  const [draftError, setDraftError] = useState<boolean>(false);

  const [bulkColumn, setBulkColumn] = useState<string | null>(null);
  const [bulkInput, setBulkInput] = useState<string>('');

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { mesgNum: number; items: { entryIndex: number; entry: (typeof entries)[number] }[] }
    >();
    entries.forEach((entry, entryIndex) => {
      const existing = map.get(entry.mesgName);
      if (existing) {
        existing.items.push({ entryIndex, entry });
      } else {
        map.set(entry.mesgName, {
          mesgNum: entry.mesgNum,
          items: [{ entryIndex, entry }],
        });
      }
    });
    return Array.from(map.entries()).sort((a, b) => {
      const priority = (n: string) =>
        n === 'session' ? 0 : n === 'lap' ? 1 : n === 'record' ? 2 : n === 'file_id' ? 3 : 4;
      const pa = priority(a[0]);
      const pb = priority(b[0]);
      if (pa !== pb) return pa - pb;
      return b[1].items.length - a[1].items.length;
    });
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
  const isTableMode = activeName === 'record' || activeName === 'hrv' || activeItems.length > 25;

  const fieldMetaMap = useMemo(() => getFieldMetaMap(activeMesgNum), [activeMesgNum]);

  const { columns, populatedSet, totalProfileFields } = useMemo(() => {
    const populated = new Set<string>();
    for (const item of activeItems) {
      for (const [k, v] of Object.entries(item.entry.mesg)) {
        if (v != null) populated.add(k);
      }
    }

    const profileNames = Array.from(fieldMetaMap.keys());
    const populatedList = Array.from(populated);
    const unsetList = hideUnsetFields
      ? []
      : profileNames.filter((name) => !populated.has(name));

    const query = fieldQuery.trim().toLowerCase();
    const combined = [...populatedList, ...unsetList];
    const filtered = query
      ? combined.filter((col) => col.toLowerCase().includes(query))
      : combined;

    return {
      columns: filtered,
      populatedSet: populated,
      totalProfileFields: profileNames.length,
    };
  }, [activeItems, fieldMetaMap, hideUnsetFields, fieldQuery]);

  const startEdit = (key: string, currentVal: unknown) => {
    setEditingKey(key);
    setDraftError(false);
    if (currentVal == null) {
      setDraftValue('');
    } else if (currentVal instanceof Date) {
      setDraftValue(currentVal.toISOString());
    } else {
      setDraftValue(String(currentVal));
    }
  };

  const commitEdit = (entryIndex: number, fieldName: string) => {
    const meta = fieldMetaMap.get(fieldName);
    const parsed = parseInputValue(draftValue, meta);
    if (!parsed.ok) {
      setDraftError(true);
      return;
    }
    setRawFieldAction(entryIndex, activeName, fieldName, parsed.value);
    setEditingKey(null);
    setDraftError(false);
  };

  const safeItemIdx = Math.min(selectedItemIdx, Math.max(0, activeItems.length - 1));
  const currentItem = activeItems[safeItemIdx] ?? null;

  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = activeItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col min-h-[640px]">
      {/* Message Type Tabs */}
      <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          {grouped.map(([name, group]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setSelectedType(name);
                setSelectedItemIdx(0);
                setPage(0);
                setEditingKey(null);
                setBulkColumn(null);
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

        <button
          type="button"
          onClick={recalculateSummaryAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          title={t('raw.recalcTooltip')}
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          {t('raw.recalcButton')}
        </button>
      </div>

      {/* Filter & Unset Toggle Bar */}
      <div className="border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={fieldQuery}
            onChange={(e) => setFieldQuery(e.target.value)}
            placeholder={t('raw.searchPlaceholder')}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-mono text-slate-500">
            {totalProfileFields > 0
              ? t('raw.populatedCounter', {
                  set: populatedSet.size,
                  total: totalProfileFields,
                })
              : t('raw.populatedCounterShort', { set: populatedSet.size })}
          </span>

          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideUnsetFields}
              onChange={(e) => setHideUnsetFields(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-sky-500 cursor-pointer"
            />
            <span>{t('raw.hideUnset')}</span>
          </label>
        </div>
      </div>

      {/* Bulk Column Bar (Table Mode) */}
      {isTableMode && bulkColumn && activeMesgNum != null && (
        <div className="border-b border-sky-500/30 bg-sky-500/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-sky-200">
            {t('raw.bulkColumnInfo', {
              column: bulkColumn,
              count: activeItems.length,
              mesg: activeName,
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={t('raw.bulkPlaceholder')}
              className="w-40 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-400"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = parseInputValue(bulkInput, fieldMetaMap.get(bulkColumn));
                if (parsed.ok && parsed.value !== undefined) {
                  bulkFillFieldAction(activeMesgNum, activeName, bulkColumn, parsed.value);
                  setBulkColumn(null);
                  setBulkInput('');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              {t('raw.bulkFill')}
            </button>
            {isNumericMeta(fieldMetaMap.get(bulkColumn)) && (
              <button
                type="button"
                onClick={() => {
                  const factor = Number(bulkInput.replace(',', '.'));
                  if (Number.isFinite(factor)) {
                    bulkScaleFieldAction(activeMesgNum, activeName, bulkColumn, factor);
                    setBulkColumn(null);
                    setBulkInput('');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              >
                {t('raw.bulkMultiply')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                bulkDeleteFieldAction(activeMesgNum, activeName, bulkColumn);
                setBulkColumn(null);
                setBulkInput('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              {t('raw.bulkDelete')}
            </button>
            <button
              type="button"
              onClick={() => setBulkColumn(null)}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mode A: Vertical Key-Value Editor */}
      {!isTableMode && currentItem && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeItems.length > 1 && (
            <div className="border-b border-slate-800/80 px-4 py-2 flex items-center gap-1.5 bg-slate-900/50 overflow-x-auto">
              <span className="text-[11px] text-slate-500 mr-1">
                {t('raw.itemSelector')}
              </span>
              {activeItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedItemIdx(idx);
                    setEditingKey(null);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    idx === safeItemIdx
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  #{idx}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {columns.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t('raw.noMatchingFields', { query: fieldQuery })}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="sticky top-0 bg-slate-950/95 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2 font-medium w-[260px]">
                      {t('raw.colField')}
                    </th>
                    <th className="px-3 py-2 font-medium w-[150px]">
                      {t('raw.colType')}
                    </th>
                    <th className="px-4 py-2 font-medium">{t('raw.colValue')}</th>
                    <th className="px-3 py-2 font-medium w-[90px] text-right">
                      {t('raw.colAction')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {columns.map((col) => {
                    const meta = fieldMetaMap.get(col);
                    const val = currentItem.entry.mesg[col];
                    const isSet = val != null;
                    const rowKey = `${currentItem.entryIndex}:${col}`;
                    const isEditing = editingKey === rowKey;
                    const enumOpts = getEnumOptions(meta);

                    return (
                      <tr
                        key={col}
                        className={`hover:bg-slate-800/35 ${
                          isSet ? '' : 'bg-slate-950/20'
                        }`}
                      >
                        <td
                          className={`px-4 py-2 whitespace-nowrap ${
                            isSet ? 'text-slate-200 font-medium' : 'text-slate-500 italic'
                          }`}
                        >
                          {col}
                        </td>
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                          {meta ? (
                            <>
                              <span>{meta.type}</span>
                              {meta.units && (
                                <span className="text-slate-400"> · {meta.units}</span>
                              )}
                            </>
                          ) : (
                            'custom'
                          )}
                        </td>
                        <td className="px-4 py-1.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              {enumOpts ? (
                                <select
                                  autoFocus
                                  value={draftValue}
                                  onChange={(e) => setDraftValue(e.target.value)}
                                  className="rounded-lg bg-slate-950 border border-sky-500 px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none"
                                >
                                  <option value="">{t('raw.deleteOption')}</option>
                                  {enumOpts.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  autoFocus
                                  type="text"
                                  value={draftValue}
                                  onChange={(e) => {
                                    setDraftValue(e.target.value);
                                    setDraftError(false);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      commitEdit(currentItem.entryIndex, col);
                                    } else if (e.key === 'Escape') {
                                      setEditingKey(null);
                                    }
                                  }}
                                  placeholder={
                                    meta?.type === 'dateTime'
                                      ? '2026-05-10T08:00:00.000Z'
                                      : t('raw.enterValue')
                                  }
                                  className={`w-full max-w-sm rounded-lg bg-slate-950 border px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none ${
                                    draftError ? 'border-rose-500' : 'border-sky-500'
                                  }`}
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => commitEdit(currentItem.entryIndex, col)}
                                className="p-1 rounded bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                                title={t('common.save')}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKey(null)}
                                className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                                title={t('common.cancel')}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(rowKey, val)}
                              className="group inline-flex items-center gap-2 text-left hover:text-sky-300 transition-colors cursor-pointer"
                            >
                              {isSet ? (
                                <span className="text-slate-100">
                                  {formatFitValue(val)}
                                </span>
                              ) : (
                                <span className="text-slate-600 group-hover:text-sky-400">
                                  {t('raw.addValue')}
                                </span>
                              )}
                              <Pencil className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {isSet && (
                            <button
                              type="button"
                              onClick={() =>
                                setRawFieldAction(
                                  currentItem.entryIndex,
                                  activeName,
                                  col,
                                  undefined,
                                )
                              }
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title={t('raw.deleteFieldTooltip', { field: col })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Mode B: Paginated Inline Table */}
      {isTableMode && (
        <>
          <div className="flex-1 overflow-auto">
            {pageSlice.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t('raw.noMessages')}
              </div>
            ) : columns.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t('raw.noMatchingFields', { query: fieldQuery })}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="sticky top-0 bg-slate-950/95 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium text-slate-500">#</th>
                    {columns.map((col) => {
                      const isPopulated = populatedSet.has(col);
                      const isBulkSelected = bulkColumn === col;
                      return (
                        <th
                          key={col}
                          className={`px-3 py-2 font-medium whitespace-nowrap ${
                            isBulkSelected
                              ? 'bg-sky-500/20 text-sky-200'
                              : isPopulated
                                ? 'text-slate-300'
                                : 'text-slate-600 italic'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setBulkColumn(isBulkSelected ? null : col);
                              setBulkInput('');
                            }}
                            className="hover:text-sky-300 cursor-pointer"
                            title={t('raw.colHeaderTooltip')}
                          >
                            {col}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pageSlice.map((item, idx) => (
                    <tr key={item.entryIndex} className="hover:bg-slate-800/40">
                      <td className="px-3 py-1.5 text-slate-500 whitespace-nowrap">
                        {safePage * PAGE_SIZE + idx}
                      </td>
                      {columns.map((col) => {
                        const cellKey = `${item.entryIndex}:${col}`;
                        const isEditing = editingKey === cellKey;
                        const val = item.entry.mesg[col];
                        return (
                          <td
                            key={col}
                            className="px-3 py-1 text-slate-200 whitespace-nowrap max-w-[240px]"
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={draftValue}
                                onChange={(e) => {
                                  setDraftValue(e.target.value);
                                  setDraftError(false);
                                }}
                                onBlur={() => commitEdit(item.entryIndex, col)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    commitEdit(item.entryIndex, col);
                                  } else if (e.key === 'Escape') {
                                    setEditingKey(null);
                                  }
                                }}
                                className={`w-28 rounded bg-slate-950 border px-1.5 py-0.5 text-xs font-mono text-slate-100 focus:outline-none ${
                                  draftError ? 'border-rose-500' : 'border-sky-500'
                                }`}
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(cellKey, val)}
                                className="w-full text-left truncate hover:text-sky-300 cursor-pointer"
                                title={t('raw.cellTooltip')}
                              >
                                {val != null ? (
                                  formatFitValue(val)
                                ) : (
                                  <span className="text-slate-700">—</span>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 bg-slate-900">
              <span>
                {t('raw.pagination', {
                  from: safePage * PAGE_SIZE + 1,
                  to: Math.min((safePage + 1) * PAGE_SIZE, activeItems.length),
                  total: activeItems.length,
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                >
                  {t('common.back')}
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
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
