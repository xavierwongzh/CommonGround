'use client';

import { useApp } from '@/context/AppContext';
import { OVERLAP_COLOUR } from '@/lib/colours';
import { IsochronePolygon, Location } from '@/types';
import { cn } from './ui/cn';

const MODE_ICONS: Record<string, string> = {
  public_transport: '🚇',
  walking: '🚶',
  cycling: '🚲',
  driving: '🚗',
};

export function Legend() {
  const { state } = useApp();
  const dark = state.isDarkMode;

  if (state.locations.length === 0 && state.isochrones.length === 0) return null;

  // Unique location + mode combos that have isochrones
  const isoGroups = state.isochrones.reduce(
    (acc, iso: IsochronePolygon) => {
      const key = `${iso.locationId}-${iso.travelMode}`;
      if (!acc[key]) {
        const loc = state.locations.find((l: Location) => l.id === iso.locationId);
        if (loc) acc[key] = { loc, mode: iso.travelMode, thresholds: [] };
      }
      if (acc[key]) acc[key].thresholds.push(iso.timeThreshold);
      return acc;
    },
    {} as Record<string, { loc: Location; mode: string; thresholds: number[] }>
  );

  return (
    <div
      className={cn(
        'absolute bottom-4 left-4 rounded-xl border p-3 text-xs max-w-[220px] shadow-lg backdrop-blur-sm',
        dark ? 'bg-gray-900/90 border-gray-700 text-gray-300' : 'bg-white/90 border-gray-200 text-gray-700'
      )}
    >
      <p className="font-semibold mb-2 text-[11px] uppercase tracking-wider">Legend</p>

      <div className="space-y-2">
        {Object.values(isoGroups).map(({ loc, mode, thresholds }) => (
          <div key={`${loc.id}-${mode}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: loc.colour, opacity: 0.7 }}
            />
            <div className="min-w-0">
              <span className="font-medium truncate block">{loc.name}</span>
              <span className={cn('text-[10px]', dark ? 'text-gray-500' : 'text-gray-400')}>
                {MODE_ICONS[mode]} {thresholds.sort((a, b) => a - b).map((t) => `${t}m`).join(', ')}
              </span>
            </div>
          </div>
        ))}

        {state.showOverlap && state.overlapResults.length > 0 && (
          <div className="flex items-center gap-2 pt-1.5 border-t border-dashed" style={{
            borderColor: dark ? '#374151' : '#e5e7eb'
          }}>
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: OVERLAP_COLOUR, opacity: 0.7 }}
            />
            <span className="text-[11px]">Overlap zone</span>
          </div>
        )}

        {state.places.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-orange-400" />
            <span className="text-[11px]">Places ({state.places.length})</span>
          </div>
        )}
      </div>

      {state.isochrones.some((i: IsochronePolygon) => i.isMock) && (
        <p className={cn(
          'mt-2 pt-2 border-t text-[10px]',
          dark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
        )}>
          ⚠ Mock isochrones (add API key for real data)
        </p>
      )}
    </div>
  );
}
