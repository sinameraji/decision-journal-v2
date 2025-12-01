import { useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export function ReviewsPage() {
  const decisions = useStore((state) => state.decisions);
  const loadDecisions = useStore((state) => state.loadDecisions);
  const navigate = useNavigate();

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  // Split into pending and completed reviews
  const pendingReviews = useMemo(
    () =>
      decisions
        .filter((d) => d.outcome_rating === null)
        .sort((a, b) => a.created_at - b.created_at), // Oldest first
    [decisions]
  );

  const completedReviews = useMemo(
    () =>
      decisions
        .filter((d) => d.outcome_rating !== null)
        .sort((a, b) => b.updated_at - a.updated_at), // Most recently reviewed first
    [decisions]
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysSince = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getAgeLabel = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Reviews</h1>
        <p className="text-muted-foreground">
          Track the outcomes of your decisions to improve future predictions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Decisions</h3>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{decisions.length}</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Reviews</h3>
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{pendingReviews.length}</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Reviewed</h3>
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{completedReviews.length}</p>
        </div>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 ? (
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
            Pending Reviews ({pendingReviews.length})
          </h2>

          <div className="space-y-3">
            {pendingReviews.map((decision) => {
              const daysSince = getDaysSince(decision.created_at);
              const selectedAlt = decision.alternatives.find(
                (alt) => alt.id === decision.selected_alternative_id
              );

              return (
                <div
                  key={decision.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 hover:border-muted-foreground/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {decision.problem_statement}
                      </h3>
                      {selectedAlt && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Chose: <span className="font-medium">{selectedAlt.title}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{getAgeLabel(daysSince)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(decision.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate({ to: `/decision/${decision.id}/review` })}
                      >
                        Add Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate({ to: `/decision/${decision.id}` })}
                      >
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Age indicator */}
                  {daysSince > 7 && (
                    <div
                      className={`mt-3 text-xs font-medium px-2 py-1 rounded inline-block ${
                        daysSince > 30
                          ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                          : daysSince > 14
                          ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {daysSince > 30
                        ? 'Ready for review'
                        : daysSince > 14
                        ? 'Consider reviewing soon'
                        : 'May be ready for review'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">All Caught Up!</h2>
          <p className="text-green-600 dark:text-green-500">
            {decisions.length === 0
              ? 'No decisions yet. Create your first decision to get started.'
              : 'All your decisions have been reviewed. Great job tracking outcomes!'}
          </p>
        </div>
      )}

      {/* Recently Reviewed */}
      {completedReviews.length > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
            Recently Reviewed ({completedReviews.length})
          </h2>

          <div className="space-y-3">
            {completedReviews.slice(0, 5).map((decision) => {
              const selectedAlt = decision.alternatives.find(
                (alt) => alt.id === decision.selected_alternative_id
              );

              return (
                <div
                  key={decision.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 hover:border-muted-foreground/30 transition-all cursor-pointer"
                  onClick={() => navigate({ to: `/decision/${decision.id}` })}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {decision.problem_statement}
                      </h3>
                      {selectedAlt && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Chose: <span className="font-medium">{selectedAlt.title}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Confidence: </span>
                          <span className="font-semibold text-foreground">
                            {decision.confidence_level}/10
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Outcome: </span>
                          <span
                            className={`font-semibold ${
                              decision.outcome_rating! >= 7
                                ? 'text-green-600 dark:text-green-500'
                                : decision.outcome_rating! >= 4
                                ? 'text-yellow-600 dark:text-yellow-500'
                                : 'text-red-600 dark:text-red-500'
                            }`}
                          >
                            {decision.outcome_rating}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    <CheckCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>

          {completedReviews.length > 5 && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate({ to: '/' })}
            >
              View All Decisions
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
