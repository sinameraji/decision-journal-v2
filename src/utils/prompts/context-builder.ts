/**
 * RAG Context Builder
 *
 * Builds context from retrieved similar decisions for LLM injection.
 * Replaces the old chat-context-builder.ts with RAG-powered approach.
 */

import type { Decision } from '../../types/decision';
import type { RAGContext } from '../../types/rag';
import { buildDecisionSummary } from './decision-context-prompt';

/**
 * Format a date relative to now (e.g., "3 days ago", "2 months ago").
 */
function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Build RAG context from similar decisions.
 *
 * This creates a concise summary of relevant past decisions
 * to inject into the system prompt.
 */
export function buildRAGContext(
  similarDecisions: Array<{
    decision: Decision;
    similarity: number;
    snippet?: string;
  }>
): string {
  if (similarDecisions.length === 0) {
    return '';
  }

  const parts: string[] = [];

  parts.push('='.repeat(60));
  parts.push('RELEVANT PAST DECISIONS');
  parts.push('='.repeat(60));
  parts.push(
    `\nI found ${similarDecisions.length} similar decisions from your history:\n`
  );

  similarDecisions.forEach((item, index) => {
    const { decision, similarity } = item;
    const relativeDate = formatRelativeDate(decision.created_at);

    parts.push(`\n${index + 1}. ${decision.problem_statement || 'Untitled'}`);

    // Only show similarity percentage if it's a real semantic match (> 0)
    if (similarity > 0) {
      parts.push(`   (${Math.round(similarity * 100)}% similar, ${relativeDate})`);
    } else {
      parts.push(`   (${relativeDate})`);
    }

    // Add outcome if reviewed
    if (decision.actual_outcome) {
      const outcomePreview =
        decision.actual_outcome.length > 150
          ? decision.actual_outcome.substring(0, 150) + '...'
          : decision.actual_outcome;
      parts.push(`   Outcome: ${outcomePreview}`);

      if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
        parts.push(`   Rating: ${decision.outcome_rating}/10`);
      }
    } else {
      // Show confidence if not yet reviewed
      if (decision.confidence_level !== null && decision.confidence_level !== undefined) {
        parts.push(`   Confidence: ${decision.confidence_level}/10`);
      }
    }

    // Key lesson if available
    if (decision.lessons_learned) {
      const lessonPreview =
        decision.lessons_learned.length > 100
          ? decision.lessons_learned.substring(0, 100) + '...'
          : decision.lessons_learned;
      parts.push(`   Lesson: ${lessonPreview}`);
    }

    // Tags for context
    if (decision.tags && decision.tags.length > 0) {
      parts.push(`   Tags: ${decision.tags.slice(0, 3).join(', ')}`);
    }
  });

  parts.push('\n' + '='.repeat(60));
  parts.push(
    'Use these past decisions as context when relevant to the current conversation.'
  );
  parts.push('='.repeat(60));

  return parts.join('\n');
}

/**
 * Build analytics snapshot for context.
 *
 * Optional: Include high-level statistics if helpful.
 */
export function buildAnalyticsSnapshot(decisions: Decision[]): string {
  if (decisions.length === 0) {
    return '';
  }

  const reviewedDecisions = decisions.filter((d) => d.actual_outcome);
  const parts: string[] = [];

  parts.push('\n' + '='.repeat(60));
  parts.push('DECISION HISTORY SNAPSHOT');
  parts.push('='.repeat(60));

  parts.push(`\nTotal decisions: ${decisions.length}`);
  parts.push(`Reviewed decisions: ${reviewedDecisions.length}`);

  if (reviewedDecisions.length > 0) {
    const avgRating =
      reviewedDecisions.reduce((sum, d) => sum + (d.outcome_rating || 0), 0) /
      reviewedDecisions.length;
    parts.push(`Average outcome rating: ${avgRating.toFixed(1)}/10`);
  }

  // Most common tags
  const tagCounts = new Map<string, number>();
  decisions.forEach((d) => {
    d.tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  if (tagCounts.size > 0) {
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => `${e[0]} (${e[1]})`)
      .join(', ');
    parts.push(`Top categories: ${topTags}`);
  }

  parts.push('='.repeat(60));

  return parts.join('\n');
}

/**
 * Create a complete RAG context object.
 */
export function createRAGContext(
  query: string,
  similarDecisions: Array<{
    decision: Decision;
    similarity: number;
  }>,
  retrievalTimeMs: number
): RAGContext {
  return {
    query,
    similarDecisions: similarDecisions.map((item) => ({
      decision: item.decision,
      similarity: item.similarity,
      snippet: buildDecisionSummary(item.decision),
    })),
    totalRetrieved: similarDecisions.length,
    retrievalTimeMs,
  };
}
