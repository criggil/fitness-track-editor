import { useEffect, useState } from 'react';
import {
  Bike,
  Gauge,
  MapPinOff,
  Mountain,
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
import { useTrackStore } from '../store/useTrackStore';
import { formatPaceMinKm, formatSpeedKmh } from '../utils/format';

const PRIMARY_CHANNELS: {
  key: ChannelKey;
  label: string;
  desc: string;
}[] = [
  {
    key: 'gps',
    label: 'GPS',
    desc: 'positionLat/Long в record + start/end/bounding box в lap/session',
  },
  {
    key: 'elevation',
    label: 'Elevation',
    desc: 'altitude/enhancedAltitude/grade + ascent/descent в lap/session',
  },
  {
    key: 'speed',
    label: 'Speed',
    desc: 'speed/enhancedSpeed + avg/maxSpeed в lap/session',
  },
];

const EXTRA_CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: 'heartRate', label: 'Heart Rate' },
  { key: 'power', label: 'Power' },
  { key: 'cadence', label: 'Cadence' },
  { key: 'temperature', label: 'Temperature' },
];

export function EditPanel() {
  const summary = useTrackStore((s) => s.summary);
  const stripChannel = useTrackStore((s) => s.stripChannel);
  const stripMultipleChannels = useTrackStore((s) => s.stripMultipleChannels);
  const editDistanceAction = useTrackStore((s) => s.editDistanceAction);
  const stripDistanceAction = useTrackStore((s) => s.stripDistanceAction);
  const applyAverageSpeedAction = useTrackStore((s) => s.applyAverageSpeedAction);
  const editActivityTypeAction = useTrackStore((s) => s.editActivityTypeAction);

  const [sportInput, setSportInput] = useState<string>('generic');
  const [subSportInput, setSubSportInput] = useState<string>('generic');

  const [distanceKmInput, setDistanceKmInput] = useState<string>('');
  const [speedPolicy, setSpeedPolicy] = useState<SpeedPolicyOnDistanceEdit>('scale');
  const [syncDistOnDistEdit, setSyncDistOnDistEdit] = useState<boolean>(true);

  const [timeBase, setTimeBase] = useState<AverageSpeedTimeBase>('timer');
  const [syncDistOnAvgSpeed, setSyncDistOnAvgSpeed] = useState<boolean>(true);

  useEffect(() => {
    setSportInput(summary?.sport ?? 'generic');
    setSubSportInput(summary?.subSport ?? 'generic');
  }, [summary?.sport, summary?.subSport]);

  useEffect(() => {
    if (summary?.totalDistance != null) {
      setDistanceKmInput((summary.totalDistance / 1000).toFixed(2));
    } else {
      setDistanceKmInput('');
    }
  }, [summary?.totalDistance]);

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

  const presentPrimary = PRIMARY_CHANNELS.filter(
    (c) => summary.channels[c.key].present,
  ).map((c) => c.key);

  const handleApplyDistance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedKm = Number.parseFloat(distanceKmInput.replace(',', '.'));
    if (!Number.isFinite(parsedKm) || parsedKm < 0) return;
    editDistanceAction({
      targetDistanceMeters: parsedKm * 1000,
      speedPolicy,
      timeBase,
      syncDistanceCurve: syncDistOnDistEdit,
    });
  };

  const activityTypeUnchanged =
    sportInput === (summary.sport ?? 'generic') &&
    subSportInput === (summary.subSport ?? 'generic');

  return (
    <aside className="space-y-4">
      {/* 0. Activity Type */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Bike className="w-4 h-4 text-emerald-400" />
          Тип активности (Sport)
        </h2>

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
                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="fit-sport"
              className="block text-[11px] text-slate-400 mb-1"
            >
              Sport
            </label>
            <select
              id="fit-sport"
              value={sportInput}
              onChange={(e) => setSportInput(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {ALL_FIT_SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="fit-subsport"
              className="block text-[11px] text-slate-400 mb-1"
            >
              Sub-sport
            </label>
            <select
              id="fit-subsport"
              value={subSportInput}
              onChange={(e) => setSubSportInput(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
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
          disabled={activityTypeUnchanged}
          onClick={() =>
            editActivityTypeAction({
              sport: sportInput,
              subSport: subSportInput,
            })
          }
          className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Применить тип активности
        </button>
      </section>

      {/* 1. Strip Sections */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-rose-400" />
            Вырезать секции FIT
          </h2>
          {presentPrimary.length > 1 && (
            <button
              type="button"
              onClick={() => stripMultipleChannels(presentPrimary)}
              className="text-[11px] font-medium text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              Вырезать все 3
            </button>
          )}
        </div>

        <div className="space-y-2">
          {PRIMARY_CHANNELS.map((ch) => {
            const stats = summary.channels[ch.key];
            return (
              <div
                key={ch.key}
                className={`rounded-xl border p-3 flex items-start justify-between gap-3 ${
                  stats.present
                    ? 'border-slate-800 bg-slate-950/60'
                    : 'border-slate-800/50 bg-slate-950/30 opacity-60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
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
                        : 'удалено'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {ch.desc}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!stats.present}
                  onClick={() => stripChannel(ch.key)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Вырезать
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-1 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-500 mb-2">Дополнительные каналы:</div>
          <div className="flex flex-wrap gap-1.5">
            {EXTRA_CHANNELS.map((ch) => {
              const present = summary.channels[ch.key].present;
              return (
                <button
                  key={ch.key}
                  type="button"
                  disabled={!present}
                  onClick={() => stripChannel(ch.key)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Edit Distance */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Ruler className="w-4 h-4 text-violet-400" />
          Дистанция (Distance)
        </h2>

        <form onSubmit={handleApplyDistance} className="space-y-3">
          <div>
            <label
              htmlFor="target-distance-km"
              className="block text-xs text-slate-400 mb-1"
            >
              Итоговая дистанция (км)
            </label>
            <div className="flex gap-2">
              <input
                id="target-distance-km"
                type="number"
                step="0.01"
                min="0"
                value={distanceKmInput}
                onChange={(e) => setDistanceKmInput(e.target.value)}
                placeholder="10.00"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="shrink-0 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
              >
                Применить
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="speed-policy"
              className="block text-xs text-slate-400 mb-1"
            >
              Что сделать со скоростью при изменении дистанции:
            </label>
            <select
              id="speed-policy"
              value={speedPolicy}
              onChange={(e) =>
                setSpeedPolicy(e.target.value as SpeedPolicyOnDistanceEdit)
              }
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="scale">Пропорционально отмасштабировать</option>
              <option value="average">Заполнить средней скоростью</option>
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
        </form>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Или убрать поля distance целиком
          </span>
          <button
            type="button"
            disabled={summary.totalDistance == null}
            onClick={stripDistanceAction}
            className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-35 cursor-pointer"
          >
            Удалить Distance
          </button>
        </div>
      </section>

      {/* 3. Average Speed */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-sky-400" />
          Скорость по общей дистанции
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          Заменяет все значения скорости в <code className="text-slate-300">record</code>,{' '}
          <code className="text-slate-300">lap</code> и{' '}
          <code className="text-slate-300">session</code> на ровную среднюю скорость.
        </p>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setTimeBase('timer')}
            className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
            className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              timeBase === 'elapsed'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Elapsed time
          </button>
        </div>

        <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">Расчётная средняя:</span>
          <span className="font-mono font-semibold text-sky-300">
            {previewAvgMps != null
              ? `${formatSpeedKmh(previewAvgMps)} (${formatPaceMinKm(previewAvgMps)})`
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
            средней скоростью
          </span>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={previewAvgMps == null}
            onClick={() =>
              applyAverageSpeedAction({
                timeBase,
                syncDistanceCurve: syncDistOnAvgSpeed,
              })
            }
            className="flex-1 py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-semibold disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Выставить среднюю скорость
          </button>
          <button
            type="button"
            disabled={!summary.channels.speed.present}
            onClick={() => stripChannel('speed')}
            title="Вырезать скорость полностью"
            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Quick hint */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-500 flex items-start gap-2">
        <div className="flex items-center gap-1 text-slate-400 shrink-0 mt-0.5">
          <MapPinOff className="w-3.5 h-3.5" />
          <Mountain className="w-3.5 h-3.5" />
        </div>
        <span>
          Все остальные сообщения FIT (пульс, мощность, круги, устройство, developer fields)
          сохраняются при экспорте.
        </span>
      </div>
    </aside>
  );
}
