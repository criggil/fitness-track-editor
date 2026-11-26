import { Profile } from '@garmin/fitsdk';
import { cloneEntries } from '../fit/codec';
import { computeTrackSummary } from '../fit/summary';
import type { AverageSpeedTimeBase, FitEntry } from '../fit/types';

export interface AverageSpeedOptions {
  timeBase?: AverageSpeedTimeBase;
  /**
   * When true, also rewrites record.distance linearly along elapsed time so
   * platforms like Strava that compute speed from delta(distance)/delta(time)
   * also display a uniform average speed.
   */
  syncDistanceCurve?: boolean;
}

/**
 * Replaces all speed fields (record, lap, session) with a uniform average speed
 * calculated from totalDistance / duration.
 */
export function applyAverageSpeed(
  entries: FitEntry[],
  options: AverageSpeedOptions = {},
): FitEntry[] {
  const timeBase = options.timeBase ?? 'timer';
  const syncDistanceCurve = options.syncDistanceCurve ?? false;

  const summary = computeTrackSummary(entries);
  const totalDistance = summary.totalDistance;
  const durationSec =
    timeBase === 'elapsed'
      ? (summary.totalElapsedTime ?? summary.totalTimerTime)
      : (summary.totalTimerTime ?? summary.totalElapsedTime);

  if (
    totalDistance == null ||
    totalDistance < 0 ||
    durationSec == null ||
    durationSec <= 0
  ) {
    return cloneEntries(entries);
  }

  const avgSpeed = Number((totalDistance / durationSec).toFixed(3));
  const next = cloneEntries(entries);

  const records = next.filter((e) => e.mesgNum === Profile.MesgNum.RECORD);
  const firstRawTs = records[0]?.mesg.timestamp;
  const firstTs = firstRawTs instanceof Date ? firstRawTs.getTime() : null;
  const lastRawTs = records[records.length - 1]?.mesg.timestamp;
  const lastTs = lastRawTs instanceof Date ? lastRawTs.getTime() : null;
  const spanMs =
    firstTs != null && lastTs != null && lastTs > firstTs
      ? lastTs - firstTs
      : null;

  for (let i = 0; i < records.length; i++) {
    const m = records[i].mesg;
    m.enhancedSpeed = avgSpeed;
    // Standard uint16 speed in FIT supports up to ~65.535 m/s
    if (avgSpeed <= 65.5) {
      m.speed = avgSpeed;
    } else {
      delete m.speed;
    }

    if (syncDistanceCurve) {
      let progress = 0;
      if (spanMs != null && m.timestamp instanceof Date) {
        progress = Math.max(0, Math.min(1, (m.timestamp.getTime() - firstTs!) / spanMs));
      } else if (records.length > 1) {
        progress = i / (records.length - 1);
      }
      m.distance = Number((totalDistance * progress).toFixed(2));
    }
  }

  for (const entry of next) {
    if (
      entry.mesgNum === Profile.MesgNum.SESSION ||
      entry.mesgNum === Profile.MesgNum.LAP
    ) {
      entry.mesg.enhancedAvgSpeed = avgSpeed;
      entry.mesg.enhancedMaxSpeed = avgSpeed;
      if (avgSpeed <= 65.5) {
        entry.mesg.avgSpeed = avgSpeed;
        entry.mesg.maxSpeed = avgSpeed;
      } else {
        delete entry.mesg.avgSpeed;
        delete entry.mesg.maxSpeed;
      }
    }
  }

  return next;
}
