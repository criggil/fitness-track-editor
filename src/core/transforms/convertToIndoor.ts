import type { FitEntry } from '../fit/types';
import { editActivityType } from './editActivityType';
import { editTotalDistance } from './editDistance';
import { applyAverageSpeed } from './editSpeed';
import { stripChannels } from './stripChannels';

export interface ConvertToIndoorOptions {
  mode: 'indoorCycling' | 'treadmill';
  targetDistanceMeters?: number | null;
  speedMode: 'average' | 'strip' | 'keep';
  syncDistanceCurve?: boolean;
}

/**
 * Combo recipe: strips GPS + Elevation, sets indoor sport/subSport,
 * and optionally updates distance & speed consistently.
 */
export function convertToIndoor(
  entries: FitEntry[],
  options: ConvertToIndoorOptions,
): FitEntry[] {
  let next = stripChannels(entries, ['gps', 'elevation']);

  next = editActivityType(
    next,
    options.mode === 'treadmill'
      ? { sport: 'running', subSport: 'treadmill' }
      : { sport: 'cycling', subSport: 'indoorCycling' },
  );

  if (options.targetDistanceMeters != null && options.targetDistanceMeters >= 0) {
    next = editTotalDistance(next, {
      targetDistanceMeters: options.targetDistanceMeters,
      speedPolicy:
        options.speedMode === 'average'
          ? 'average'
          : options.speedMode === 'strip'
            ? 'strip'
            : 'keep',
      syncDistanceCurve: options.syncDistanceCurve ?? true,
    });
  } else if (options.speedMode === 'average') {
    next = applyAverageSpeed(next, {
      timeBase: 'timer',
      syncDistanceCurve: options.syncDistanceCurve ?? true,
    });
  } else if (options.speedMode === 'strip') {
    next = stripChannels(next, ['speed']);
  }

  return next;
}
