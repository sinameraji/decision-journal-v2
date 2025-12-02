import { Circle, CheckCircle2, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutcomeFilterProps {
  value: boolean | undefined;
  onChange: (state: boolean | undefined) => void;
}

const OPTIONS = [
  {
    value: undefined,
    icon: Circle,
    label: 'All',
    description: 'Show all decisions',
  },
  {
    value: true,
    icon: CheckCircle2,
    label: 'Reviewed',
    description: 'Has outcome recorded',
  },
  {
    value: false,
    icon: CircleDot,
    label: 'Not Reviewed',
    description: 'No outcome yet',
  },
];

export function OutcomeFilter({ value, onChange }: OutcomeFilterProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Review Status</label>

      <div className="space-y-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left',
                isSelected
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
