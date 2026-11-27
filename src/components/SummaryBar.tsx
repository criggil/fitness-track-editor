import { useI18n } from '../i18n';
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
  wasLabel?: string;
}

function MetricCard({ label, value, sub, changed, wasLabel }: MetricCardProps) {
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
      {changed && wasLabel ? (
        <div className="text-[11px] text-sky-400 truncate">{wasLabel}</div>
      ) : sub ? (
        <div className="text-[11px] text-slate-500 truncate">{sub}</div>
      ) : null}
    </div>
  );
}

export function SummaryBar() {
  const { t } = useI18n();
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
        label={t('summary.distance')}
        value={formatDistanceKm(summary.totalDistance)}
        sub={t('summary.laps', { count: summary.lapCount })}
        changed={distChanged}
        wasLabel={t('summary.was', {
          value: formatDistanceKm(original.totalDistance),
        })}
      />
      <MetricCard
        label={t('summary.timerTime')}
        value={formatDuration(summary.totalTimerTime)}
        sub={t('summary.elapsedTime', {
          value: formatDuration(summary.totalElapsedTime),
        })}
      />
      <MetricCard
        label={t('summary.avgSpeed')}
        value={formatSpeedKmh(summary.avgSpeed)}
        sub={formatPaceMinKm(summary.avgSpeed)}
        changed={speedChanged}
        wasLabel={t('summary.was', {
          value: formatSpeedKmh(original.avgSpeed),
        })}
      />
      <MetricCard
        label={t('summary.ascent')}
        value={formatElevation(summary.totalAscent)}
        sub={
          summary.totalDescent != null
            ? t('summary.descent', { value: formatElevation(summary.totalDescent) })
            : summary.channels.elevation.present
              ? t('summary.elevationPresent')
              : t('summary.elevationStripped')
        }
        changed={ascentChanged}
        wasLabel={t('summary.was', {
          value: formatElevation(original.totalAscent),
        })}
      />
      <MetricCard
        label={t('summary.gpsTrack')}
        value={summary.channels.gps.present ? t('common.yes') : t('common.no')}
        sub={t('summary.points', { count: summary.channels.gps.recordCount })}
        changed={gpsChanged}
        wasLabel={t('summary.was', {
          value: original.channels.gps.present ? t('common.yes') : t('common.no'),
        })}
      />
      <MetricCard
        label={t('summary.hrPower')}
        value={
          summary.avgHeartRate != null
            ? `${summary.avgHeartRate} ${t('unit.bpm')}`
            : summary.avgPower != null
              ? `${summary.avgPower} ${t('unit.w')}`
              : '—'
        }
        sub={
          summary.avgPower != null && summary.avgHeartRate != null
            ? t('summary.avgPowerSub', { value: summary.avgPower })
            : t('summary.recordsCount', { count: summary.recordCount })
        }
      />
      <MetricCard
        label={t('summary.calories')}
        value={
          summary.totalCalories != null
            ? `${summary.totalCalories} ${t('unit.kcal')}`
            : '—'
        }
        sub="session.totalCalories"
        changed={kcalChanged}
        wasLabel={t('summary.was', {
          value:
            original.totalCalories != null
              ? `${original.totalCalories} ${t('unit.kcal')}`
              : '—',
        })}
      />
    </div>
  );
}
