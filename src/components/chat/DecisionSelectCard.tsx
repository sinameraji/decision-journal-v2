import { CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Decision } from '@/types/decision';
import { cn } from '@/lib/utils';

interface DecisionSelectCardProps {
  decision: Decision;
  selected: boolean;
  onToggle: (decisionId: string) => void;
  disabled?: boolean;
}

export function DecisionSelectCard({
  decision,
  selected,
  onToggle,
  disabled = false,
}: DecisionSelectCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasOutcome = Boolean(decision.actual_outcome);

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(decision.id)}
      disabled={disabled}
      className={cn(
        'w-full p-3 border rounded-lg text-left transition-colors',
        'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring',
        selected && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => !disabled && onToggle(decision.id)}
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="font-medium text-sm line-clamp-2">
            {decision.problem_statement}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{formatDate(decision.created_at)}</span>
            <span>•</span>
            <span>Confidence: {decision.confidence_level}/10</span>
            {hasOutcome && (
              <>
                <span>•</span>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>Reviewed</span>
              </>
            )}
          </div>

          {decision.tags && decision.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {decision.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {decision.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{decision.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
