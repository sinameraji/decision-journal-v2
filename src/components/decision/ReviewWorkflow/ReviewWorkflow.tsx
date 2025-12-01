import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Decision } from '@/types/decision';
import type { ReviewUpdateFormData } from '@/schemas/decision-form.schema';
import { reviewUpdateSchema } from '@/schemas/decision-form.schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface ReviewWorkflowProps {
  decision: Decision;
  onSubmit: (data: ReviewUpdateFormData) => void;
  onCancel: () => void;
}

export function ReviewWorkflow({ decision, onSubmit, onCancel }: ReviewWorkflowProps) {
  const form = useForm<ReviewUpdateFormData>({
    resolver: zodResolver(reviewUpdateSchema),
    defaultValues: {
      actual_outcome: decision.actual_outcome || '',
      outcome_rating: decision.outcome_rating || 5,
      lessons_learned: decision.lessons_learned || '',
    },
  });

  const selectedAlt = decision.alternatives.find(
    (alt) => alt.id === decision.selected_alternative_id
  );

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const outcomeRating = form.watch('outcome_rating');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Context Card */}
      <div className="bg-muted/50 border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-3">Review Your Decision</h2>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-foreground">Problem: </span>
            <span className="text-muted-foreground">{decision.problem_statement}</span>
          </div>

          {selectedAlt && (
            <div>
              <span className="font-semibold text-foreground">You chose: </span>
              <span className="text-muted-foreground">{selectedAlt.title}</span>
            </div>
          )}

          <div>
            <span className="font-semibold text-foreground">Your confidence: </span>
            <span className="text-muted-foreground">{decision.confidence_level}/10</span>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="font-semibold text-foreground mb-1">You expected:</p>
            <p className="text-muted-foreground italic">{decision.expected_outcome}</p>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Actual Outcome */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              What Actually Happened? <span className="text-destructive">*</span>
            </label>
            <p className="text-sm text-muted-foreground">
              Describe the actual outcome objectively. What really happened after you made
              this decision?
            </p>
            <Textarea
              placeholder="The actual outcome was..."
              className="min-h-[120px]"
              {...form.register('actual_outcome')}
            />
            {form.formState.errors.actual_outcome && (
              <p className="text-sm text-destructive">
                {form.formState.errors.actual_outcome.message}
              </p>
            )}
          </div>

          {/* Outcome Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              How Would You Rate the Outcome? <span className="text-destructive">*</span>
            </label>
            <p className="text-sm text-muted-foreground">
              Rate from 1 (terrible) to 10 (excellent). This helps you calibrate future
              decisions.
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="1"
                max="10"
                className="w-24"
                {...form.register('outcome_rating', { valueAsNumber: true })}
              />
              <span className="text-sm text-muted-foreground">out of 10</span>
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      outcomeRating >= 7
                        ? 'bg-green-500'
                        : outcomeRating >= 4
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${(outcomeRating / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            {form.formState.errors.outcome_rating && (
              <p className="text-sm text-destructive">
                {form.formState.errors.outcome_rating.message}
              </p>
            )}
          </div>

          {/* Calibration Insight */}
          {outcomeRating && (
            <div
              className={`border rounded-lg p-4 ${
                Math.abs(decision.confidence_level - outcomeRating) > 3
                  ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {Math.abs(decision.confidence_level - outcomeRating) > 3 ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Calibration Mismatch
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Your confidence ({decision.confidence_level}/10) was{' '}
                        {decision.confidence_level > outcomeRating
                          ? 'higher'
                          : 'lower'}{' '}
                        than the actual outcome ({outcomeRating}/10). This is
                        valuable data for improving future predictions.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Well Calibrated</h4>
                      <p className="text-sm text-muted-foreground">
                        Your confidence level was close to the actual outcome. Great calibration!
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Lessons Learned */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              What Did You Learn?
            </label>
            <p className="text-sm text-muted-foreground">
              Reflect on what you learned from this decision. What would you do differently?
              What surprised you?
            </p>
            <Textarea
              placeholder="I learned that..."
              className="min-h-[120px]"
              {...form.register('lessons_learned')}
            />
            {form.formState.errors.lessons_learned && (
              <p className="text-sm text-destructive">
                {form.formState.errors.lessons_learned.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Review</Button>
          </div>
        </form>
      </div>

      {/* Tips Card */}
      <div className="mt-6 bg-muted/30 border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          Tips for Better Reviews
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              Be honest about the outcome rating - this data helps you calibrate future decisions
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              Focus on what you learned, not whether the outcome was "good" or "bad"
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>Consider: Did unexpected factors arise? Were your assumptions correct?</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
