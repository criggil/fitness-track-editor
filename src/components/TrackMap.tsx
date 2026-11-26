import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapPinOff } from 'lucide-react';
import { useTrackStore } from '../store/useTrackStore';

const OSM_DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -0.35,
        'raster-brightness-max': 0.85,
      },
    },
  ],
};

export function TrackMap() {
  const projection = useTrackStore((s) => s.projection);
  const hoverElapsedSec = useTrackStore((s) => s.hoverElapsedSec);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverMarkerRef = useRef<maplibregl.Marker | null>(null);

  const hasCoords = Boolean(projection && projection.coordinates.length > 0);

  useEffect(() => {
    if (!hasCoords || !containerRef.current || !projection) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_DARK_STYLE,
      center: projection.coordinates[0],
      zoom: 12,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const coords = projection.coordinates;
    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];

    map.on('load', () => {
      map.addSource('track', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        },
      });

      map.addLayer({
        id: 'track-casing',
        type: 'line',
        source: 'track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0f172a',
          'line-width': 6,
          'line-opacity': 0.75,
        },
      });

      map.addLayer({
        id: 'track-line',
        type: 'line',
        source: 'track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 3.5,
        },
      });

      // Start & Finish markers
      const makeDot = (color: string) => {
        const el = document.createElement('div');
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '9999px';
        el.style.backgroundColor = color;
        el.style.border = '2px solid #0f172a';
        el.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.4)';
        return el;
      };

      new maplibregl.Marker({ element: makeDot('#22c55e') })
        .setLngLat(startCoord)
        .addTo(map);
      new maplibregl.Marker({ element: makeDot('#ef4444') })
        .setLngLat(endCoord)
        .addTo(map);

      if (projection.bounds) {
        map.fitBounds(
          [
            [projection.bounds.minLon, projection.bounds.minLat],
            [projection.bounds.maxLon, projection.bounds.maxLat],
          ],
          { padding: 36, duration: 0 },
        );
      }
    });

    return () => {
      hoverMarkerRef.current?.remove();
      hoverMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [hasCoords, projection]);

  // Sync hover marker from uPlot charts by elapsed time (nearest GPS point)
  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !projection ||
      hoverElapsedSec == null ||
      projection.coordinates.length === 0
    ) {
      hoverMarkerRef.current?.remove();
      hoverMarkerRef.current = null;
      return;
    }

    const { coordToRecordIndex, elapsedSec, coordinates } = projection;
    let lo = 0;
    let hi = coordToRecordIndex.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (elapsedSec[coordToRecordIndex[mid]] < hoverElapsedSec) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    let best = lo;
    if (
      lo > 0 &&
      Math.abs(elapsedSec[coordToRecordIndex[lo - 1]] - hoverElapsedSec) <
        Math.abs(elapsedSec[coordToRecordIndex[lo]] - hoverElapsedSec)
    ) {
      best = lo - 1;
    }

    const [lon, lat] = coordinates[best];

    if (!hoverMarkerRef.current) {
      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '9999px';
      el.style.backgroundColor = '#f59e0b';
      el.style.border = '2px solid #ffffff';
      el.style.boxShadow = '0 0 10px rgba(245,158,11,0.8)';
      hoverMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(map);
    } else {
      hoverMarkerRef.current.setLngLat([lon, lat]);
    }
  }, [hoverElapsedSec, projection]);

  if (!hasCoords) {
    return (
      <div className="h-[300px] rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center text-center p-6">
        <MapPinOff className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-300">
          GPS-координаты отсутствуют
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          В текущем FIT-файле нет GPS-точек (либо секция GPS была вырезана). Карта недоступна, но
          остальные графики и поля FIT можно редактировать.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] rounded-2xl border border-slate-800 overflow-hidden bg-slate-900">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 pointer-events-none">
        {projection?.coordinates.length.toLocaleString()} GPS-точек
      </div>
    </div>
  );
}
