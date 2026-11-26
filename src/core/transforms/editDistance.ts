import { Profile } from '@garmin/fitsdk';
import { cloneEntries } from '../fit/codec';
import { computeTrackSummary } from '../fit/summary';
import type {
  AverageSpeedTimeBase,
  FitEntry,
  SpeedPolicyOnDistanceEdit,
} from '../fit/types';
import { applyAverageSpeed } from './editSpeed';
import { stripChannels } from './stripChannels';

export interface EditDistanceOptions {
  targetDistanceMeters: number;
  speedPolicy: SpeedPolicyOnDistanceEdit;
  timeBase?: AverageSpeedTimeBase;
  syncDistanceCurve?: boolean;
}

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Updates total distance across record, lap, and session messages,
 * and adjusts speed according to the chosen policy.
 */
export function editTotalDistance(
  entries: FitEntry[],
  options: EditDistanceOptions,
): FitEntry[] {
  const target = Math.max(0, options.targetDistanceMeters);
  const summary = computeTrackSummary(entries);
  const currentTotal = summary.totalDistance;
  const ratio =
    currentTotal != null && currentTotal > 0 ? target / currentTotal : null;

  let next = cloneEntries(entries);
  const records = next.filter((e) => e.mesgNum === Profile.MesgNum.RECORD);
  const laps = next.filter((e) => e.mesgNum === Profile.MesgNum.LAP);
  const sessions = next.filter((e) => e.mesgNum === Profile.MesgNum.SESSION);

  const firstRawTs = records[0]?.mesg.timestamp;
  const firstTs = firstRawTs instanceof Date ? firstRawTs.getTime() : null;
  const lastRawTs = records[records.length - 1]?.mesg.timestamp;
  const lastTs = lastRawTs instanceof Date ? lastRawTs.getTime() : null;
  const spanMs =
    firstTs != null && lastTs != null && lastTs > firstTs
      ? lastTs - firstTs
      : null;

  // 1. Update record.distance (scale proportionally if available, else distribute linearly)
  let hasRecordDistances = false;
  for (const r of records) {
    if (asNumber(r.mesg.distance) != null) {
      hasRecordDistances = true;
      break;
    }
  }

  for (let i = 0; i < records.length; i++) {
    const m = records[i].mesg;
    const prevDist = asNumber(m.distance);
    if (hasRecordDistances && ratio != null && prevDist != null) {
      m.distance = Number((prevDist * ratio).toFixed(2));
    } else if (!hasRecordDistances || ratio == null) {
      let progress = 0;
      if (spanMs != null && m.timestamp instanceof Date) {
        progress = Math.max(0, Math.min(1, (m.timestamp.getTime() - firstTs!) / spanMs));
      } else if (records.length > 1) {
        progress = i / (records.length - 1);
      }
      m.distance = Number((target * progress).toFixed(2));
    }
  }

  // 2. Update lap.totalDistance
  if (laps.length > 0) {
    const sumLapDist = laps.reduce(
      (acc, l) => acc + (asNumber(l.mesg.totalDistance) ?? 0),
      0,
    );
    const sumLapTime = laps.reduce(
      (acc, l) =>
        acc +
        (asNumber(l.mesg.totalTimerTime) ??
          asNumber(l.mesg.totalElapsedTime) ??
          0),
      0,
    );

    for (const lap of laps) {
      const prevLapDist = asNumber(lap.mesg.totalDistance);
      if (sumLapDist > 0 && prevLapDist != null) {
        lap.mesg.totalDistance = Number(((prevLapDist / sumLapDist) * target).toFixed(2));
      } else if (sumLapTime > 0) {
        const lt =
          asNumber(lap.mesg.totalTimerTime) ??
          asNumber(lap.mesg.totalElapsedTime) ??
          0;
        lap.mesg.totalDistance = Number(((lt / sumLapTime) * target).toFixed(2));
      } else {
        lap.mesg.totalDistance = Number((target / laps.length).toFixed(2));
      }
    }
  }

  // 3. Update session.totalDistance
  if (sessions.length > 0) {
    const sumSessDist = sessions.reduce(
      (acc, s) => acc + (asNumber(s.mesg.totalDistance) ?? 0),
      0,
    );
    for (const sess of sessions) {
      const prevSessDist = asNumber(sess.mesg.totalDistance);
      if (sessions.length === 1) {
        sess.mesg.totalDistance = Number(target.toFixed(2));
      } else if (sumSessDist > 0 && prevSessDist != null) {
        sess.mesg.totalDistance = Number(((prevSessDist / sumSessDist) * target).toFixed(2));
      } else {
        sess.mesg.totalDistance = Number((target / sessions.length).toFixed(2));
      }
    }
  }

  // 4. Apply speed policy
  switch (options.speedPolicy) {
    case 'scale': {
      if (ratio != null) {
        for (const r of records) {
          const sp = asNumber(r.mesg.speed);
          const esp = asNumber(r.mesg.enhancedSpeed);
          if (esp != null) {
            r.mesg.enhancedSpeed = Number((esp * ratio).toFixed(3));
          }
          if (sp != null) {
            const scaled = Number((sp * ratio).toFixed(3));
            if (scaled <= 65.5) r.mesg.speed = scaled;
            else delete r.mesg.speed;
          }
        }
        for (const entry of [...laps, ...sessions]) {
          for (const f of ['avgSpeed', 'maxSpeed', 'enhancedAvgSpeed', 'enhancedMaxSpeed']) {
            const val = asNumber(entry.mesg[f]);
            if (val != null) {
              const scaled = Number((val * ratio).toFixed(3));
              if ((f === 'avgSpeed' || f === 'maxSpeed') && scaled > 65.5) {
                delete entry.mesg[f];
              } else {
                entry.mesg[f] = scaled;
              }
            }
          }
        }
      }
      break;
    }
    case 'average': {
      next = applyAverageSpeed(next, {
        timeBase: options.timeBase ?? 'timer',
        syncDistanceCurve: options.syncDistanceCurve ?? false,
      });
      break;
    }
    case 'strip': {
      next = stripChannels(next, ['speed']);
      break;
    }
    case 'keep':
      break;
  }

  return next;
}

/**
 * Strips distance from record, lap, and session messages.
 */
export function stripDistance(entries: FitEntry[]): FitEntry[] {
  const next = cloneEntries(entries);
  for (const entry of next) {
    if (entry.mesgNum === Profile.MesgNum.RECORD) {
      delete entry.mesg.distance;
    } else if (
      entry.mesgNum === Profile.MesgNum.LAP ||
      entry.mesgNum === Profile.MesgNum.SESSION
    ) {
      delete entry.mesg.totalDistance;
    }
  }
  return next;
}
