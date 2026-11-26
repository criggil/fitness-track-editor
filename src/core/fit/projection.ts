import { Profile } from '@garmin/fitsdk';
import { SEMICIRCLES_TO_DEGREES } from './codec';
import type { FitEntry, TrackBounds, TrackProjection } from './types';

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function buildTrackProjection(entries: FitEntry[]): TrackProjection {
  const records = entries.filter((e) => e.mesgNum === Profile.MesgNum.RECORD);
  const len = records.length;

  const elapsedSec: number[] = new Array(len);
  const timestamps: (number | null)[] = new Array(len);
  const lat: (number | null)[] = new Array(len);
  const lon: (number | null)[] = new Array(len);
  const altitude: (number | null)[] = new Array(len);
  const speed: (number | null)[] = new Array(len);
  const distance: (number | null)[] = new Array(len);
  const heartRate: (number | null)[] = new Array(len);
  const power: (number | null)[] = new Array(len);
  const cadence: (number | null)[] = new Array(len);

  const coordinates: [number, number][] = [];
  const coordToRecordIndex: number[] = [];

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  let startMs: number | null = null;
  for (let i = 0; i < len; i++) {
    const ts = records[i].mesg.timestamp;
    if (ts instanceof Date && !Number.isNaN(ts.getTime())) {
      startMs = ts.getTime();
      break;
    }
  }

  for (let i = 0; i < len; i++) {
    const m = records[i].mesg;
    const ts = m.timestamp instanceof Date ? m.timestamp.getTime() : null;
    timestamps[i] = ts != null ? ts / 1000 : null;
    elapsedSec[i] = ts != null && startMs != null ? (ts - startMs) / 1000 : i;

    const rawLat = asNumber(m.positionLat);
    const rawLon = asNumber(m.positionLong);
    if (rawLat != null && rawLon != null) {
      const degLat = rawLat * SEMICIRCLES_TO_DEGREES;
      const degLon = rawLon * SEMICIRCLES_TO_DEGREES;
      if (degLat >= -90 && degLat <= 90 && degLon >= -180 && degLon <= 180) {
        lat[i] = degLat;
        lon[i] = degLon;
        coordinates.push([degLon, degLat]);
        coordToRecordIndex.push(i);
        if (degLon < minLon) minLon = degLon;
        if (degLon > maxLon) maxLon = degLon;
        if (degLat < minLat) minLat = degLat;
        if (degLat > maxLat) maxLat = degLat;
      } else {
        lat[i] = null;
        lon[i] = null;
      }
    } else {
      lat[i] = null;
      lon[i] = null;
    }

    altitude[i] = asNumber(m.enhancedAltitude) ?? asNumber(m.altitude);
    speed[i] = asNumber(m.enhancedSpeed) ?? asNumber(m.speed);
    distance[i] = asNumber(m.distance);
    heartRate[i] = asNumber(m.heartRate);
    power[i] = asNumber(m.power);
    cadence[i] = asNumber(m.cadence);
  }

  const bounds: TrackBounds | null =
    coordinates.length > 0
      ? { minLon, minLat, maxLon, maxLat }
      : null;

  return {
    length: len,
    elapsedSec,
    timestamps,
    lat,
    lon,
    coordinates,
    coordToRecordIndex,
    bounds,
    altitude,
    speed,
    distance,
    heartRate,
    power,
    cadence,
  };
}
