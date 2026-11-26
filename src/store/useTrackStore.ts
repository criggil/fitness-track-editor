import { create } from 'zustand';
import { cloneEntries, decodeFit, encodeFit } from '../core/fit/codec';
import { createDemoFitBytes } from '../core/fit/demoTrack';
import { buildTrackProjection } from '../core/fit/projection';
import { computeTrackSummary } from '../core/fit/summary';
import type {
  ChannelKey,
  FitDocument,
  FitEntry,
  TrackProjection,
  TrackSummary,
} from '../core/fit/types';
import {
  editActivityType,
  type EditActivityTypeOptions,
} from '../core/transforms/editActivityType';
import {
  editTotalDistance,
  stripDistance,
  type EditDistanceOptions,
} from '../core/transforms/editDistance';
import {
  applyAverageSpeed,
  type AverageSpeedOptions,
} from '../core/transforms/editSpeed';
import { stripChannels } from '../core/transforms/stripChannels';

interface HistoryEntry {
  label: string;
  entries: FitEntry[];
}

interface TrackState {
  doc: FitDocument | null;
  originalEntries: FitEntry[];
  entries: FitEntry[];
  originalSummary: TrackSummary | null;
  summary: TrackSummary | null;
  projection: TrackProjection | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastActionLabel: string | null;
  hoverElapsedSec: number | null;
  error: string | null;
  exportWarnings: string[];

  loadBytes: (bytes: Uint8Array, fileName: string) => void;
  loadDemo: () => void;
  closeDocument: () => void;
  clearError: () => void;

  stripChannel: (channel: ChannelKey) => void;
  stripMultipleChannels: (channels: ChannelKey[]) => void;
  applyAverageSpeedAction: (options: AverageSpeedOptions) => void;
  editDistanceAction: (options: EditDistanceOptions) => void;
  stripDistanceAction: () => void;
  editActivityTypeAction: (options: EditActivityTypeOptions) => void;

  undo: () => void;
  redo: () => void;
  resetToOriginal: () => void;
  setHoverElapsedSec: (elapsedSec: number | null) => void;
  exportFit: () => { bytes: Uint8Array; fileName: string; warnings: string[] } | null;
}

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  gps: 'GPS',
  elevation: 'Elevation',
  speed: 'Speed',
  heartRate: 'Heart Rate',
  power: 'Power',
  cadence: 'Cadence',
  temperature: 'Temperature',
};

function commitEntries(
  state: TrackState,
  nextEntries: FitEntry[],
  label: string,
): Partial<TrackState> {
  return {
    past: [...state.past, { label, entries: state.entries }],
    future: [],
    entries: nextEntries,
    summary: computeTrackSummary(nextEntries),
    projection: buildTrackProjection(nextEntries),
    lastActionLabel: label,
    exportWarnings: [],
  };
}

export const useTrackStore = create<TrackState>((set, get) => ({
  doc: null,
  originalEntries: [],
  entries: [],
  originalSummary: null,
  summary: null,
  projection: null,
  past: [],
  future: [],
  lastActionLabel: null,
  hoverElapsedSec: null,
  error: null,
  exportWarnings: [],

  loadBytes: (bytes, fileName) => {
    try {
      const doc = decodeFit(bytes, fileName);
      const originalEntries = cloneEntries(doc.entries);
      const summary = computeTrackSummary(doc.entries);
      const projection = buildTrackProjection(doc.entries);
      set({
        doc,
        originalEntries,
        entries: doc.entries,
        originalSummary: summary,
        summary,
        projection,
        past: [],
        future: [],
        lastActionLabel: null,
        hoverElapsedSec: null,
        error: null,
        exportWarnings: doc.warnings,
      });
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : 'Не удалось прочитать .fit файл.',
      });
    }
  },

  loadDemo: () => {
    const bytes = createDemoFitBytes({ pointCount: 600 });
    get().loadBytes(bytes, 'demo-wahoo-ride.fit');
  },

  closeDocument: () =>
    set({
      doc: null,
      originalEntries: [],
      entries: [],
      originalSummary: null,
      summary: null,
      projection: null,
      past: [],
      future: [],
      lastActionLabel: null,
      hoverElapsedSec: null,
      error: null,
      exportWarnings: [],
    }),

  clearError: () => set({ error: null }),

  stripChannel: (channel) => {
    const state = get();
    if (!state.doc) return;
    const next = stripChannels(state.entries, [channel]);
    set(commitEntries(state, next, `Вырезан канал ${CHANNEL_LABELS[channel]}`));
  },

  stripMultipleChannels: (channels) => {
    const state = get();
    if (!state.doc || channels.length === 0) return;
    const next = stripChannels(state.entries, channels);
    const label = `Вырезаны каналы: ${channels.map((c) => CHANNEL_LABELS[c]).join(', ')}`;
    set(commitEntries(state, next, label));
  },

  applyAverageSpeedAction: (options) => {
    const state = get();
    if (!state.doc) return;
    const next = applyAverageSpeed(state.entries, options);
    set(commitEntries(state, next, 'Установлена средняя скорость по дистанции'));
  },

  editDistanceAction: (options) => {
    const state = get();
    if (!state.doc) return;
    const next = editTotalDistance(state.entries, options);
    const km = (options.targetDistanceMeters / 1000).toFixed(2);
    set(commitEntries(state, next, `Дистанция изменена на ${km} км`));
  },

  stripDistanceAction: () => {
    const state = get();
    if (!state.doc) return;
    const next = stripDistance(state.entries);
    set(commitEntries(state, next, 'Удалены поля дистанции'));
  },

  editActivityTypeAction: (options) => {
    const state = get();
    if (!state.doc) return;
    const next = editActivityType(state.entries, options);
    const label =
      options.subSport && options.subSport !== 'generic'
        ? `Тип активности: ${options.sport} (${options.subSport})`
        : `Тип активности: ${options.sport}`;
    set(commitEntries(state, next, label));
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const prev = state.past[state.past.length - 1];
    const nextPast = state.past.slice(0, -1);
    set({
      past: nextPast,
      future: [{ label: prev.label, entries: state.entries }, ...state.future],
      entries: prev.entries,
      summary: computeTrackSummary(prev.entries),
      projection: buildTrackProjection(prev.entries),
      lastActionLabel: `Отменено: ${prev.label}`,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const nextItem = state.future[0];
    const nextFuture = state.future.slice(1);
    set({
      past: [...state.past, { label: nextItem.label, entries: state.entries }],
      future: nextFuture,
      entries: nextItem.entries,
      summary: computeTrackSummary(nextItem.entries),
      projection: buildTrackProjection(nextItem.entries),
      lastActionLabel: `Повторено: ${nextItem.label}`,
    });
  },

  resetToOriginal: () => {
    const state = get();
    if (!state.doc || state.past.length === 0) return;
    const restored = cloneEntries(state.originalEntries);
    set(commitEntries(state, restored, 'Сброс к исходному файлу'));
  },

  setHoverElapsedSec: (elapsedSec) => set({ hoverElapsedSec: elapsedSec }),

  exportFit: () => {
    const state = get();
    if (!state.doc) return null;
    const { bytes, warnings } = encodeFit({
      entries: state.entries,
      developerFields: state.doc.developerFields,
    });
    const baseName = state.doc.fileName.replace(/\.fit$/i, '');
    set({ exportWarnings: warnings });
    return {
      bytes,
      fileName: `${baseName}.edited.fit`,
      warnings,
    };
  },
}));
