'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Plus, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { geocodeLocation } from '@/lib/geocoding';
import { cn } from './ui/cn';
import { TravelMode } from '@/types';

interface Props {
  onLocationAdded?: () => void;
}

export function LocationSearchInput({ onLocationAdded }: Props) {
  const { state, addLocation, showToast } = useApp();
  const dark = state.isDarkMode;
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'formatted_address', 'geometry', 'address_components'],
      types: ['geocode', 'establishment'],
    });

    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.geometry?.location) return;

      const postalComponent = place.address_components?.find((c) =>
        c.types.includes('postal_code')
      );

      addLocation({
        name: place.name || place.formatted_address || query,
        address: place.formatted_address || '',
        postalCode: postalComponent?.long_name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        travelMode: state.globalTravelMode as TravelMode,
        timeThresholds: [30],
        isVisible: true,
      });

      setQuery('');
      onLocationAdded?.();
    });

    return () => google.maps.event.removeListener(listener);
  }, [state.globalTravelMode, addLocation, showToast, onLocationAdded, query]);

  const handleManualSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await geocodeLocation(query.trim());
      addLocation({
        name: query.trim(),
        address: result.formattedAddress,
        postalCode: result.postalCode,
        lat: result.lat,
        lng: result.lng,
        travelMode: state.globalTravelMode as TravelMode,
        timeThresholds: [30],
        isVisible: true,
      });
      setQuery('');
      onLocationAdded?.();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Location not found.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [query, addLocation, state.globalTravelMode, showToast, onLocationAdded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleManualSearch();
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all',
          dark
            ? 'bg-gray-800 border-gray-700 focus-within:border-blue-500'
            : 'bg-white border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm'
        )}
      >
        <Search size={14} className={dark ? 'text-gray-500' : 'text-gray-400'} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Address, city, landmark, or postcode…"
          className={cn(
            'flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400',
            dark ? 'text-white' : 'text-gray-900'
          )}
        />
        {loading ? (
          <Loader2 size={14} className="animate-spin text-blue-500" />
        ) : (
          <button
            onClick={handleManualSearch}
            disabled={!query.trim()}
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
              query.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : dark
                ? 'bg-gray-700 text-gray-500'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      <p className={cn('mt-1 text-[10px]', dark ? 'text-gray-500' : 'text-gray-400')}>
        <MapPin size={9} className="inline mr-0.5" />
        Worldwide — default view: Singapore
      </p>
    </div>
  );
}
