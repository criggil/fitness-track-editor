export type FitMesgObject = Record<string, unknown>;

export interface FitEntry {
  mesgNum: number;
  mesgName: string;
  mesg: FitMesgObject;
}

export interface FitDeveloperFieldRegistration {
  key: number;
  developerDataIdMesg: FitMesgObject;
  fieldDescriptionMesg: FitMesgObject;
}

export interface FitDocument {
  fileName: string;
  fileSize: number;
  entries: FitEntry[];
  developerFields: FitDeveloperFieldRegistration[];
  warnings: string[];
}

export type ChannelKey =
  | 'gps'
  | 'elevation'
  | 'speed'
  | 'heartRate'
  | 'hrv'
  | 'power'
  | 'cadence'
  | 'temperature';

export interface ChannelStats {
  present: boolean;
  recordCount: number;
  summaryFieldCount: number;
}

export type ChannelSummary = Record<ChannelKey, ChannelStats>;

export interface TrackSummary {
  sport: string | null;
  subSport: string | null;
  manufacturer: string | null;
  startTime: Date | null;
  totalDistance: number | null; // meters
  totalTimerTime: number | null; // seconds
  totalElapsedTime: number | null; // seconds
  avgSpeed: number | null; // m/s
  maxSpeed: number | null; // m/s
  totalAscent: number | null; // meters
  totalDescent: number | null; // meters
  avgHeartRate: number | null; // bpm
  maxHeartRate: number | null; // bpm
  avgPower: number | null; // watts
  totalCalories: number | null; // kcal
  recordCount: number;
  lapCount: number;
  sessionCount: number;
  totalMesgCount: number;
  channels: ChannelSummary;
}

export interface TrackBounds {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export interface TrackProjection {
  length: number;
  elapsedSec: number[];
  timestamps: (number | null)[];
  lat: (number | null)[];
  lon: (number | null)[];
  coordinates: [number, number][]; // [lon, lat] for MapLibre
  coordToRecordIndex: number[];
  bounds: TrackBounds | null;
  altitude: (number | null)[];
  speed: (number | null)[]; // m/s
  distance: (number | null)[]; // meters
  heartRate: (number | null)[];
  power: (number | null)[];
  cadence: (number | null)[];
}

export type SpeedPolicyOnDistanceEdit =
  | 'scale'
  | 'average'
  | 'strip'
  | 'keep';

export type AverageSpeedTimeBase = 'timer' | 'elapsed';
