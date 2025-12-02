import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DateRangeFilterProps {
  value: { from?: number; to?: number };
  onChange: (range: { from?: number; to?: number }) => void;
}

// Convert timestamp to YYYY-MM-DD format
function timestampToDateString(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

// Convert YYYY-MM-DD to timestamp
function dateStringToTimestamp(dateString: string): number | undefined {
  if (!dateString) return undefined;
  return new Date(dateString).getTime();
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const from = dateStringToTimestamp(e.target.value);

    // Validate: from should be before to
    if (from && value.to && from > value.to) {
      setError('Start date must be before end date');
      return;
    }

    setError(null);
    onChange({ ...value, from });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const to = dateStringToTimestamp(e.target.value);

    // Validate: to should be after from
    if (to && value.from && to < value.from) {
      setError('Start date must be before end date');
      return;
    }

    setError(null);
    onChange({ ...value, to });
  };

  const handleClear = () => {
    setError(null);
    onChange({ from: undefined, to: undefined });
  };

  const hasValues = value.from || value.to;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Date Range</label>
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

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label htmlFor="date-from" className="text-xs text-muted-foreground mb-1 block">
            From
          </label>
          <Input
            id="date-from"
            type="date"
            value={timestampToDateString(value.from)}
            onChange={handleFromChange}
            max={value.to ? timestampToDateString(value.to) : undefined}
          />
        </div>

        <div>
          <label htmlFor="date-to" className="text-xs text-muted-foreground mb-1 block">
            To
          </label>
          <Input
            id="date-to"
            type="date"
            value={timestampToDateString(value.to)}
            onChange={handleToChange}
            min={value.from ? timestampToDateString(value.from) : undefined}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
