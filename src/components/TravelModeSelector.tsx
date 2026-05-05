'use client';

import { TravelMode } from '@/types';
import { cn } from './ui/cn';

const MODES: { value: TravelMode; label: string; icon: string }[] = [
  { value: 'public_transport', label: 'Transit', icon: '🚇' },
  { value: 'walking', label: 'Walk', icon: '🚶' },
  { value: 'cycling', label: 'Cycle', icon: '🚲' },
  { value: 'driving', label: 'Drive', icon: '🚗' },
];

interface Props {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
  dark?: boolean;
  compact?: boolean;
  unavailableModes?: TravelMode[];
}

export function TravelModeSelector({ value, onChange, dark, compact, unavailableModes = [] }: Props) {
  return (
    <div className="flex gap-1">
      {MODES.map((mode) => {
        const isUnavailable = unavailableModes.includes(mode.value);
        const isSelected = value === mode.value;

        return (
          <div key={mode.value} className="flex-1 relative group">
            <button
              onClick={() => !isUnavailable && onChange(mode.value)}
              disabled={isUnavailable}
              title={isUnavailable ? 'No data available for this location' : mode.label}
              className={cn(
                'w-full flex flex-col items-center justify-center rounded-lg border transition-all',
                compact ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs',
                isUnavailable
                  ? dark
                    ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? dark
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : dark
                  ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              <span className={cn(
                compact ? 'text-sm' : 'text-base',
                isUnavailable && 'grayscale opacity-40'
              )}>
                {mode.icon}
              </span>
              {!compact && (
                <span className="mt-0.5 font-medium">{mode.label}</span>
              )}
            </button>

            {/* Tooltip on hover for unavailable modes */}
            {isUnavailable && (
              <div className={cn(
                'absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50',
                'hidden group-hover:block pointer-events-none'
              )}>
                <div className={cn(
                  'text-[10px] font-medium whitespace-nowrap px-2 py-1 rounded-lg shadow-lg',
                  dark
                    ? 'bg-gray-700 text-gray-200'
                    : 'bg-gray-800 text-white'
                )}>
                  No transit data for this location
                  <div className={cn(
                    'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent',
                    dark ? 'border-t-gray-700' : 'border-t-gray-800'
                  )} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
