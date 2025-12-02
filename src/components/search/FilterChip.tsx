import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

export function FilterChip({ label, onRemove, className }: FilterChipProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/30 px-3 py-1.5 text-sm',
        'hover:bg-accent/20 transition-colors',
        className
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Remove ${label} filter`}
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-foreground text-muted-foreground transition-colors"
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
