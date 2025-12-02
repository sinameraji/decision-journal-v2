import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ReviewWorkflow } from '@/components/decision/ReviewWorkflow/ReviewWorkflow';
import { useStore } from '@/store';
import type { ReviewUpdateFormData } from '@/schemas/decision-form.schema';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function ReviewDecisionPage() {
  const { id } = useParams({ from: '/decision/$id/review' });
  const navigate = useNavigate();
  const decisions = useStore((state) => state.decisions);
  const updateDecision = useStore((state) => state.updateDecision);
  const loadDecisions = useStore((state) => state.loadDecisions);
  const [decision, setDecision] = useState(decisions.find((d) => d.id === id));

  useEffect(() => {
    // Load decisions if not already loaded
    const loadData = async () => {
      await loadDecisions();
      const found = useStore.getState().decisions.find((d) => d.id === id);
      setDecision(found);
    };

    if (!decision) {
      loadData();
    }
  }, [id, decision, loadDecisions]);

  const handleSubmit = async (data: ReviewUpdateFormData) => {
    if (!id) return;

    try {
      await updateDecision(id, {
        actual_outcome: data.actual_outcome,
        outcome_rating: data.outcome_rating,
        lessons_learned: data.lessons_learned || null,
      });

      // Navigate back to decision view
      navigate({ to: `/decision/${id}` });
    } catch (error) {
      console.error('Failed to save review:', error);
      alert('Failed to save review. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate({ to: `/decision/${id}` });
  };

  if (!id) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Invalid Decision</h2>
          <p className="text-red-700 dark:text-red-500 mb-4">No decision ID provided.</p>
          <Button onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decisions
          </Button>
        </div>
        </div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-400 mb-2">Decision Not Found</h2>
          <p className="text-yellow-700 dark:text-yellow-500 mb-4">
            The decision you're trying to review doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decisions
          </Button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 px-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decision
        </Button>
      </div>

      <ReviewWorkflow
        decision={decision}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
      </div>
    </div>
  );
}
