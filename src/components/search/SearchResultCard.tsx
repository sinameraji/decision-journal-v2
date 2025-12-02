import { Link } from '@tanstack/react-router';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Decision } from '@/types/decision';
import { HighlightedText } from './HighlightedText';

interface SearchResultCardProps {
  decision: Decision;
  query: string;
  matchedFields: string[];
}

export function SearchResultCard({ decision, query, matchedFields }: SearchResultCardProps) {
  // Format date from timestamp
  const dateStr = new Date(decision.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = new Date(decision.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Get selected alternative
  const selectedAlternative = decision.alternatives.find(
    (alt) => alt.id === decision.selected_alternative_id
  );

  const hasOutcome = decision.actual_outcome !== null;

  return (
    <Link
      to={`/decision/$id`}
      params={{ id: decision.id }}
      className="block"
    >
      <Card
        className={cn(
          'p-4 transition-all duration-200 cursor-pointer',
          'hover:shadow-md hover:border-border',
          'bg-card border-border shadow-sm'
        )}
      >
        {/* Matched Fields Badges */}
        {matchedFields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs text-muted-foreground">Matched in:</span>
            {matchedFields.map((field) => (
              <Badge
                key={field}
                variant="outline"
                className="text-xs font-normal border-accent/30 text-accent"
              >
                {field}
              </Badge>
            ))}
          </div>
        )}

        {/* Title and Date */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-serif text-xl font-semibold text-foreground flex-1">
            <HighlightedText text={decision.problem_statement} query={query} />
          </h3>
          <div className="flex flex-col items-end text-xs text-muted-foreground flex-shrink-0">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{dateStr}</span>
            </div>
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Situation Preview */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          <HighlightedText text={decision.situation} query={query} />
        </p>

        {/* Selected Alternative */}
        {selectedAlternative && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
            <p className="text-xs text-muted-foreground mb-1">Selected Alternative</p>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              <HighlightedText text={selectedAlternative.title} query={query} />
            </p>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {/* Left: Time of day and tags */}
          <div className="flex items-center gap-3 flex-wrap">
            {decision.time_of_day && (
              <span className="text-xs text-muted-foreground">
                {decision.time_of_day}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {decision.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
              {decision.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{decision.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Right: Confidence and review status */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {decision.confidence_level && (
              <span>Confidence: {decision.confidence_level}/10</span>
            )}
            {hasOutcome && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Reviewed</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
