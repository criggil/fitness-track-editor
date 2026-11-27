import { create } from 'zustand';
import { translate } from '../i18n';
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
  convertToIndoor,
  type ConvertToIndoorOptions,
} from '../core/transforms/convertToIndoor';
import {
  editActivityType,
  type EditActivityTypeOptions,
} from '../core/transforms/editActivityType';
import { setTotalCalories, stripCalories } from '../core/transforms/editCalories';
import {
  editTotalDistance,
  stripDistance,
  type EditDistanceOptions,
} from '../core/transforms/editDistance';
import {
  applyAverageSpeed,
  type AverageSpeedOptions,
} from '../core/transforms/editSpeed';
import {
  bulkDeleteField,
  bulkFillField,
  bulkScaleField,
  setEntryField,
} from '../core/transforms/rawEdit';
import { recalculateSummaryFromRecords } from '../core/transforms/recalculateSummary';
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

  // Scenarios
  stripChannel: (channel: ChannelKey) => void;
  stripMultipleChannels: (channels: ChannelKey[]) => void;
  applyAverageSpeedAction: (options: AverageSpeedOptions) => void;
  editDistanceAction: (options: EditDistanceOptions) => void;
  stripDistanceAction: () => void;
  editActivityTypeAction: (options: EditActivityTypeOptions) => void;
  setCaloriesAction: (kcal: number) => void;
  stripCaloriesAction: () => void;
  convertToIndoorAction: (options: ConvertToIndoorOptions) => void;
  recalculateSummaryAction: () => void;

  // Raw FIT Editor
  setRawFieldAction: (
    entryIndex: number,
    mesgName: string,
    fieldName: string,
    value: unknown,
  ) => void;
  bulkDeleteFieldAction: (
    mesgNum: number,
    mesgName: string,
    fieldName: string,
  ) => void;
  bulkFillFieldAction: (
    mesgNum: number,
    mesgName: string,
    fieldName: string,
    value: unknown,
  ) => void;
  bulkScaleFieldAction: (
    mesgNum: number,
    mesgName: string,
    fieldName: string,
    factor: number,
  ) => void;

  // History & UI
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
  hrv: 'HRV',
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
            : translate('store.decodeError'),
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
    set(
      commitEntries(
        state,
        next,
        translate('store.stripChannel', { channel: CHANNEL_LABELS[channel] }),
      ),
    );
  },

  stripMultipleChannels: (channels) => {
    const state = get();
    if (!state.doc || channels.length === 0) return;
    const next = stripChannels(state.entries, channels);
    const label = translate('store.stripMultiple', {
      channels: channels.map((c) => CHANNEL_LABELS[c]).join(', '),
    });
    set(commitEntries(state, next, label));
  },

  applyAverageSpeedAction: (options) => {
    const state = get();
    if (!state.doc) return;
    const next = applyAverageSpeed(state.entries, options);
    set(commitEntries(state, next, translate('store.avgSpeed')));
  },

  editDistanceAction: (options) => {
    const state = get();
    if (!state.doc) return;
    const next = editTotalDistance(state.entries, options);
    const km = (options.targetDistanceMeters / 1000).toFixed(2);
    set(commitEntries(state, next, translate('store.editDistance', { km })));
  },

  stripDistanceAction: () => {
    const state = get();
    if (!state.doc) return;
    const next = stripDistance(state.entries);
    set(commitEntries(state, next, translate('store.stripDistance')));
  },

  editActivityTypeAction: (options) => {
    const state = get();
    if (!state.doc) return;
    const next = editActivityType(state.entries, options);
    const label =
      options.subSport && options.subSport !== 'generic'
        ? translate('store.activityTypeSub', {
            sport: options.sport,
            subSport: options.subSport,
          })
        : translate('store.activityType', { sport: options.sport });
    set(commitEntries(state, next, label));
  },

  setCaloriesAction: (kcal) => {
    const state = get();
    if (!state.doc) return;
    const next = setTotalCalories(state.entries, kcal);
    set(
      commitEntries(
        state,
        next,
        translate('store.setCalories', { kcal: Math.round(kcal) }),
      ),
    );
  },

  stripCaloriesAction: () => {
    const state = get();
    if (!state.doc) return;
    const next = stripCalories(state.entries);
    set(commitEntries(state, next, translate('store.stripCalories')));
  },

  convertToIndoorAction: (options) => {
    const state = get();
    if (!state.doc) return;
    const next = convertToIndoor(state.entries, options);
    const label =
      options.mode === 'treadmill'
        ? translate('store.indoorTreadmill')
        : translate('store.indoorCycling');
    set(commitEntries(state, next, label));
  },

  recalculateSummaryAction: () => {
    const state = get();
    if (!state.doc) return;
    const next = recalculateSummaryFromRecords(state.entries);
    set(commitEntries(state, next, translate('store.recalcSummary')));
  },

  setRawFieldAction: (entryIndex, mesgName, fieldName, value) => {
    const state = get();
    if (!state.doc) return;
    const next = setEntryField(state.entries, entryIndex, fieldName, value);
    const label =
      value === undefined || value === null || value === ''
        ? translate('store.rawDelete', { mesg: mesgName, field: fieldName })
        : translate('store.rawEdit', { mesg: mesgName, field: fieldName });
    set(commitEntries(state, next, label));
  },

  bulkDeleteFieldAction: (mesgNum, mesgName, fieldName) => {
    const state = get();
    if (!state.doc) return;
    const next = bulkDeleteField(state.entries, mesgNum, fieldName);
    set(
      commitEntries(
        state,
        next,
        translate('store.bulkDelete', { mesg: mesgName, field: fieldName }),
      ),
    );
  },

  bulkFillFieldAction: (mesgNum, mesgName, fieldName, value) => {
    const state = get();
    if (!state.doc) return;
    const next = bulkFillField(state.entries, mesgNum, fieldName, value);
    set(
      commitEntries(
        state,
        next,
        translate('store.bulkFill', { mesg: mesgName, field: fieldName }),
      ),
    );
  },

  bulkScaleFieldAction: (mesgNum, mesgName, fieldName, factor) => {
    const state = get();
    if (!state.doc) return;
    const next = bulkScaleField(state.entries, mesgNum, fieldName, factor);
    set(
      commitEntries(
        state,
        next,
        translate('store.bulkScale', { mesg: mesgName, field: fieldName, factor }),
      ),
    );
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
      lastActionLabel: translate('store.undo', { label: prev.label }),
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
      lastActionLabel: translate('store.redo', { label: nextItem.label }),
    });
  },

  resetToOriginal: () => {
    const state = get();
    if (!state.doc || state.past.length === 0) return;
    const restored = cloneEntries(state.originalEntries);
    set(commitEntries(state, restored, translate('store.reset')));
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
