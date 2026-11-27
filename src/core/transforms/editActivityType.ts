import { Profile } from '@garmin/fitsdk';
import type { TranslationKey } from '../../i18n';
import { cloneEntries } from '../fit/codec';
import type { FitEntry } from '../fit/types';

export interface ActivityTypePreset {
  id: string;
  labelKey: TranslationKey;
  sport: string;
  subSport: string;
}

export const ACTIVITY_PRESETS: ActivityTypePreset[] = [
  { id: 'cycling-road', labelKey: 'preset.cycling-road', sport: 'cycling', subSport: 'road' },
  {
    id: 'cycling-indoor',
    labelKey: 'preset.cycling-indoor',
    sport: 'cycling',
    subSport: 'indoorCycling',
  },
  {
    id: 'cycling-virtual',
    labelKey: 'preset.cycling-virtual',
    sport: 'cycling',
    subSport: 'virtualActivity',
  },
  {
    id: 'cycling-gravel',
    labelKey: 'preset.cycling-gravel',
    sport: 'cycling',
    subSport: 'gravelCycling',
  },
  { id: 'cycling-mtb', labelKey: 'preset.cycling-mtb', sport: 'cycling', subSport: 'mountain' },
  { id: 'running', labelKey: 'preset.running', sport: 'running', subSport: 'generic' },
  {
    id: 'running-treadmill',
    labelKey: 'preset.running-treadmill',
    sport: 'running',
    subSport: 'treadmill',
  },
  { id: 'running-trail', labelKey: 'preset.running-trail', sport: 'running', subSport: 'trail' },
  { id: 'walking', labelKey: 'preset.walking', sport: 'walking', subSport: 'generic' },
  { id: 'hiking', labelKey: 'preset.hiking', sport: 'hiking', subSport: 'generic' },
  {
    id: 'swimming-lap',
    labelKey: 'preset.swimming-lap',
    sport: 'swimming',
    subSport: 'lapSwimming',
  },
  {
    id: 'strength',
    labelKey: 'preset.strength',
    sport: 'training',
    subSport: 'strengthTraining',
  },
];

const POPULAR_SPORTS = [
  'cycling',
  'running',
  'walking',
  'hiking',
  'swimming',
  'training',
  'fitnessEquipment',
  'rowing',
  'crossCountrySkiing',
  'alpineSkiing',
  'eBiking',
  'generic',
];

const POPULAR_SUB_SPORTS = [
  'generic',
  'road',
  'indoorCycling',
  'virtualActivity',
  'gravelCycling',
  'mountain',
  'treadmill',
  'trail',
  'track',
  'indoorRunning',
  'lapSwimming',
  'openWater',
  'strengthTraining',
  'cardioTraining',
  'indoorRowing',
  'spin',
];

function buildOrderedOptions(
  rawEnum: Record<string, string>,
  popular: string[],
): string[] {
  const all = Array.from(new Set(Object.values(rawEnum))).filter(
    (v) => v !== 'all',
  );
  const popSet = new Set(popular);
  const head = popular.filter((v) => all.includes(v));
  const tail = all.filter((v) => !popSet.has(v)).sort();
  return [...head, ...tail];
}

export const ALL_FIT_SPORTS: string[] = buildOrderedOptions(
  Profile.types.sport as Record<string, string>,
  POPULAR_SPORTS,
);

export const ALL_FIT_SUB_SPORTS: string[] = buildOrderedOptions(
  Profile.types.subSport as Record<string, string>,
  POPULAR_SUB_SPORTS,
);

export interface EditActivityTypeOptions {
  sport: string;
  subSport: string;
}

/**
 * Updates sport and subSport across session, lap, and sport FIT messages.
 */
export function editActivityType(
  entries: FitEntry[],
  options: EditActivityTypeOptions,
): FitEntry[] {
  const next = cloneEntries(entries);
  const { sport, subSport } = options;

  for (const entry of next) {
    if (
      entry.mesgNum === Profile.MesgNum.SESSION ||
      entry.mesgNum === Profile.MesgNum.LAP ||
      entry.mesgNum === Profile.MesgNum.SPORT
    ) {
      entry.mesg.sport = sport;
      entry.mesg.subSport = subSport;
    }
  }

  return next;
}
