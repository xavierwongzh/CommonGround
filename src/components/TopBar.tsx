'use client';

import Image from 'next/image';
import { Moon, RotateCcw, Sun } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from './ui/cn';

export function TopBar() {
  const { state, clearAllLocations, toggleDarkMode } = useApp();
  const dark = state.isDarkMode;

  return (
    <header
      className={cn(
        'h-14 flex items-center justify-between px-4 border-b z-20 relative',
        dark
          ? 'bg-gray-900 border-gray-700 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 mt-2">
        <Image
          src="/logo-full.png"
          alt="CommonGround"
          width={150}
          height={38}
          className={cn(
            'flex-shrink-0 object-contain pt-1',
            dark ? 'brightness-90 invert' : 'mix-blend-multiply'
          )}
          priority
        />
        <p className="text-[10px] text-gray-400 leading-none hidden sm:block -mt-2">
          Find places everyone can reach.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={clearAllLocations}
          disabled={state.locations.length === 0}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            dark
              ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300 disabled:opacity-40'
              : 'bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-40'
          )}
          title="Reset all"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={toggleDarkMode}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            dark
              ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          )}
          title="Toggle dark mode"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
