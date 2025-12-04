/**
 * Decision Context Prompt Builder
 *
 * Builds context prompts for decision-linked conversations.
 */

import type { Decision } from '../../types/decision';

/**
 * Build a concise decision context prompt.
 *
 * This gives the LLM essential information about the decision
 * being discussed without overwhelming the context window.
 */
export function buildDecisionContextPrompt(decision: Decision): string {
  const parts: string[] = [];

  parts.push('='.repeat(60));
  parts.push('CURRENT DECISION CONTEXT');
  parts.push('='.repeat(60));

  // Problem statement
  if (decision.problem_statement) {
    parts.push(`\nProblem: ${decision.problem_statement}`);
  }

  // Situation (truncated)
  if (decision.situation) {
    const truncatedSituation =
      decision.situation.length > 300
        ? decision.situation.substring(0, 300) + '...'
        : decision.situation;
    parts.push(`\nSituation: ${truncatedSituation}`);
  }

  // Mental/emotional state
  const stateInfo: string[] = [];
  if (decision.mental_state) {
    stateInfo.push(`Mental: ${decision.mental_state}`);
  }
  if (decision.physical_state) {
    stateInfo.push(`Physical: ${decision.physical_state}`);
  }
  if (decision.emotional_flags && decision.emotional_flags.length > 0) {
    stateInfo.push(`Emotions: ${decision.emotional_flags.join(', ')}`);
  }
  if (stateInfo.length > 0) {
    parts.push(`\nState: ${stateInfo.join(' | ')}`);
  }

  // Alternatives
  if (decision.alternatives && decision.alternatives.length > 0) {
    parts.push(`\nAlternatives considered: ${decision.alternatives.length}`);
    decision.alternatives.slice(0, 3).forEach((alt, i) => {
      const isSelected = decision.selected_alternative_id === alt.id;
      const marker = isSelected ? '→' : ' ';
      const title = alt.title || alt.description || 'Alternative';
      parts.push(`  ${marker} ${i + 1}. ${title}`);
    });
    if (decision.alternatives.length > 3) {
      parts.push(`  ... and ${decision.alternatives.length - 3} more`);
    }
  }

  // Confidence
  if (decision.confidence_level !== null && decision.confidence_level !== undefined) {
    parts.push(`\nConfidence: ${decision.confidence_level}/10`);
  }

  // Outcome (if reviewed)
  if (decision.actual_outcome) {
    const truncatedOutcome =
      decision.actual_outcome.length > 200
        ? decision.actual_outcome.substring(0, 200) + '...'
        : decision.actual_outcome;
    parts.push(`\nActual Outcome: ${truncatedOutcome}`);

    if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
      parts.push(`Outcome Rating: ${decision.outcome_rating}/10`);
    }

    if (decision.lessons_learned) {
      const truncatedLessons =
        decision.lessons_learned.length > 150
          ? decision.lessons_learned.substring(0, 150) + '...'
          : decision.lessons_learned;
      parts.push(`Lessons: ${truncatedLessons}`);
    }
  }

  // Tags
  if (decision.tags && decision.tags.length > 0) {
    parts.push(`\nTags: ${decision.tags.join(', ')}`);
  }

  parts.push('='.repeat(60));
  parts.push(
    '\nFocus on helping the user think through THIS decision specifically.'
  );
  parts.push('='.repeat(60));

  return parts.join('\n');
}

/**
 * Build a brief decision summary (for RAG context).
 */
export function buildDecisionSummary(decision: Decision): string {
  const parts: string[] = [];

  if (decision.problem_statement) {
    parts.push(`Problem: ${decision.problem_statement}`);
  }

  if (decision.actual_outcome) {
    const summary =
      decision.actual_outcome.length > 100
        ? decision.actual_outcome.substring(0, 100) + '...'
        : decision.actual_outcome;
    parts.push(`Outcome: ${summary}`);
    if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
      parts.push(`(rated ${decision.outcome_rating}/10)`);
    }
  } else {
    parts.push(`(Confidence: ${decision.confidence_level}/10)`);
  }

  return parts.join(' ');
}
