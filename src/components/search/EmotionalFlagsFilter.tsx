import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmotionalFlag } from '@/types/decision';

interface EmotionalFlagsFilterProps {
  value: EmotionalFlag[];
  onChange: (flags: EmotionalFlag[]) => void;
}

const EMOTIONAL_FLAGS: Array<{
  value: EmotionalFlag;
  label: string;
  colorClass: string;
}> = [
  { value: 'confidence', label: 'Confidence', colorClass: 'bg-green-500/10 text-green-600 border-green-500/30' },
  { value: 'excitement', label: 'Excitement', colorClass: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  { value: 'fear', label: 'Fear', colorClass: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  { value: 'anxiety', label: 'Anxiety', colorClass: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  { value: 'doubt', label: 'Doubt', colorClass: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
  { value: 'stress', label: 'Stress', colorClass: 'bg-red-500/10 text-red-600 border-red-500/30' },
  { value: 'regret', label: 'Regret', colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { value: 'fomo', label: 'FOMO', colorClass: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
];

export function EmotionalFlagsFilter({ value, onChange }: EmotionalFlagsFilterProps) {
  const toggleFlag = (flag: EmotionalFlag) => {
    if (value.includes(flag)) {
      onChange(value.filter(f => f !== flag));
    } else {
      onChange([...value, flag]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Emotional Context</label>
        {value.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {value.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {EMOTIONAL_FLAGS.map((flag) => {
          const isSelected = value.includes(flag.value);
          return (
            <button
              key={flag.value}
              type="button"
              onClick={() => toggleFlag(flag.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                'hover:scale-105 active:scale-95',
                isSelected
                  ? flag.colorClass
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              {flag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
