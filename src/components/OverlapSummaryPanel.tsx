'use client';

import { GitMerge, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { OverlapResult } from '@/types';
import { cn } from './ui/cn';

const MODE_LABEL: Record<string, string> = {
  public_transport: '🚇 Transit',
  walking: '🚶 Walking',
  cycling: '🚲 Cycling',
  driving: '🚗 Driving',
};

export function OverlapSummaryPanel() {
  const { state } = useApp();
  const dark = state.isDarkMode;

  if (state.locations.length < 2) {
    return (
      <div className={cn(
        'rounded-xl border-2 border-dashed p-4 text-center',
        dark ? 'border-gray-700' : 'border-gray-200'
      )}>
        <Info size={18} className={cn('mx-auto mb-2', dark ? 'text-gray-600' : 'text-gray-300')} />
        <p className={cn('text-xs', dark ? 'text-gray-500' : 'text-gray-400')}>
          Add at least two locations to view overlap.
        </p>
      </div>
    );
  }

  if (state.overlapResults.length === 0) {
    return (
      <div className={cn(
        'rounded-xl border p-4 text-center',
        dark ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
      )}>
        <p className={cn('text-xs', dark ? 'text-gray-500' : 'text-gray-400')}>
          Generate isochrones to calculate overlaps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {state.overlapResults.map((overlap: OverlapResult) => {
        const names = overlap.locationIds
          .map((id) => state.locations.find((l) => l.id === id)?.name ?? id)
          .join(' & ');

        return (
          <div
            key={overlap.id}
            className={cn(
              'rounded-xl border p-3',
              dark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-red-400/20 flex items-center justify-center">
                <GitMerge size={11} className="text-red-500" />
              </div>
              <p className={cn('text-xs font-semibold', dark ? 'text-white' : 'text-gray-900')}>
                {names}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className={cn('rounded-lg p-2', dark ? 'bg-gray-900/60' : 'bg-gray-50')}>
                <p className={dark ? 'text-gray-500' : 'text-gray-400'}>Mode</p>
                <p className={cn('font-medium mt-0.5', dark ? 'text-gray-200' : 'text-gray-700')}>
                  {MODE_LABEL[overlap.travelMode]}
                </p>
              </div>
              <div className={cn('rounded-lg p-2', dark ? 'bg-gray-900/60' : 'bg-gray-50')}>
                <p className={dark ? 'text-gray-500' : 'text-gray-400'}>Time band</p>
                <p className={cn('font-medium mt-0.5', dark ? 'text-gray-200' : 'text-gray-700')}>
                  {overlap.timeThreshold} min
                </p>
              </div>
              <div className={cn('rounded-lg p-2 col-span-2', dark ? 'bg-gray-900/60' : 'bg-gray-50')}>
                <p className={dark ? 'text-gray-500' : 'text-gray-400'}>Overlap area</p>
                <p className={cn('font-semibold mt-0.5', dark ? 'text-gray-200' : 'text-gray-700')}>
                  {overlap.areaSqKm < 0.01
                    ? '<0.01'
                    : overlap.areaSqKm.toFixed(2)}{' '}
                  km²
                </p>
              </div>
            </div>

            {overlap.locationIds.length >= 3 && (
              <p className={cn('mt-2 text-[11px] leading-relaxed', dark ? 'text-gray-400' : 'text-gray-600')}>
                {overlap.locationIds.length} locations overlap within a {overlap.timeThreshold}-minute {overlap.travelMode.replace('_', ' ')} travel time.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
