import { Paperclip, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Decision } from '@/types/decision';

interface AttachedDecisionChipsProps {
  decisions: Decision[];
  onDetach: (decisionId: string) => void;
  onChipClick?: (decisionId: string) => void;
}

export function AttachedDecisionChips({
  decisions,
  onDetach,
  onChipClick,
}: AttachedDecisionChipsProps) {
  if (decisions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 pb-4 border-b border-border">
      <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-muted-foreground flex-shrink-0">
        Attached context:
      </span>
      <div className="flex flex-wrap gap-2 flex-1 min-w-0">
        <TooltipProvider>
          {decisions.map((decision) => (
            <Tooltip key={decision.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="max-w-[200px] flex items-center gap-1 cursor-default"
                >
                  <span
                    className="truncate"
                    onClick={onChipClick ? () => onChipClick(decision.id) : undefined}
                    style={{ cursor: onChipClick ? 'pointer' : 'default' }}
                  >
                    {decision.problem_statement}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDetach(decision.id);
                    }}
                    className="ml-1 hover:text-destructive transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded"
                    aria-label={`Remove ${decision.problem_statement}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{decision.problem_statement}</p>
                {onChipClick && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view decision
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
