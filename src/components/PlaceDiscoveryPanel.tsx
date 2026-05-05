'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PLACE_CATEGORIES } from '@/lib/placesCategories';
import { PlaceResultsList } from './PlaceResultsList';
import { cn } from './ui/cn';

export function PlaceDiscoveryPanel() {
  const { state, searchPlaces, clearPlaces, setSelectedCategory } = useApp();
  const dark = state.isDarkMode;
  const hasIsochrones = state.isochrones.length > 0;
  const [keyword, setKeyword] = useState('');

  const handleSearch = () => {
    const kw = keyword.trim();
    searchPlaces(state.selectedCategory, kw || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearKeyword = () => setKeyword('');

  return (
    <div className="space-y-3">
      {/* Free-text search */}
      <div className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2 transition-all',
        dark
          ? 'bg-gray-800 border-gray-700 focus-within:border-blue-500'
          : 'bg-white border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm'
      )}>
        <Search size={13} className={dark ? 'text-gray-500' : 'text-gray-400'} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "kway chap", "chinese food"…'
          className={cn(
            'flex-1 text-xs bg-transparent outline-none placeholder:text-gray-400',
            dark ? 'text-white' : 'text-gray-900'
          )}
        />
        {keyword && (
          <button onClick={clearKeyword} className="text-gray-400 hover:text-gray-600">
            <X size={11} />
          </button>
        )}
      </div>

      {/* Category grid — dimmed when keyword is active */}
      <div className={cn('grid grid-cols-4 gap-1', keyword && 'opacity-40 pointer-events-none')}>
        {PLACE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            title={cat.label}
            className={cn(
              'flex flex-col items-center py-2 px-1 rounded-lg border text-[10px] font-medium transition-all',
              state.selectedCategory === cat.value && !keyword
                ? dark
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-blue-50 border-blue-500 text-blue-700'
                : dark
                ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            )}
          >
            <span className="text-base leading-none">{cat.icon}</span>
            <span className="mt-1 text-center leading-tight">{cat.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Active search label */}
      {keyword && (
        <p className={cn('text-[11px]', dark ? 'text-blue-400' : 'text-blue-600')}>
          Searching for <span className="font-semibold">"{keyword}"</span> in reachable area
        </p>
      )}

      {/* Search + clear row */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={!hasIsochrones}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
            hasIsochrones
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : dark
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <Search size={12} />
          {keyword ? 'Search' : 'Search in Reachable Area'}
        </button>

        {state.places.length > 0 && (
          <button
            onClick={clearPlaces}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
              dark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            )}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {!hasIsochrones && (
        <p className={cn('text-[11px] text-center', dark ? 'text-gray-500' : 'text-gray-400')}>
          Generate isochrones first to search for places.
        </p>
      )}

      {state.places.length > 0 && <PlaceResultsList />}
    </div>
  );
}
