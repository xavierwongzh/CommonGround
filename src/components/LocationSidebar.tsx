'use client';

import { MapPin, Settings2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LocationSearchInput } from './LocationSearchInput';
import { LocationCard } from './LocationCard';
import { TravelModeSelector } from './TravelModeSelector';
import { cn } from './ui/cn';
import { TravelMode } from '@/types';

export function LocationSidebar() {
  const { state, setGlobalTravelMode, setUseGlobalMode, setShowOverlap } = useApp();
  const dark = state.isDarkMode;

  return (
    <aside
      className={cn(
        'w-72 flex-shrink-0 flex flex-col border-r overflow-hidden',
        dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
      )}
    >
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {/* Search */}
        <section>
          <p className={cn('text-[11px] font-semibold uppercase tracking-wider mb-2',
            dark ? 'text-gray-400' : 'text-gray-500')}>
            Add Location
          </p>
          <LocationSearchInput />
        </section>

        {/* Global Controls */}
        <section
          className={cn(
            'rounded-xl border p-3 space-y-3',
            dark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={12} className={dark ? 'text-gray-400' : 'text-gray-500'} />
            <p className={cn('text-[11px] font-semibold uppercase tracking-wider',
              dark ? 'text-gray-400' : 'text-gray-500')}>
              Global Settings
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center justify-between">
            <span className={cn('text-xs', dark ? 'text-gray-300' : 'text-gray-700')}>
              Per-location mode
            </span>
            <button
              onClick={() => setUseGlobalMode(!state.useGlobalMode)}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative',
                !state.useGlobalMode ? 'bg-blue-500' : dark ? 'bg-gray-600' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  !state.useGlobalMode ? 'left-4' : 'left-0.5'
                )}
              />
            </button>
          </div>

          {state.useGlobalMode && (
            <div>
              <p className={cn('text-[11px] mb-1.5', dark ? 'text-gray-400' : 'text-gray-500')}>
                Travel Mode (all locations)
              </p>
              <TravelModeSelector
                value={state.globalTravelMode}
                onChange={(m: TravelMode) => setGlobalTravelMode(m)}
                dark={dark}
                unavailableModes={[
                  ...new Set(
                    state.locations.flatMap((l) => l.unavailableModes ?? [])
                  ),
                ]}
              />
            </div>
          )}

          {/* Overlap toggle */}
          <div className="flex items-center justify-between">
            <span className={cn('text-xs', dark ? 'text-gray-300' : 'text-gray-700')}>
              Show overlap zones
            </span>
            <button
              onClick={() => setShowOverlap(!state.showOverlap)}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative',
                state.showOverlap ? 'bg-blue-500' : dark ? 'bg-gray-600' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  state.showOverlap ? 'left-4' : 'left-0.5'
                )}
              />
            </button>
          </div>
        </section>

        {/* Locations list */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className={cn('text-[11px] font-semibold uppercase tracking-wider',
              dark ? 'text-gray-400' : 'text-gray-500')}>
              Locations ({state.locations.length})
            </p>
          </div>

          {state.locations.length === 0 ? (
            <div
              className={cn(
                'rounded-xl border-2 border-dashed p-6 text-center',
                dark ? 'border-gray-700' : 'border-gray-200'
              )}
            >
              <MapPin
                size={24}
                className={cn('mx-auto mb-2', dark ? 'text-gray-600' : 'text-gray-300')}
              />
              <p className={cn('text-xs leading-relaxed', dark ? 'text-gray-500' : 'text-gray-400')}>
                Add an address or place anywhere in the world to start mapping reachable areas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.locations.map((loc) => (
                <LocationCard key={loc.id} location={loc} />
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
