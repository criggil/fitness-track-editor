import { Profile } from '@garmin/fitsdk';
import { cloneEntries } from '../fit/codec';
import type { FitEntry, FitMesgObject } from '../fit/types';

function asNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asTimeMs(v: unknown): number | null {
  return v instanceof Date && !Number.isNaN(v.getTime()) ? v.getTime() : null;
}

function recomputeAggregateInto(
  target: FitMesgObject,
  records: FitEntry[],
  isSession: boolean,
) {
  if (records.length === 0) return;

  let firstDist: number | null = null;
  let lastDist: number | null = null;

  let speedSum = 0;
  let speedCnt = 0;
  let maxSpeed = -Infinity;

  let altSum = 0;
  let altCnt = 0;
  let minAlt = Infinity;
  let maxAlt = -Infinity;
  let prevAlt: number | null = null;
  let ascent = 0;
  let descent = 0;

  let hrSum = 0;
  let hrCnt = 0;
  let maxHr = -Infinity;
  let minHr = Infinity;

  let pwrSum = 0;
  let pwrCnt = 0;
  let maxPwr = -Infinity;

  let cadSum = 0;
  let cadCnt = 0;
  let maxCad = -Infinity;

  let startLat: number | null = null;
  let startLon: number | null = null;
  let endLat: number | null = null;
  let endLon: number | null = null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const r of records) {
    const m = r.mesg;
    const d = asNum(m.distance);
    if (d != null) {
      if (firstDist == null) firstDist = d;
      lastDist = d;
    }

    const sp = asNum(m.enhancedSpeed) ?? asNum(m.speed);
    if (sp != null) {
      speedSum += sp;
      speedCnt += 1;
      if (sp > maxSpeed) maxSpeed = sp;
    }

    const alt = asNum(m.enhancedAltitude) ?? asNum(m.altitude);
    if (alt != null) {
      altSum += alt;
      altCnt += 1;
      if (alt < minAlt) minAlt = alt;
      if (alt > maxAlt) maxAlt = alt;
      if (prevAlt != null) {
        const delta = alt - prevAlt;
        if (delta > 0) ascent += delta;
        else descent += Math.abs(delta);
      }
      prevAlt = alt;
    }

    const hr = asNum(m.heartRate);
    if (hr != null) {
      hrSum += hr;
      hrCnt += 1;
      if (hr > maxHr) maxHr = hr;
      if (hr < minHr) minHr = hr;
    }

    const pw = asNum(m.power);
    if (pw != null) {
      pwrSum += pw;
      pwrCnt += 1;
      if (pw > maxPwr) maxPwr = pw;
    }

    const cad = asNum(m.cadence);
    if (cad != null) {
      cadSum += cad;
      cadCnt += 1;
      if (cad > maxCad) maxCad = cad;
    }

    const lat = asNum(m.positionLat);
    const lon = asNum(m.positionLong);
    if (lat != null && lon != null) {
      if (startLat == null) {
        startLat = lat;
        startLon = lon;
      }
      endLat = lat;
      endLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
  }

  // Distance
  if (lastDist != null) {
    const deltaDist = isSession ? lastDist : Math.max(0, lastDist - (firstDist ?? 0));
    target.totalDistance = Number(deltaDist.toFixed(2));
  } else {
    delete target.totalDistance;
  }

  // Speed
  if (speedCnt > 0) {
    const avgSp = Number((speedSum / speedCnt).toFixed(3));
    const maxSp = Number(maxSpeed.toFixed(3));
    target.enhancedAvgSpeed = avgSp;
    target.enhancedMaxSpeed = maxSp;
    if (avgSp <= 65.5) target.avgSpeed = avgSp;
    else delete target.avgSpeed;
    if (maxSp <= 65.5) target.maxSpeed = maxSp;
    else delete target.maxSpeed;
  } else {
    delete target.avgSpeed;
    delete target.maxSpeed;
    delete target.enhancedAvgSpeed;
    delete target.enhancedMaxSpeed;
  }

  // Elevation
  if (altCnt > 0) {
    const avgAlt = Number((altSum / altCnt).toFixed(1));
    target.totalAscent = Math.round(ascent);
    target.totalDescent = Math.round(descent);
    target.enhancedAvgAltitude = avgAlt;
    target.enhancedMinAltitude = Number(minAlt.toFixed(1));
    target.enhancedMaxAltitude = Number(maxAlt.toFixed(1));
    target.avgAltitude = avgAlt;
    target.minAltitude = Number(minAlt.toFixed(1));
    target.maxAltitude = Number(maxAlt.toFixed(1));
  } else {
    for (const f of [
      'totalAscent',
      'totalDescent',
      'avgAltitude',
      'minAltitude',
      'maxAltitude',
      'enhancedAvgAltitude',
      'enhancedMinAltitude',
      'enhancedMaxAltitude',
    ]) {
      delete target[f];
    }
  }

  // Heart Rate
  if (hrCnt > 0) {
    target.avgHeartRate = Math.round(hrSum / hrCnt);
    target.maxHeartRate = Math.round(maxHr);
    target.minHeartRate = Math.round(minHr);
  } else {
    delete target.avgHeartRate;
    delete target.maxHeartRate;
    delete target.minHeartRate;
  }

  // Power
  if (pwrCnt > 0) {
    target.avgPower = Math.round(pwrSum / pwrCnt);
    target.maxPower = Math.round(maxPwr);
  } else {
    delete target.avgPower;
    delete target.maxPower;
  }

  // Cadence
  if (cadCnt > 0) {
    target.avgCadence = Math.round(cadSum / cadCnt);
    target.maxCadence = Math.round(maxCad);
  } else {
    delete target.avgCadence;
    delete target.maxCadence;
  }

  // GPS bounds
  if (startLat != null && startLon != null && endLat != null && endLon != null) {
    target.startPositionLat = startLat;
    target.startPositionLong = startLon;
    if (!isSession) {
      target.endPositionLat = endLat;
      target.endPositionLong = endLon;
    } else {
      target.necLat = maxLat;
      target.necLong = maxLon;
      target.swcLat = minLat;
      target.swcLong = minLon;
    }
  } else {
    for (const f of [
      'startPositionLat',
      'startPositionLong',
      'endPositionLat',
      'endPositionLong',
      'necLat',
      'necLong',
      'swcLat',
      'swcLong',
    ]) {
      delete target[f];
    }
  }
}

/**
 * Recomputes session and lap summary fields directly from the current record messages.
 * Also removes stale summary fields for channels that no longer exist in records.
 */
export function recalculateSummaryFromRecords(entries: FitEntry[]): FitEntry[] {
  const next = cloneEntries(entries);
  const records = next.filter((e) => e.mesgNum === Profile.MesgNum.RECORD);
  if (records.length === 0) return next;

  const sessions = next.filter((e) => e.mesgNum === Profile.MesgNum.SESSION);
  const laps = next.filter((e) => e.mesgNum === Profile.MesgNum.LAP);

  for (const sess of sessions) {
    recomputeAggregateInto(sess.mesg, records, true);
  }

  for (const lap of laps) {
    const startMs = asTimeMs(lap.mesg.startTime);
    const endMs = asTimeMs(lap.mesg.timestamp);
    if (startMs != null && endMs != null && endMs >= startMs) {
      const lapRecords = records.filter((r) => {
        const ts = asTimeMs(r.mesg.timestamp);
        return ts != null && ts >= startMs && ts <= endMs;
      });
      if (lapRecords.length > 0) {
        recomputeAggregateInto(lap.mesg, lapRecords, false);
      }
    }
  }

  return next;
}
