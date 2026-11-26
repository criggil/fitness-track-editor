import { Profile } from '@garmin/fitsdk';
import type {
  ChannelKey,
  ChannelSummary,
  FitEntry,
  TrackSummary,
} from './types';

export const CHANNEL_FIELD_MAP: Record<
  ChannelKey,
  { record: string[]; summary: string[] }
> = {
  gps: {
    record: ['positionLat', 'positionLong', 'gpsAccuracy'],
    summary: [
      'startPositionLat',
      'startPositionLong',
      'endPositionLat',
      'endPositionLong',
      'necLat',
      'necLong',
      'swcLat',
      'swcLong',
    ],
  },
  elevation: {
    record: ['altitude', 'enhancedAltitude', 'grade'],
    summary: [
      'totalAscent',
      'totalDescent',
      'avgAltitude',
      'maxAltitude',
      'minAltitude',
      'enhancedAvgAltitude',
      'enhancedMaxAltitude',
      'enhancedMinAltitude',
      'avgGrade',
      'avgPosGrade',
      'avgNegGrade',
      'maxPosGrade',
      'maxNegGrade',
    ],
  },
  speed: {
    record: ['speed', 'enhancedSpeed'],
    summary: ['avgSpeed', 'maxSpeed', 'enhancedAvgSpeed', 'enhancedMaxSpeed'],
  },
  heartRate: {
    record: ['heartRate'],
    summary: ['avgHeartRate', 'maxHeartRate', 'minHeartRate'],
  },
  hrv: {
    record: [],
    summary: [],
  },
  power: {
    record: ['power', 'accumulatedPower', 'leftRightBalance'],
    summary: [
      'avgPower',
      'maxPower',
      'normalizedPower',
      'totalWork',
      'thresholdPower',
      'leftRightBalance',
    ],
  },
  cadence: {
    record: ['cadence', 'fractionalCadence'],
    summary: [
      'avgCadence',
      'maxCadence',
      'avgRunningCadence',
      'maxRunningCadence',
    ],
  },
  temperature: {
    record: ['temperature'],
    summary: ['avgTemperature', 'maxTemperature', 'minTemperature'],
  },
};

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  return null;
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export function computeTrackSummary(entries: FitEntry[]): TrackSummary {
  const records = entries.filter((e) => e.mesgNum === Profile.MesgNum.RECORD);
  const laps = entries.filter((e) => e.mesgNum === Profile.MesgNum.LAP);
  const sessions = entries.filter((e) => e.mesgNum === Profile.MesgNum.SESSION);
  const fileId = entries.find((e) => e.mesgNum === Profile.MesgNum.FILE_ID)?.mesg;
  const session = sessions[0]?.mesg;

  const channels = {} as ChannelSummary;
  const summaryMesgs = [...laps, ...sessions].map((e) => e.mesg);

  for (const key of Object.keys(CHANNEL_FIELD_MAP) as ChannelKey[]) {
    const def = CHANNEL_FIELD_MAP[key];
    let recordCount = 0;
    for (const r of records) {
      if (def.record.some((f) => r.mesg[f] != null)) {
        recordCount += 1;
      }
    }
    let summaryFieldCount = 0;
    for (const m of summaryMesgs) {
      for (const f of def.summary) {
        if (m[f] != null) summaryFieldCount += 1;
      }
    }
    channels[key] = {
      present: recordCount > 0 || summaryFieldCount > 0,
      recordCount,
      summaryFieldCount,
    };
  }

  // HRV messages are stored as standalone Profile.MesgNum.HRV messages
  const hrvCount = entries.filter(
    (e) => e.mesgNum === Profile.MesgNum.HRV,
  ).length;
  channels.hrv = {
    present: hrvCount > 0,
    recordCount: hrvCount,
    summaryFieldCount: 0,
  };

  // Fallback calculations from records if session fields are missing
  let totalDistance = asNumber(session?.totalDistance);
  if (totalDistance == null && records.length > 0) {
    for (let i = records.length - 1; i >= 0; i--) {
      const d = asNumber(records[i].mesg.distance);
      if (d != null) {
        totalDistance = d;
        break;
      }
    }
  }

  const firstRecordTs = asDate(records[0]?.mesg.timestamp);
  const lastRecordTs = asDate(records[records.length - 1]?.mesg.timestamp);
  const recordSpanSec =
    firstRecordTs && lastRecordTs
      ? Math.max(0, (lastRecordTs.getTime() - firstRecordTs.getTime()) / 1000)
      : null;

  const totalTimerTime = asNumber(session?.totalTimerTime) ?? recordSpanSec;
  const totalElapsedTime = asNumber(session?.totalElapsedTime) ?? recordSpanSec;

  // Fallback speed / HR / power stats from records when session omits them
  let recSpeedSum = 0;
  let recSpeedCount = 0;
  let recMaxSpeed: number | null = null;
  let recHrSum = 0;
  let recHrCount = 0;
  let recMaxHr: number | null = null;
  let recPowerSum = 0;
  let recPowerCount = 0;

  for (const r of records) {
    const sp = asNumber(r.mesg.enhancedSpeed) ?? asNumber(r.mesg.speed);
    if (sp != null) {
      recSpeedSum += sp;
      recSpeedCount += 1;
      if (recMaxSpeed == null || sp > recMaxSpeed) recMaxSpeed = sp;
    }
    const hr = asNumber(r.mesg.heartRate);
    if (hr != null) {
      recHrSum += hr;
      recHrCount += 1;
      if (recMaxHr == null || hr > recMaxHr) recMaxHr = hr;
    }
    const pw = asNumber(r.mesg.power);
    if (pw != null) {
      recPowerSum += pw;
      recPowerCount += 1;
    }
  }

  const avgSpeed =
    asNumber(session?.enhancedAvgSpeed) ??
    asNumber(session?.avgSpeed) ??
    (recSpeedCount > 0 ? recSpeedSum / recSpeedCount : null);
  const maxSpeed =
    asNumber(session?.enhancedMaxSpeed) ??
    asNumber(session?.maxSpeed) ??
    recMaxSpeed;
  const avgHeartRate =
    asNumber(session?.avgHeartRate) ??
    (recHrCount > 0 ? Math.round(recHrSum / recHrCount) : null);
  const maxHeartRate = asNumber(session?.maxHeartRate) ?? recMaxHr;
  const avgPower =
    asNumber(session?.avgPower) ??
    (recPowerCount > 0 ? Math.round(recPowerSum / recPowerCount) : null);

  return {
    sport: asString(session?.sport),
    subSport: asString(session?.subSport),
    manufacturer: asString(fileId?.manufacturer),
    startTime: asDate(session?.startTime) ?? firstRecordTs,
    totalDistance,
    totalTimerTime,
    totalElapsedTime,
    avgSpeed,
    maxSpeed,
    totalAscent: asNumber(session?.totalAscent),
    totalDescent: asNumber(session?.totalDescent),
    avgHeartRate,
    maxHeartRate,
    avgPower,
    totalCalories: asNumber(session?.totalCalories),
    recordCount: records.length,
    lapCount: laps.length,
    sessionCount: sessions.length,
    totalMesgCount: entries.length,
    channels,
  };
}
