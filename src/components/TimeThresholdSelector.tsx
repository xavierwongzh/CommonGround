'use client';

import { TimeThreshold } from '@/types';
import { cn } from './ui/cn';

const THRESHOLDS: TimeThreshold[] = [10, 15, 30, 45, 60, 90, 120, 180];

interface Props {
  selected: TimeThreshold[];
  onChange: (thresholds: TimeThreshold[]) => void;
  dark?: boolean;
}

export function TimeThresholdSelector({ selected, onChange, dark }: Props) {
  const toggle = (t: TimeThreshold) => {
    onChange([t]);
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {THRESHOLDS.map((t) => (
        <button
          key={t}
          onClick={() => toggle(t)}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
            selected.includes(t)
              ? dark
                ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                : 'bg-violet-50 border-violet-500 text-violet-700'
              : dark
              ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
          )}
        >
          {t}m
        </button>
      ))}
    </div>
  );
}
