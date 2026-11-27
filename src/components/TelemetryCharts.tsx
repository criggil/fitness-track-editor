import { useEffect, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import { useI18n } from '../i18n';
import { useTrackStore } from '../store/useTrackStore';
import { formatDuration } from '../utils/format';

interface ChartSpec {
  id: string;
  title: string;
  unit: string;
  color: string;
  fill: string;
  xValues: number[];
  yValues: number[];
  pointCount: number;
}

const SYNC_KEY = 'fit-telemetry-sync';

/**
 * Extracts dense, strictly increasing (x, y) pairs for a single channel.
 * Real-world .FIT files (e.g. Wahoo / Apple Watch / Strava) frequently emit
 * interleaved sparse record messages (GPS in one record, HR in the next at the
 * same or adjacent timestamp). Filtering out nulls and collapsing duplicate
 * timestamps ensures uPlot always renders a continuous line.
 */
function buildDenseSeries(
  elapsedSec: number[],
  values: (number | null)[],
  transform?: (v: number) => number,
): { xValues: number[]; yValues: number[] } {
  const xValues: number[] = [];
  const yValues: number[] = [];

  for (let i = 0; i < elapsedSec.length; i++) {
    const raw = values[i];
    if (raw == null || !Number.isFinite(raw)) continue;
    const x = elapsedSec[i];
    if (!Number.isFinite(x)) continue;
    const y = transform ? transform(raw) : raw;

    const lastIdx = xValues.length - 1;
    if (lastIdx >= 0 && xValues[lastIdx] === x) {
      yValues[lastIdx] = y;
    } else if (lastIdx >= 0 && x < xValues[lastIdx]) {
      // Skip out-of-order timestamps to preserve monotonicity for uPlot
      continue;
    } else {
      xValues.push(x);
      yValues.push(y);
    }
  }

  return { xValues, yValues };
}

function SingleChart({
  spec,
  xMin,
  xMax,
  timeLabel,
  pointsMeta,
  onHoverTime,
}: {
  spec: ChartSpec;
  xMin: number;
  xMax: number;
  timeLabel: string;
  pointsMeta: string;
  onHoverTime: (elapsedSec: number | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || spec.xValues.length === 0) return;

    const sync = uPlot.sync(SYNC_KEY);
    const width = Math.max(260, el.clientWidth);

    const opts: uPlot.Options = {
      width,
      height: 145,
      padding: [8, 12, 0, 0],
      cursor: {
        sync: {
          key: sync.key,
          scales: ['x', null],
          setSeries: true,
        },
        y: false,
      },
      legend: {
        show: true,
      },
      scales: {
        x: {
          time: false,
          range: () => [xMin, Math.max(xMax, xMin + 1)],
        },
      },
      axes: [
        {
          stroke: '#64748b',
          grid: { stroke: '#1e293b', width: 1 },
          ticks: { stroke: '#334155', width: 1 },
          values: (_u, vals) => vals.map((v) => formatDuration(v)),
          font: '11px ui-monospace, monospace',
        },
        {
          stroke: '#64748b',
          grid: { stroke: '#1e293b', width: 1 },
          ticks: { stroke: '#334155', width: 1 },
          size: 48,
          font: '11px ui-monospace, monospace',
        },
      ],
      series: [
        {
          label: timeLabel,
          value: (_u, v) => (v == null ? '—' : formatDuration(v)),
        },
        {
          label: `${spec.title} (${spec.unit})`,
          stroke: spec.color,
          fill: spec.fill,
          width: 2,
          spanGaps: true,
          points: { show: spec.xValues.length <= 2 },
          value: (_u, v) =>
            v == null ? '—' : `${v.toFixed(spec.id === 'distance' ? 2 : 1)} ${spec.unit}`,
        },
      ],
      hooks: {
        setCursor: [
          (u) => {
            const idx = u.cursor.idx;
            if (typeof idx === 'number' && u.data[0][idx] != null) {
              onHoverTime(u.data[0][idx]);
            } else {
              onHoverTime(null);
            }
          },
        ],
      },
    };

    const data: uPlot.AlignedData = [spec.xValues, spec.yValues];

    const plot = new uPlot(opts, data, el);
    sync.sub(plot);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 100) {
          plot.setSize({ width: w, height: 145 });
        }
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      sync.unsub(plot);
      plot.destroy();
    };
  }, [spec, xMin, xMax, timeLabel, onHoverTime]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-300">{spec.title}</span>
        <span className="text-[11px] font-mono text-slate-500">{pointsMeta}</span>
      </div>
      <div ref={wrapRef} className="w-full" />
    </div>
  );
}

export function TelemetryCharts() {
  const { t, locale } = useI18n();
  const projection = useTrackStore((s) => s.projection);
  const setHoverElapsedSec = useTrackStore((s) => s.setHoverElapsedSec);

  const { charts, xMin, xMax } = useMemo(() => {
    if (!projection || projection.length === 0) {
      return { charts: [] as ChartSpec[], xMin: 0, xMax: 1 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    for (const x of projection.elapsedSec) {
      if (Number.isFinite(x)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (!Number.isFinite(minX)) minX = 0;
    if (!Number.isFinite(maxX)) maxX = 1;

    const list: ChartSpec[] = [];

    const addChart = (
      id: string,
      title: string,
      unit: string,
      color: string,
      fill: string,
      values: (number | null)[],
      transform?: (v: number) => number,
    ) => {
      const dense = buildDenseSeries(projection.elapsedSec, values, transform);
      if (dense.xValues.length > 0) {
        list.push({
          id,
          title,
          unit,
          color,
          fill,
          xValues: dense.xValues,
          yValues: dense.yValues,
          pointCount: dense.xValues.length,
        });
      }
    };

    addChart(
      'speed',
      t('charts.speed'),
      t('unit.kmh'),
      '#38bdf8',
      'rgba(56, 189, 248, 0.12)',
      projection.speed,
      (v) => Number((v * 3.6).toFixed(2)),
    );

    addChart(
      'elevation',
      t('charts.elevation'),
      t('unit.m'),
      '#34d399',
      'rgba(52, 211, 153, 0.12)',
      projection.altitude,
    );

    addChart(
      'distance',
      t('charts.distance'),
      t('unit.km'),
      '#a78bfa',
      'rgba(167, 139, 250, 0.12)',
      projection.distance,
      (v) => Number((v / 1000).toFixed(3)),
    );

    addChart(
      'hr',
      t('charts.heartRate'),
      t('unit.bpm'),
      '#fb7185',
      'rgba(251, 113, 133, 0.12)',
      projection.heartRate,
    );

    addChart(
      'power',
      t('charts.power'),
      t('unit.w'),
      '#fbbf24',
      'rgba(251, 191, 36, 0.12)',
      projection.power,
    );

    return { charts: list, xMin: minX, xMax: maxX };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projection, locale]);

  if (!projection || charts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-500">
        {t('charts.empty')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {charts.map((spec) => (
        <SingleChart
          key={spec.id}
          spec={spec}
          xMin={xMin}
          xMax={xMax}
          timeLabel={t('charts.time')}
          pointsMeta={t('charts.pointsMeta', {
            count: spec.pointCount.toLocaleString(),
            unit: spec.unit,
          })}
          onHoverTime={setHoverElapsedSec}
        />
      ))}
    </div>
  );
}
