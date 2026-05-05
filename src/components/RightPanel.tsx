'use client';

import { useState } from 'react';
import { GitMerge, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { OverlapSummaryPanel } from './OverlapSummaryPanel';
import { PlaceDiscoveryPanel } from './PlaceDiscoveryPanel';
import { exportPlacesCSV } from '@/lib/exportUtils';
import { cn } from './ui/cn';

type Tab = 'places' | 'overlap';

export function RightPanel() {
  const { state } = useApp();
  const dark = state.isDarkMode;
  const [tab, setTab] = useState<Tab>('places');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'places', label: 'Places', icon: <MapPin size={12} /> },
    { id: 'overlap', label: 'Overlap', icon: <GitMerge size={12} /> },
  ];

  return (
    <aside
      className={cn(
        'w-72 flex-shrink-0 flex flex-col border-l overflow-hidden',
        dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
      )}
    >
      {/* Tab bar */}
      <div className={cn(
        'flex border-b',
        dark ? 'border-gray-700' : 'border-gray-200'
      )}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2',
              tab === t.id
                ? dark
                  ? 'border-blue-500 text-blue-400'
                  : 'border-blue-500 text-blue-600'
                : dark
                ? 'border-transparent text-gray-500 hover:text-gray-300'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {tab === 'places' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={cn('text-[11px] font-semibold uppercase tracking-wider',
                dark ? 'text-gray-400' : 'text-gray-500')}>
                Find Places
              </p>
              {state.places.length > 0 && (
                <button
                  onClick={() => exportPlacesCSV(state.places, state.locations)}
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors',
                    dark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  )}
                >
                  Export CSV
                </button>
              )}
            </div>
            <PlaceDiscoveryPanel />
          </div>
        )}

        {tab === 'overlap' && (
          <div className="space-y-3">
            <p className={cn('text-[11px] font-semibold uppercase tracking-wider',
              dark ? 'text-gray-400' : 'text-gray-500')}>
              Overlap Analysis
            </p>
            <OverlapSummaryPanel />
          </div>
        )}
      </div>
    </aside>
  );
}
