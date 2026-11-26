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
  label: string;
  desc: string;
}[] = [
  {
    key: 'gps',
    label: 'GPS (координаты и границы)',
    desc: 'Удаляет positionLat/Long, gpsAccuracy из record и start/end/nec/swc из lap и session.',
  },
  {
    key: 'elevation',
    label: 'Elevation (высота и градиент)',
    desc: 'Удаляет altitude/enhancedAltitude/grade из record и totalAscent/Descent, min/avg/maxAltitude из lap и session.',
  },
  {
    key: 'speed',
    label: 'Speed (скорость)',
    desc: 'Удаляет speed/enhancedSpeed из record и avg/maxSpeed из lap и session.',
  },
  {
    key: 'heartRate',
    label: 'Heart Rate (пульс)',
    desc: 'Удаляет heartRate из record, min/avg/maxHeartRate из lap/session и отдельные hr-сообщения.',
  },
  {
    key: 'hrv',
    label: 'HRV (вариабельность ритма)',
    desc: 'Полностью удаляет сообщения типа hrv из FIT-файла.',
  },
  {
    key: 'power',
    label: 'Power (мощность)',
    desc: 'Удаляет power, accumulatedPower, leftRightBalance и агрегаты normalizedPower, totalWork.',
  },
  {
    key: 'cadence',
    label: 'Cadence (каденс)',
    desc: 'Удаляет cadence/fractionalCadence из record и avg/maxCadence из lap и session.',
  },
  {
    key: 'temperature',
    label: 'Temperature (температура)',
    desc: 'Удаляет temperature из record и min/avg/maxTemperature из lap и session.',
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
      title: 'Вырезать секции данных',
      subtitle: 'GPS, Elevation, Speed, HR, HRV, Power…',
      icon: Scissors,
      accent: 'text-rose-400',
    },
    {
      id: 'distance',
      title: 'Коррекция дистанции',
      subtitle: 'Масштабирование + пересчёт скорости',
      icon: Ruler,
      accent: 'text-violet-400',
    },
    {
      id: 'speed',
      title: 'Средняя скорость по дистанции',
      subtitle: 'Ровная скорость + синхронизация кривой',
      icon: Gauge,
      accent: 'text-sky-400',
    },
    {
      id: 'indoor',
      title: 'Превратить в Indoor',
      subtitle: 'Комбо: без GPS/высоты + тип + скорость',
      icon: Home,
      accent: 'text-amber-400',
    },
    {
      id: 'calories',
      title: 'Калории (totalCalories)',
      subtitle: 'Авторасчёт (Power/HR/Dist/MET) или вручную',
      icon: Flame,
      accent: 'text-orange-400',
    },
    {
      id: 'activityType',
      title: 'Тип активности (Sport)',
      subtitle: 'Смена sport и subSport во всех секциях',
      icon: Bike,
      accent: 'text-emerald-400',
    },
    {
      id: 'recalculate',
      title: 'Пересчитать итоги из record',
      subtitle: 'Синхронизация session и lap с record',
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
                  Вырезать секции данных
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Удаляет выбранные каналы из <code className="text-slate-300">record</code> и
                  одновременно очищает связанные сводные поля в{' '}
                  <code className="text-slate-300">lap</code> и{' '}
                  <code className="text-slate-300">session</code>.
                </p>
              </div>
              {presentCore.length > 1 && (
                <button
                  type="button"
                  onClick={() => stripMultipleChannels(presentCore)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 cursor-pointer"
                >
                  Вырезать GPS + Elevation + Speed
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
                          {ch.label}
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
                            : 'отсутствует'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        {ch.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!stats.present}
                      onClick={() => stripChannel(ch.key)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Удалить
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
                Коррекция дистанции с пересчётом скорости
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Текущая дистанция:{' '}
                <strong className="text-slate-200">
                  {formatDistanceKm(summary.totalDistance)}
                </strong>
                . Пропорционально обновляет <code className="text-slate-300">record.distance</code>,{' '}
                <code className="text-slate-300">lap.totalDistance</code> и{' '}
                <code className="text-slate-300">session.totalDistance</code>.
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
                  Целевая дистанция (км)
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
                  Как пересчитать скорость:
                </label>
                <select
                  value={speedPolicy}
                  onChange={(e) =>
                    setSpeedPolicy(e.target.value as SpeedPolicyOnDistanceEdit)
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="scale">Пропорционально отмасштабировать (сохранить профиль)</option>
                  <option value="average">Заполнить ровной средней скоростью</option>
                  <option value="strip">Вырезать скорость полностью</option>
                  <option value="keep">Не трогать скорость</option>
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
                  <span>
                    Выровнять кривую <code className="text-slate-300">record.distance</code>{' '}
                    (чтобы Strava тоже показывала ровную скорость)
                  </span>
                </label>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  Применить новую дистанцию
                </button>
                <button
                  type="button"
                  disabled={summary.totalDistance == null}
                  onClick={stripDistanceAction}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-35 cursor-pointer"
                >
                  Удалить Distance целиком
                </button>
              </div>
            </form>
          </div>
        )}

        {activeId === 'speed' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Средняя скорость по общей дистанции
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Заменяет все значения скорости в <code className="text-slate-300">record</code>,{' '}
                <code className="text-slate-300">lap</code> и{' '}
                <code className="text-slate-300">session</code> на ровную среднюю скорость.
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
                Timer time
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
                Elapsed time
              </button>
            </div>

            <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-4 py-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Расчётная средняя скорость:</span>
              <span className="font-mono font-semibold text-sky-300">
                {previewAvgMps != null
                  ? `${formatSpeedKmh(previewAvgMps)} · ${formatPaceMinKm(previewAvgMps)}`
                  : 'Нужна дистанция'}
              </span>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={syncDistOnAvgSpeed}
                onChange={(e) => setSyncDistOnAvgSpeed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-sky-500"
              />
              <span>
                Синхронизировать кривую <code className="text-slate-300">record.distance</code> со
                средней скоростью (рекомендуется для Strava)
              </span>
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
                Выставить среднюю скорость
              </button>
              <button
                type="button"
                disabled={!summary.channels.speed.present}
                onClick={() => stripChannel('speed')}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-35 cursor-pointer"
              >
                Вырезать скорость полностью
              </button>
            </div>
          </div>
        )}

        {activeId === 'indoor' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Превратить в Indoor-тренировку (комбо-сценарий)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                За один шаг вырезает <strong>GPS</strong> и <strong>Elevation</strong>, меняет тип
                активности на велостанок или беговую дорожку, и приводит в порядок дистанцию и
                скорость.
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
                <div className="text-xs font-semibold">Велостанок</div>
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
                <div className="text-xs font-semibold">Беговая дорожка</div>
                <div className="text-[11px] font-mono opacity-75 mt-0.5">
                  running · treadmill
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Дистанция (км, пусто — не менять)
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
                  Режим скорости
                </label>
                <select
                  value={indoorSpeedMode}
                  onChange={(e) =>
                    setIndoorSpeedMode(e.target.value as 'average' | 'strip' | 'keep')
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="average">Выровнять в среднюю</option>
                  <option value="strip">Вырезать скорость</option>
                  <option value="keep">Не трогать скорость</option>
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
              Применить Indoor-сценарий
            </button>
          </div>
        )}

        {activeId === 'calories' && (
          <div className="max-w-xl space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Калории (<code className="text-orange-300">totalCalories</code>)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Текущее значение в <code className="text-slate-300">session</code>:{' '}
                <strong className="text-slate-200">
                  {summary.totalCalories != null
                    ? `${summary.totalCalories} ккал`
                    : 'не задано'}
                </strong>
                . При записи значение также пропорционально раскладывается по{' '}
                <code className="text-slate-300">lap.totalCalories</code>.
              </p>
            </div>

            {/* Auto-estimate */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-200">
                Авторасчёт по формуле
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Вес (кг)</label>
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
                  <label className="block text-[11px] text-slate-400 mb-1">Возраст</label>
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
                  <label className="block text-[11px] text-slate-400 mb-1">Пол</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as AthleteSex)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-slate-200"
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Метод расчёта
                </label>
                <select
                  value={calMethod}
                  onChange={(e) => setCalMethod(e.target.value as CalorieMethod)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="power">По мощности (1 кДж ≈ 1 ккал)</option>
                  <option value="heartRate">По пульсу (Keytel 2005)</option>
                  <option value="distance">По дистанции и весу (Margaria)</option>
                  <option value="met">По типу активности и времени (MET)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  Оценка:{' '}
                  <strong className="font-mono text-orange-300">
                    {estimatedKcal != null ? `${estimatedKcal} ккал` : 'нет данных для метода'}
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
                  Записать оценку
                </button>
              </div>
            </div>

            {/* Manual input + strip */}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-slate-400 mb-1">
                  Или ввести вручную (ккал)
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
                Задать
              </button>
              <button
                type="button"
                disabled={summary.totalCalories == null}
                onClick={stripCaloriesAction}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-35 cursor-pointer"
              >
                Удалить калории
              </button>
            </div>
          </div>
        )}

        {activeId === 'activityType' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Тип активности (<code className="text-emerald-300">sport</code> /{' '}
                <code className="text-emerald-300">subSport</code>)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Обновляет <code className="text-slate-300">sport</code> и{' '}
                <code className="text-slate-300">subSport</code> во всех сообщениях{' '}
                <code className="text-slate-300">session</code>,{' '}
                <code className="text-slate-300">lap</code> и{' '}
                <code className="text-slate-300">sport</code>.
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
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sport</label>
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
                <label className="block text-xs text-slate-400 mb-1">Sub-sport</label>
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
              Применить тип активности
            </button>
          </div>
        )}

        {activeId === 'recalculate' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Пересчитать итоги <code className="text-cyan-300">session</code> и{' '}
                <code className="text-cyan-300">lap</code> из{' '}
                <code className="text-cyan-300">record</code>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Полезно после ручных правок в «Сырых FIT-данных» или для починки битых файлов:
                заново вычисляет <code className="text-slate-300">totalDistance</code>,{' '}
                <code className="text-slate-300">avg/maxSpeed</code>,{' '}
                <code className="text-slate-300">totalAscent/Descent</code>,{' '}
                <code className="text-slate-300">avg/maxHeartRate</code>,{' '}
                <code className="text-slate-300">avg/maxPower</code>,{' '}
                <code className="text-slate-300">avg/maxCadence</code> и GPS bounding box по
                фактическим точкам <code className="text-slate-300">record</code>. Если какой-то
                канал отсутствует в <code className="text-slate-300">record</code>, его устаревшие
                итоги удаляются.
              </p>
            </div>

            <button
              type="button"
              onClick={recalculateSummaryAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Пересчитать все итоги сейчас
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
