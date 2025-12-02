import { useState } from 'react';
import { Gauge } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ConfidenceRangeFilterProps {
  value: { min?: number; max?: number };
  onChange: (range: { min?: number; max?: number }) => void;
}

export function ConfidenceRangeFilter({ value, onChange }: ConfidenceRangeFilterProps) {
  const [error, setError] = useState<string | null>(null);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = e.target.value ? parseInt(e.target.value, 10) : undefined;

    // Validate: min should be <= max and within 1-10
    if (min !== undefined) {
      if (min < 1 || min > 10) return;
      if (value.max !== undefined && min > value.max) {
        setError('Min must be less than or equal to max');
        return;
      }
    }

    setError(null);
    onChange({ ...value, min });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = e.target.value ? parseInt(e.target.value, 10) : undefined;

    // Validate: max should be >= min and within 1-10
    if (max !== undefined) {
      if (max < 1 || max > 10) return;
      if (value.min !== undefined && max < value.min) {
        setError('Min must be less than or equal to max');
        return;
      }
    }

    setError(null);
    onChange({ ...value, max });
  };

  const handleClear = () => {
    setError(null);
    onChange({ min: undefined, max: undefined });
  };

  const hasValues = value.min !== undefined || value.max !== undefined;
  const hasRange = value.min !== undefined && value.max !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Confidence Level</label>
        {hasValues && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="confidence-min" className="text-xs text-muted-foreground mb-1 block">
            Min
          </label>
          <Input
            id="confidence-min"
            type="number"
            min={1}
            max={10}
            value={value.min ?? ''}
            onChange={handleMinChange}
            placeholder="1"
          />
        </div>

        <div>
          <label htmlFor="confidence-max" className="text-xs text-muted-foreground mb-1 block">
            Max
          </label>
          <Input
            id="confidence-max"
            type="number"
            min={1}
            max={10}
            value={value.max ?? ''}
            onChange={handleMaxChange}
            placeholder="10"
          />
        </div>
      </div>

      {hasRange && !error && (
        <p className="text-xs text-muted-foreground">
          Range: {value.min} - {value.max}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
