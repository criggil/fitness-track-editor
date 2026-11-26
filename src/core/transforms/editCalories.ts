import { Profile } from '@garmin/fitsdk';
import { cloneEntries } from '../fit/codec';
import { computeTrackSummary } from '../fit/summary';
import type { FitEntry } from '../fit/types';

export type CalorieMethod = 'power' | 'heartRate' | 'distance' | 'met';
export type AthleteSex = 'male' | 'female';

export interface CalorieEstimateParams {
  method: CalorieMethod;
  weightKg: number;
  age: number;
  sex: AthleteSex;
  met?: number;
}

const DEFAULT_MET_BY_SPORT: Record<string, number> = {
  cycling: 7.5,
  running: 9.8,
  walking: 3.5,
  hiking: 6.0,
  swimming: 8.0,
  training: 5.0,
  rowing: 7.0,
  fitnessEquipment: 6.0,
};

function asNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Estimates total calories (kcal) using the chosen scientific/industry model.
 */
export function estimateCalories(
  entries: FitEntry[],
  params: CalorieEstimateParams,
): number | null {
  const summary = computeTrackSummary(entries);
  const durationSec = summary.totalTimerTime ?? summary.totalElapsedTime;
  const weight = Math.max(20, params.weightKg);

  switch (params.method) {
    case 'power': {
      // 1 kJ mechanical work ≈ 1 kcal (assuming ~24% human cycling efficiency)
      const session = entries.find(
        (e) => e.mesgNum === Profile.MesgNum.SESSION,
      )?.mesg;
      const totalWorkJ = asNum(session?.totalWork);
      if (totalWorkJ != null && totalWorkJ > 0) {
        return Math.round(totalWorkJ / 1000);
      }
      if (summary.avgPower != null && durationSec != null && durationSec > 0) {
        return Math.round((summary.avgPower * durationSec) / 1000);
      }
      return null;
    }

    case 'heartRate': {
      // Keytel et al. (2005), Journal of Sports Sciences
      if (summary.avgHeartRate == null || durationSec == null || durationSec <= 0) {
        return null;
      }
      const hr = summary.avgHeartRate;
      const mins = durationSec / 60;
      const kcalPerMin =
        params.sex === 'male'
          ? (-55.0969 + 0.6309 * hr + 0.1988 * weight + 0.2017 * params.age) / 4.184
          : (-20.4022 + 0.4472 * hr - 0.1263 * weight + 0.074 * params.age) / 4.184;
      const clampedRate = Math.max(1.2, kcalPerMin);
      return Math.round(clampedRate * mins);
    }

    case 'distance': {
      if (summary.totalDistance == null || summary.totalDistance <= 0) {
        return null;
      }
      const km = summary.totalDistance / 1000;
      const sport = summary.sport ?? 'generic';
      const coef =
        sport === 'walking'
          ? 0.65
          : sport === 'cycling'
            ? 0.45
            : 1.0; // running / hiking / default Margaria ~1 kcal/kg/km
      return Math.round(weight * km * coef);
    }

    case 'met': {
      if (durationSec == null || durationSec <= 0) return null;
      const met =
        params.met ??
        DEFAULT_MET_BY_SPORT[summary.sport ?? ''] ??
        6.0;
      return Math.round(met * weight * (durationSec / 3600));
    }
  }
}

/**
 * Sets totalCalories on session messages and distributes proportionally across laps.
 */
export function setTotalCalories(
  entries: FitEntry[],
  totalCaloriesKcal: number,
): FitEntry[] {
  const kcal = Math.max(0, Math.round(totalCaloriesKcal));
  const next = cloneEntries(entries);
  const sessions = next.filter((e) => e.mesgNum === Profile.MesgNum.SESSION);
  const laps = next.filter((e) => e.mesgNum === Profile.MesgNum.LAP);

  for (const sess of sessions) {
    sess.mesg.totalCalories = kcal;
  }

  if (laps.length > 0) {
    const sumTime = laps.reduce(
      (acc, l) =>
        acc +
        (asNum(l.mesg.totalTimerTime) ?? asNum(l.mesg.totalElapsedTime) ?? 0),
      0,
    );
    for (const lap of laps) {
      if (sumTime > 0) {
        const lt =
          asNum(lap.mesg.totalTimerTime) ?? asNum(lap.mesg.totalElapsedTime) ?? 0;
        lap.mesg.totalCalories = Math.round((lt / sumTime) * kcal);
      } else {
        lap.mesg.totalCalories = Math.round(kcal / laps.length);
      }
    }
  }

  return next;
}

/**
 * Removes calorie fields from session, lap, and record messages.
 */
export function stripCalories(entries: FitEntry[]): FitEntry[] {
  const next = cloneEntries(entries);
  for (const entry of next) {
    if (
      entry.mesgNum === Profile.MesgNum.SESSION ||
      entry.mesgNum === Profile.MesgNum.LAP
    ) {
      delete entry.mesg.totalCalories;
      delete entry.mesg.totalFatCalories;
      delete entry.mesg.metabolicCalories;
    } else if (entry.mesgNum === Profile.MesgNum.RECORD) {
      delete entry.mesg.calories;
    }
  }
  return next;
}
