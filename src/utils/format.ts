export function formatDistanceKm(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return '—';
  return `${(meters / 1000).toFixed(2)} км`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatSpeedKmh(mps: number | null): string {
  if (mps == null || !Number.isFinite(mps)) return '—';
  return `${(mps * 3.6).toFixed(1)} км/ч`;
}

export function formatPaceMinKm(mps: number | null): string {
  if (mps == null || !Number.isFinite(mps) || mps <= 0.05) return '—';
  const secPerKm = 1000 / mps;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /км`;
}

export function formatElevation(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return '—';
  return `${Math.round(meters)} м`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatFitValue(val: unknown): string {
  if (val == null) return 'null';
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'number') {
    return Number.isInteger(val) ? String(val) : val.toFixed(4).replace(/\.?0+$/, '');
  }
  if (Array.isArray(val)) {
    return `[${val.slice(0, 6).map(formatFitValue).join(', ')}${val.length > 6 ? ', …' : ''}]`;
  }
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
