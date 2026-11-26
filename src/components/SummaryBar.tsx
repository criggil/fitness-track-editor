import { useTrackStore } from '../store/useTrackStore';
import {
  formatDistanceKm,
  formatDuration,
  formatElevation,
  formatPaceMinKm,
  formatSpeedKmh,
} from '../utils/format';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  changed?: boolean;
  originalValue?: string;
}

function MetricCard({ label, value, sub, changed, originalValue }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 transition-colors ${
        changed
          ? 'border-sky-500/40 bg-sky-500/5'
          : 'border-slate-800 bg-slate-900/70'
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
        {label}
      </div>
      <div className="text-lg font-semibold text-slate-100 tabular-nums mt-0.5">
        {value}
      </div>
      {changed && originalValue ? (
        <div className="text-[11px] text-sky-400 truncate">
          было: {originalValue}
        </div>
      ) : sub ? (
        <div className="text-[11px] text-slate-500 truncate">{sub}</div>
      ) : null}
    </div>
  );
}

export function SummaryBar() {
  const summary = useTrackStore((s) => s.summary);
  const original = useTrackStore((s) => s.originalSummary);

  if (!summary || !original) return null;

  const distChanged =
    (summary.totalDistance ?? -1) !== (original.totalDistance ?? -1);
  const speedChanged =
    Math.abs((summary.avgSpeed ?? -1) - (original.avgSpeed ?? -1)) > 0.005;
  const ascentChanged =
    (summary.totalAscent ?? -1) !== (original.totalAscent ?? -1);
  const gpsChanged = summary.channels.gps.present !== original.channels.gps.present;
  const kcalChanged =
    (summary.totalCalories ?? -1) !== (original.totalCalories ?? -1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
      <MetricCard
        label="Дистанция"
        value={formatDistanceKm(summary.totalDistance)}
        sub={`${summary.lapCount} кр.`}
        changed={distChanged}
        originalValue={formatDistanceKm(original.totalDistance)}
      />
      <MetricCard
        label="Время (таймер)"
        value={formatDuration(summary.totalTimerTime)}
        sub={`всего: ${formatDuration(summary.totalElapsedTime)}`}
      />
      <MetricCard
        label="Ср. скорость"
        value={formatSpeedKmh(summary.avgSpeed)}
        sub={formatPaceMinKm(summary.avgSpeed)}
        changed={speedChanged}
        originalValue={formatSpeedKmh(original.avgSpeed)}
      />
      <MetricCard
        label="Набор высоты"
        value={formatElevation(summary.totalAscent)}
        sub={
          summary.totalDescent != null
            ? `спуск: ${formatElevation(summary.totalDescent)}`
            : summary.channels.elevation.present
              ? 'Elevation есть'
              : 'Elevation вырезан'
        }
        changed={ascentChanged}
        originalValue={formatElevation(original.totalAscent)}
      />
      <MetricCard
        label="GPS трек"
        value={summary.channels.gps.present ? 'Есть' : 'Нет'}
        sub={`${summary.channels.gps.recordCount} точек`}
        changed={gpsChanged}
        originalValue={original.channels.gps.present ? 'Есть' : 'Нет'}
      />
      <MetricCard
        label="Пульс / Мощность"
        value={
          summary.avgHeartRate != null
            ? `${summary.avgHeartRate} уд/м`
            : summary.avgPower != null
              ? `${summary.avgPower} Вт`
              : '—'
        }
        sub={
          summary.avgPower != null && summary.avgHeartRate != null
            ? `${summary.avgPower} Вт ср.`
            : `${summary.recordCount} записей`
        }
      />
      <MetricCard
        label="Калории"
        value={
          summary.totalCalories != null ? `${summary.totalCalories} ккал` : '—'
        }
        sub="session.totalCalories"
        changed={kcalChanged}
        originalValue={
          original.totalCalories != null ? `${original.totalCalories} ккал` : '—'
        }
      />
    </div>
  );
}
