'use client';

import { ExternalLink, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORY_MAP } from '@/lib/placesCategories';
import { PlaceResult } from '@/types';
import { OVERLAP_COLOUR } from '@/lib/colours';
import { cn } from './ui/cn';

function mapsUrl(place: PlaceResult): string {
  if (place.googlePlaceId) {
    return `https://www.google.com/maps/place/?q=place_id:${place.googlePlaceId}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
}

export function PlaceResultsList() {
  const { state, setSelectedPlace } = useApp();
  const dark = state.isDarkMode;

  return (
    <div className="space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin">
      <p className={cn('text-[11px] font-medium mb-2', dark ? 'text-gray-400' : 'text-gray-500')}>
        {state.places.length} place{state.places.length !== 1 ? 's' : ''} · sorted by rating
      </p>
      {state.places.map((place: PlaceResult) => {
        const cat = CATEGORY_MAP[place.category as keyof typeof CATEGORY_MAP];
        const isSelected = state.selectedPlaceId === place.id;

        return (
          <div key={place.id}>
            <button
              onClick={() => setSelectedPlace(isSelected ? null : place.id)}
              className={cn(
                'w-full text-left rounded-xl border p-3 transition-all',
                isSelected
                  ? dark
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-blue-50 border-blue-400'
                  : dark
                  ? 'bg-gray-800/40 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">{cat?.icon ?? '📍'}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-semibold truncate',
                    dark ? 'text-white' : 'text-gray-900'
                  )}>
                    {place.name}
                  </p>
                  <p className={cn('text-[11px] truncate mt-0.5', dark ? 'text-gray-400' : 'text-gray-500')}>
                    {place.address}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {place.rating ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                        <Star size={9} fill="currentColor" />
                        {place.rating.toFixed(1)}
                        {place.reviewCount && (
                          <span className={cn('ml-0.5', dark ? 'text-gray-500' : 'text-gray-400')}>
                            ({place.reviewCount.toLocaleString()})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className={cn('text-[10px]', dark ? 'text-gray-600' : 'text-gray-400')}>
                        No rating
                      </span>
                    )}
                    {place.insideOverlap && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: OVERLAP_COLOUR }}
                      >
                        In overlap
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded detail when selected */}
            {isSelected && (
              <div className={cn(
                'mx-1 mb-1 rounded-b-xl border border-t-0 px-3 py-2.5',
                dark ? 'bg-blue-500/10 border-blue-500/40' : 'bg-blue-50 border-blue-200'
              )}>
                <a
                  href={mapsUrl(place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium transition-colors',
                    dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                  )}
                >
                  <ExternalLink size={11} />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
