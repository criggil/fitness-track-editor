import { cloneEntries } from '../fit/codec';
import type { FitEntry } from '../fit/types';

/**
 * Sets or deletes a single field on a specific FitEntry by global index.
 */
export function setEntryField(
  entries: FitEntry[],
  entryIndex: number,
  fieldName: string,
  value: unknown,
): FitEntry[] {
  if (entryIndex < 0 || entryIndex >= entries.length) return cloneEntries(entries);
  const next = cloneEntries(entries);
  if (value === undefined || value === null || value === '') {
    delete next[entryIndex].mesg[fieldName];
  } else {
    next[entryIndex].mesg[fieldName] = value;
  }
  return next;
}

/**
 * Deletes a field across all messages of a given mesgNum.
 */
export function bulkDeleteField(
  entries: FitEntry[],
  mesgNum: number,
  fieldName: string,
): FitEntry[] {
  const next = cloneEntries(entries);
  for (const entry of next) {
    if (entry.mesgNum === mesgNum) {
      delete entry.mesg[fieldName];
    }
  }
  return next;
}

/**
 * Fills a field with a constant value across all messages of a given mesgNum.
 */
export function bulkFillField(
  entries: FitEntry[],
  mesgNum: number,
  fieldName: string,
  value: unknown,
): FitEntry[] {
  const next = cloneEntries(entries);
  for (const entry of next) {
    if (entry.mesgNum === mesgNum) {
      entry.mesg[fieldName] = value instanceof Date ? new Date(value.getTime()) : value;
    }
  }
  return next;
}

/**
 * Multiplies a numeric field by a constant factor across all messages of a given mesgNum.
 */
export function bulkScaleField(
  entries: FitEntry[],
  mesgNum: number,
  fieldName: string,
  factor: number,
): FitEntry[] {
  if (!Number.isFinite(factor)) return cloneEntries(entries);
  const next = cloneEntries(entries);
  for (const entry of next) {
    if (entry.mesgNum === mesgNum) {
      const val = entry.mesg[fieldName];
      if (typeof val === 'number' && Number.isFinite(val)) {
        entry.mesg[fieldName] = Number((val * factor).toFixed(3));
      }
    }
  }
  return next;
}
