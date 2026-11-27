import { useEffect, useState } from 'react';
import {
  Bike,
  Flame,
  Gauge,
  Home,
  RefreshCw,
  Ruler,
  Scissors,
  Trash2,
} from 'lucide-react';
import type {
  AverageSpeedTimeBase,
  ChannelKey,
  SpeedPolicyOnDistanceEdit,
} from '../core/fit/types';
import {
  ACTIVITY_PRESETS,
  ALL_FIT_SPORTS,
  ALL_FIT_SUB_SPORTS,
} from '../core/transforms/editActivityType';
import {
  estimateCalories,
  type AthleteSex,
  type CalorieMethod,
} from '../core/transforms/editCalories';
import { useI18n, type TranslationKey } from '../i18n';
import { useTrackStore } from '../store/useTrackStore';
import {
  formatDistanceKm,
  formatPaceMinKm,
  formatSpeedKmh,
} from '../utils/format';

type ScenarioId =
  | 'strip'
  | 'distance'
  | 'speed'
  | 'indoor'
  | 'calories'
  | 'activityType'
  | 'recalculate';

const STRIP_CHANNELS: {
  key: ChannelKey;
  labelKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  {
    key: 'gps',
    labelKey: 'scenarios.strip.ch.gps.label',
    descKey: 'scenarios.strip.ch.gps.desc',
  },
  {
    key: 'elevation',
    labelKey: 'scenarios.strip.ch.elevation.label',
    descKey: 'scenarios.strip.ch.elevation.desc',
  },
  {
    key: 'speed',
    labelKey: 'scenarios.strip.ch.speed.label',
    descKey: 'scenarios.strip.ch.speed.desc',
  },
  {
    key: 'heartRate',
    labelKey: 'scenarios.strip.ch.heartRate.label',
    descKey: 'scenarios.strip.ch.heartRate.desc',
  },
  {
    key: 'hrv',
    labelKey: 'scenarios.strip.ch.hrv.label',
    descKey: 'scenarios.strip.ch.hrv.desc',
  },
  {
    key: 'power',
    labelKey: 'scenarios.strip.ch.power.label',
    descKey: 'scenarios.strip.ch.power.desc',
  },
  {
    key: 'cadence',
    labelKey: 'scenarios.strip.ch.cadence.label',
    descKey: 'scenarios.strip.ch.cadence.desc',
  },
  {
    key: 'temperature',
    labelKey: 'scenarios.strip.ch.temperature.label',
    descKey: 'scenarios.strip.ch.temperature.desc',
  },
];

const PROFILE_STORAGE_KEY = 'fit-editor-athlete-profile';

function loadAthleteProfile(): { weightKg: number; age: number; sex: AthleteSex } {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{
        weightKg: number;
        age: number;
        sex: AthleteSex;
      }>;
      return {
        weightKg: typeof parsed.weightKg === 'number' ? parsed.weightKg : 75,
        age: typeof parsed.age === 'number' ? parsed.age : 32,
        sex: parsed.sex === 'female' ? 'female' : 'male',
      };
    }
  } catch {
    // ignore storage errors
  }
  return { weightKg: 75, age: 32, sex: 'male' };
}

export function ScenariosTab() {
  const { t } = useI18n();
  const entries = useTrackStore((s) => s.entries);
  const summary = useTrackStore((s) => s.summary);
  const stripChannel = useTrackStore((s) => s.stripChannel);
  const stripMultipleChannels = useTrackStore((s) => s.stripMultipleChannels);
  const editDistanceAction = useTrackStore((s) => s.editDistanceAction);
  const stripDistanceAction = useTrackStore((s) => s.stripDistanceAction);
  const applyAverageSpeedAction = useTrackStore((s) => s.applyAverageSpeedAction);
  const editActivityTypeAction = useTrackStore((s) => s.editActivityTypeAction);
  const setCaloriesAction = useTrackStore((s) => s.setCaloriesAction);
  const stripCaloriesAction = useTrackStore((s) => s.stripCaloriesAction);
  const convertToIndoorAction = useTrackStore((s) => s.convertToIndoorAction);
  const recalculateSummaryAction = useTrackStore((s) => s.recalculateSummaryAction);

  const [activeId, setActiveId] = useState<ScenarioId>('strip');

  // Distance state
  const [distanceKmInput, setDistanceKmInput] = useState<string>('');
  const [speedPolicy, setSpeedPolicy] = useState<SpeedPolicyOnDistanceEdit>('scale');
  const [syncDistOnDistEdit, setSyncDistOnDistEdit] = useState<boolean>(true);

  // Average Speed state
  const [timeBase, setTimeBase] = useState<AverageSpeedTimeBase>('timer');
  const [syncDistOnAvgSpeed, setSyncDistOnAvgSpeed] = useState<boolean>(true);

  // Indoor combo state
  const [indoorMode, setIndoorMode] = useState<'indoorCycling' | 'treadmill'>(
    'indoorCycling',
  );
  const [indoorDistKm, setIndoorDistKm] = useState<string>('');
  const [indoorSpeedMode, setIndoorSpeedMode] = useState<'average' | 'strip' | 'keep'>(
    'average',
  );

  // Activity Type state
  const [sportInput, setSportInput] = useState<string>('generic');
  const [subSportInput, setSubSportInput] = useState<string>('generic');

  // Calories state
  const initialProfile = loadAthleteProfile();
  const [weightKg, setWeightKg] = useState<number>(initialProfile.weightKg);
  const [age, setAge] = useState<number>(initialProfile.age);
  const [sex, setSex] = useState<AthleteSex>(initialProfile.sex);
  const [calMethod, setCalMethod] = useState<CalorieMethod>('heartRate');
  const [manualKcal, setManualKcal] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({ weightKg, age, sex }),
      );
    } catch {
      // ignore
    }
  }, [weightKg, age, sex]);

  useEffect(() => {
    if (summary?.totalDistance != null) {
      const km = (summary.totalDistance / 1000).toFixed(2);
      setDistanceKmInput(km);
      setIndoorDistKm(km);
    } else {
      setDistanceKmInput('');
      setIndoorDistKm('');
    }
    setSportInput(summary?.sport ?? 'generic');
    setSubSportInput(summary?.subSport ?? 'generic');
    setManualKcal(
      summary?.totalCalories != null ? String(summary.totalCalories) : '',
    );
  }, [summary?.totalDistance, summary?.sport, summary?.subSport, summary?.totalCalories]);

  if (!summary) return null;

  const durationForAvg =
    timeBase === 'elapsed'
      ? (summary.totalElapsedTime ?? summary.totalTimerTime)
      : (summary.totalTimerTime ?? summary.totalElapsedTime);

  const previewAvgMps =
    summary.totalDistance != null &&
    durationForAvg != null &&
    durationForAvg > 0
      ? summary.totalDistance / durationForAvg
      : null;

  const estimatedKcal = estimateCalories(entries, {
    method: calMethod,
    weightKg,
    age,
    sex,
  });

  const navItems: {
    id: ScenarioId;
    title: string;
    subtitle: string;
    icon: typeof Scissors;
    accent: string;
  }[] = [
    {
      id: 'strip',
      title: t('scenarios.nav.strip.title'),
      subtitle: t('scenarios.nav.strip.sub'),
      icon: Scissors,
      accent: 'text-rose-400',
    },
    {
      id: 'distance',
      title: t('scenarios.nav.distance.title'),
      subtitle: t('scenarios.nav.distance.sub'),
      icon: Ruler,
      accent: 'text-violet-400',
    },
    {
      id: 'speed',
      title: t('scenarios.nav.speed.title'),
      subtitle: t('scenarios.nav.speed.sub'),
      icon: Gauge,
      accent: 'text-sky-400',
    },
    {
      id: 'indoor',
      title: t('scenarios.nav.indoor.title'),
      subtitle: t('scenarios.nav.indoor.sub'),
      icon: Home,
      accent: 'text-amber-400',
    },
    {
      id: 'calories',
      title: t('scenarios.nav.calories.title'),
      subtitle: t('scenarios.nav.calories.sub'),
      icon: Flame,
      accent: 'text-orange-400',
    },
    {
      id: 'activityType',
      title: t('scenarios.nav.activityType.title'),
      subtitle: t('scenarios.nav.activityType.sub'),
      icon: Bike,
      accent: 'text-emerald-400',
    },
    {
      id: 'recalculate',
      title: t('scenarios.nav.recalculate.title'),
      subtitle: t('scenarios.nav.recalculate.sub'),
      icon: RefreshCw,
      accent: 'text-cyan-400',
    },
  ];

  const presentCore: ChannelKey[] = (['gps', 'elevation', 'speed'] as ChannelKey[]).filter(
    (k) => summary.channels[k].present,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
      {/* Left Scenario List */}
      <nav className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                active
                  ? 'bg-sky-500/15 border border-sky-500/30 text-slate-100'
                  : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${item.accent}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{item.title}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Right Scenario Workspace */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        {activeId === 'strip' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {t('scenarios.strip.title')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('scenarios.strip.desc')}
                </p>
              </div>
              {presentCore.length > 1 && (
                <button
                  type="button"
                  onClick={() => stripMultipleChannels(presentCore)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 cursor-pointer"
                >
                  {t('scenarios.strip.stripCore')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STRIP_CHANNELS.map((ch) => {
                const stats = summary.channels[ch.key];
                return (
                  <div
                    key={ch.key}
                    className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 ${
                      stats.present
                        ? 'border-slate-800 bg-slate-950/60'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-55'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-100">
                          {t(ch.labelKey)}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            stats.present
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {stats.present
                            ? `${stats.recordCount} rec · ${stats.summaryFieldCount} sum`
                            : t('scenarios.strip.missing')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        {t(ch.descKey)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!stats.present}
                      onClick={() => stripChannel(ch.key)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('common.delete')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeId === 'distance' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {t('scenarios.distance.title')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('scenarios.distance.current', {
                  value: formatDistanceKm(summary.totalDistance),
                })}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsedKm = Number.parseFloat(distanceKmInput.replace(',', '.'));
                if (!Number.isFinite(parsedKm) || parsedKm < 0) return;
                editDistanceAction({
                  targetDistanceMeters: parsedKm * 1000,
                  speedPolicy,
                  timeBase,
                  syncDistanceCurve: syncDistOnDistEdit,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {t('scenarios.distance.targetLabel')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={distanceKmInput}
                  onChange={(e) => setDistanceKmInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {t('scenarios.distance.policyLabel')}
                </label>
                <select
                  value={speedPolicy}
                  onChange={(e) =>
                    setSpeedPolicy(e.target.value as SpeedPolicyOnDistanceEdit)
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="scale">{t('scenarios.distance.policy.scale')}</option>
                  <option value="average">{t('scenarios.distance.policy.average')}</option>
                  <option value="strip">{t('scenarios.distance.policy.strip')}</option>
                  <option value="keep">{t('scenarios.distance.policy.keep')}</option>
                </select>
              </div>

              {speedPolicy === 'average' && (
                <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncDistOnDistEdit}
                    onChange={(e) => setSyncDistOnDistEdit(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-sky-500"
                  />
                  <span>{t('scenarios.distance.syncCurve')}</span>
                </label>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  {t('scenarios.distance.apply')}
                </button>
                <button
                  type="button"
                  disabled={summary.totalDistance == null}
                  onClick={stripDistanceAction}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-35 cursor-pointer"
                >
                  {t('scenarios.distance.stripAll')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeId === 'speed' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {t('scenarios.speed.title')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('scenarios.speed.desc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 max-w-xs">
              <button
                type="button"
                onClick={() => setTimeBase('timer')}
                className={`py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  timeBase === 'timer'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('scenarios.speed.timerTime')}
              </button>
              <button
                type="button"
                onClick={() => setTimeBase('elapsed')}
                className={`py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  timeBase === 'elapsed'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('scenarios.speed.elapsedTime')}
              </button>
            </div>

            <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-4 py-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t('scenarios.speed.previewLabel')}</span>
              <span className="font-mono font-semibold text-sky-300">
                {previewAvgMps != null
                  ? `${formatSpeedKmh(previewAvgMps)} · ${formatPaceMinKm(previewAvgMps)}`
                  : t('scenarios.speed.needDistance')}
              </span>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={syncDistOnAvgSpeed}
                onChange={(e) => setSyncDistOnAvgSpeed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-sky-500"
              />
              <span>{t('scenarios.speed.syncCurve')}</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={previewAvgMps == null}
                onClick={() =>
                  applyAverageSpeedAction({
                    timeBase,
                    syncDistanceCurve: syncDistOnAvgSpeed,
                  })
                }
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold disabled:opacity-35 cursor-pointer"
              >
                {t('scenarios.speed.apply')}
              </button>
              <button
                type="button"
                disabled={!summary.channels.speed.present}
                onClick={() => stripChannel('speed')}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-35 cursor-pointer"
              >
                {t('scenarios.speed.stripAll')}
              </button>
            </div>
          </div>
        )}

        {activeId === 'indoor' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {t('scenarios.indoor.title')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('scenarios.indoor.desc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIndoorMode('indoorCycling')}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  indoorMode === 'indoorCycling'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold">{t('scenarios.indoor.cycling')}</div>
                <div className="text-[11px] font-mono opacity-75 mt-0.5">
                  cycling · indoorCycling
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIndoorMode('treadmill')}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  indoorMode === 'treadmill'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold">{t('scenarios.indoor.treadmill')}</div>
                <div className="text-[11px] font-mono opacity-75 mt-0.5">
                  running · treadmill
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t('scenarios.indoor.distanceLabel')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={indoorDistKm}
                  onChange={(e) => setIndoorDistKm(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t('scenarios.indoor.speedModeLabel')}
                </label>
                <select
                  value={indoorSpeedMode}
                  onChange={(e) =>
                    setIndoorSpeedMode(e.target.value as 'average' | 'strip' | 'keep')
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="average">{t('scenarios.indoor.speed.average')}</option>
                  <option value="strip">{t('scenarios.indoor.speed.strip')}</option>
                  <option value="keep">{t('scenarios.indoor.speed.keep')}</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const parsedKm = Number.parseFloat(indoorDistKm.replace(',', '.'));
                convertToIndoorAction({
                  mode: indoorMode,
                  targetDistanceMeters:
                    Number.isFinite(parsedKm) && parsedKm >= 0 ? parsedKm * 1000 : null,
                  speedMode: indoorSpeedMode,
                  syncDistanceCurve: true,
                });
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              {t('scenarios.indoor.apply')}
            </button>
          </div>
        )}

        {activeId === 'calories' && (
          <div className="max-w-xl space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {t('scenarios.calories.title')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('scenarios.calories.current', {
                  value:
                    summary.totalCalories != null
                      ? `${summary.totalCalories} ${t('unit.kcal')}`
                      : t('scenarios.calories.notSet'),
                })}
              </p>
            </div>

            {/* Auto-estimate */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-200">
                {t('scenarios.calories.autoTitle')}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t('scenarios.calories.weight')}
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 75)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t('scenarios.calories.age')}
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value) || 30)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t('scenarios.calories.sex')}
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as AthleteSex)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="male">{t('scenarios.calories.male')}</option>
                    <option value="female">{t('scenarios.calories.female')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {t('scenarios.calories.method')}
                </label>
                <select
                  value={calMethod}
                  onChange={(e) => setCalMethod(e.target.value as CalorieMethod)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="power">{t('scenarios.calories.method.power')}</option>
                  <option value="heartRate">
                    {t('scenarios.calories.method.heartRate')}
                  </option>
                  <option value="distance">
                    {t('scenarios.calories.method.distance')}
                  </option>
                  <option value="met">{t('scenarios.calories.method.met')}</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  {t('scenarios.calories.estimate')}{' '}
                  <strong className="font-mono text-orange-300">
                    {estimatedKcal != null
                      ? `${estimatedKcal} ${t('unit.kcal')}`
                      : t('scenarios.calories.noData')}
                  </strong>
                </span>
                <button
                  type="button"
                  disabled={estimatedKcal == null}
                  onClick={() => {
                    if (estimatedKcal != null) setCaloriesAction(estimatedKcal);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-semibold disabled:opacity-35 cursor-pointer"
                >
                  {t('scenarios.calories.applyEstimate')}
                </button>
              </div>
            </div>

            {/* Manual input + strip */}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-slate-400 mb-1">
                  {t('scenarios.calories.manualLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={manualKcal}
                  onChange={(e) => setManualKcal(e.target.value)}
                  placeholder="450"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = Number.parseFloat(manualKcal);
                  if (Number.isFinite(val) && val >= 0) setCaloriesAction(val);
                }}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                {t('scenarios.calories.setManual')}
              </button>
              <button
                type="button"
                disabled={summary.totalCalories == null}
                onClick={stripCaloriesAction}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-35 cursor-pointer"
              >
                {t('scenarios.calories.strip')}
              </button>
            </div>
          </div>
        )}

        {activeId === 'activityType' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {t('scenarios.activity.title')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('scenarios.activity.desc')}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_PRESETS.map((preset) => {
                const active =
                  sportInput === preset.sport && subSportInput === preset.subSport;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSportInput(preset.sport);
                      setSubSportInput(preset.subSport);
                      editActivityTypeAction({
                        sport: preset.sport,
                        subSport: preset.subSport,
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t(preset.labelKey)}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t('scenarios.activity.sport')}
                </label>
                <select
                  value={sportInput}
                  onChange={(e) => setSportInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-200"
                >
                  {ALL_FIT_SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t('scenarios.activity.subSport')}
                </label>
                <select
                  value={subSportInput}
                  onChange={(e) => setSubSportInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-200"
                >
                  {ALL_FIT_SUB_SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                editActivityTypeAction({
                  sport: sportInput,
                  subSport: subSportInput,
                })
              }
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              {t('scenarios.activity.apply')}
            </button>
          </div>
        )}

        {activeId === 'recalculate' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {t('scenarios.recalc.title')}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t('scenarios.recalc.desc')}
              </p>
            </div>

            <button
              type="button"
              onClick={recalculateSummaryAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('scenarios.recalc.apply')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
