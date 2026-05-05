'use client';

import { Eye, EyeOff, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Location, TimeThreshold, TravelMode } from '@/types';
import { useApp } from '@/context/AppContext';
import { TravelModeSelector } from './TravelModeSelector';
import { TimeThresholdSelector } from './TimeThresholdSelector';
import { cn } from './ui/cn';

interface Props {
  location: Location;
}

export function LocationCard({ location }: Props) {
  const {
    state, removeLocation, updateLocation, toggleLocationVisibility,
    generateIsochrone, loadingIds,
  } = useApp();
  const dark = state.isDarkMode;
  const isGenerating = loadingIds.has(`${location.id}-generating`);

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-all',
        dark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200',
        !location.isVisible && 'opacity-60'
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div
          className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
          style={{ backgroundColor: location.colour }}
        />

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold truncate', dark ? 'text-white' : 'text-gray-900')}>
            {location.name}
          </p>
          <p className={cn('text-[11px] truncate mt-0.5', dark ? 'text-gray-400' : 'text-gray-500')}>
            {location.address}
          </p>
          {location.postalCode && (
            <span className={cn(
              'inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-mono',
              dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            )}>
              S{location.postalCode}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          {/* Manual refresh */}
          <button
            onClick={() => generateIsochrone(location.id)}
            disabled={isGenerating}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
              'disabled:opacity-40'
            )}
            title="Refresh isochrone"
          >
            {isGenerating
              ? <Loader2 size={13} className="animate-spin text-blue-500" />
              : <RefreshCw size={13} />
            }
          </button>

          <button
            onClick={() => toggleLocationVisibility(location.id)}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            )}
            title={location.isVisible ? 'Hide' : 'Show'}
          >
            {location.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          <button
            onClick={() => removeLocation(location.id)}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              dark
                ? 'hover:bg-red-900/40 text-gray-400 hover:text-red-400'
                : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
            )}
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Per-location travel mode — only when global mode is off */}
      {!state.useGlobalMode && (
        <div className="mt-3">
          <p className={cn('text-[11px] font-medium mb-1.5', dark ? 'text-gray-400' : 'text-gray-500')}>
            Travel Mode
          </p>
          <TravelModeSelector
            value={location.travelMode}
            onChange={(mode: TravelMode) => updateLocation(location.id, { travelMode: mode })}
            dark={dark}
            compact
            unavailableModes={location.unavailableModes}
          />
        </div>
      )}

      {/* Time bands */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className={cn('text-[11px] font-medium', dark ? 'text-gray-400' : 'text-gray-500')}>
            Time Bands
          </p>
          {isGenerating && (
            <span className="flex items-center gap-1 text-[10px] text-blue-500">
              <Loader2 size={9} className="animate-spin" />
              generating…
            </span>
          )}
        </div>
        <TimeThresholdSelector
          selected={location.timeThresholds}
          onChange={(t: TimeThreshold[]) => updateLocation(location.id, { timeThresholds: t })}
          dark={dark}
        />
        {location.timeThresholds.length === 0 && (
          <p className={cn('mt-1.5 text-[10px]', dark ? 'text-gray-500' : 'text-gray-400')}>
            Select at least one time band
          </p>
        )}
      </div>
    </div>
  );
}
