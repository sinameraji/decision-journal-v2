/**
 * Multi-Decision Context Prompt Builder
 *
 * Builds context prompts for conversations with multiple attached decisions.
 * Uses adaptive summarization based on the number of decisions to fit token budgets.
 */

import type { Decision } from '../../types/decision';
import { buildDecisionContextPrompt } from './decision-context-prompt';

/**
 * Build context prompt for multiple attached decisions.
 *
 * Strategy:
 * - 1 decision: Use full context (via buildDecisionContextPrompt)
 * - 2-3 decisions: Detailed summaries (~600 tokens each)
 * - 4-5 decisions: Medium summaries (~400 tokens each)
 * - 6+ decisions: Brief summaries (~300 tokens each)
 */
export function buildMultiDecisionContextPrompt(decisions: Decision[]): string {
  if (decisions.length === 0) return '';

  // Single decision: Use full context
  if (decisions.length === 1) {
    return buildDecisionContextPrompt(decisions[0]);
  }

  // Multiple decisions: Use adaptive summarization
  const parts: string[] = [];

  parts.push('='.repeat(60));
  parts.push(`ATTACHED DECISIONS CONTEXT (${decisions.length} decisions)`);
  parts.push('='.repeat(60));
  parts.push('');
  parts.push('The user has attached these decisions for context:');
  parts.push('');

  // Determine verbosity level based on count
  const verbosity = getVerbosityLevel(decisions.length);

  decisions.forEach((decision, index) => {
    parts.push(`${index + 1}. ${decision.problem_statement || 'Decision'}`);
    parts.push('');

    if (verbosity === 'detailed') {
      parts.push(...buildDetailedSummary(decision));
    } else if (verbosity === 'medium') {
      parts.push(...buildMediumSummary(decision));
    } else {
      parts.push(...buildBriefSummary(decision));
    }

    parts.push('');
    parts.push('-'.repeat(60));
    parts.push('');
  });

  parts.push('='.repeat(60));
  parts.push('Use these decisions to:');
  parts.push('- Identify patterns across the user\'s decision-making');
  parts.push('- Provide personalized insights based on their history');
  parts.push('- Reference specific decisions when relevant');
  parts.push('- Help calibrate their confidence and projections');
  parts.push('='.repeat(60));

  return parts.join('\n');
}

/**
 * Determine verbosity level based on number of decisions
 */
function getVerbosityLevel(count: number): 'detailed' | 'medium' | 'brief' {
  if (count <= 3) return 'detailed';
  if (count <= 5) return 'medium';
  return 'brief';
}

/**
 * Build detailed summary for 2-3 decisions (~600 tokens each)
 */
function buildDetailedSummary(decision: Decision): string[] {
  const parts: string[] = [];

  // Situation
  if (decision.situation) {
    const truncated = decision.situation.length > 200
      ? decision.situation.substring(0, 200) + '...'
      : decision.situation;
    parts.push(`   Situation: ${truncated}`);
  }

  // State
  const stateInfo: string[] = [];
  if (decision.mental_state) stateInfo.push(decision.mental_state);
  if (decision.emotional_flags && decision.emotional_flags.length > 0) {
    stateInfo.push(`Emotions: ${decision.emotional_flags.slice(0, 3).join(', ')}`);
  }
  if (stateInfo.length > 0) {
    parts.push(`   State: ${stateInfo.join(' | ')}`);
  }

  // Alternatives
  if (decision.alternatives && decision.alternatives.length > 0) {
    parts.push(`   Alternatives: ${decision.alternatives.length} considered`);
    const selected = decision.alternatives.find(a => a.id === decision.selected_alternative_id);
    if (selected) {
      parts.push(`   → Selected: ${selected.title || selected.description}`);
    }
  }

  // Outcome or Confidence
  if (decision.actual_outcome) {
    const truncated = decision.actual_outcome.length > 150
      ? decision.actual_outcome.substring(0, 150) + '...'
      : decision.actual_outcome;
    parts.push(`   Outcome: ${truncated}`);
    if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
      parts.push(`   Rating: ${decision.outcome_rating}/10`);
    }
    if (decision.lessons_learned) {
      const lessons = decision.lessons_learned.length > 100
        ? decision.lessons_learned.substring(0, 100) + '...'
        : decision.lessons_learned;
      parts.push(`   Lessons: ${lessons}`);
    }
  } else {
    if (decision.confidence_level !== null && decision.confidence_level !== undefined) {
      parts.push(`   Confidence: ${decision.confidence_level}/10`);
    }
    parts.push(`   Status: In progress`);
  }

  // Tags
  if (decision.tags && decision.tags.length > 0) {
    parts.push(`   Tags: ${decision.tags.slice(0, 5).join(', ')}`);
  }

  return parts;
}

/**
 * Build medium summary for 4-5 decisions (~400 tokens each)
 */
function buildMediumSummary(decision: Decision): string[] {
  const parts: string[] = [];

  // Brief situation
  if (decision.situation) {
    const truncated = decision.situation.length > 120
      ? decision.situation.substring(0, 120) + '...'
      : decision.situation;
    parts.push(`   ${truncated}`);
  }

  // Key metrics
  const metrics: string[] = [];
  if (decision.alternatives && decision.alternatives.length > 0) {
    metrics.push(`${decision.alternatives.length} alternatives`);
  }
  if (decision.confidence_level !== null && decision.confidence_level !== undefined) {
    metrics.push(`confidence: ${decision.confidence_level}/10`);
  }
  if (decision.actual_outcome) {
    metrics.push('reviewed');
    if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
      metrics.push(`rating: ${decision.outcome_rating}/10`);
    }
  }
  if (metrics.length > 0) {
    parts.push(`   ${metrics.join(' | ')}`);
  }

  // Emotional context
  if (decision.emotional_flags && decision.emotional_flags.length > 0) {
    parts.push(`   Emotions: ${decision.emotional_flags.slice(0, 3).join(', ')}`);
  }

  // Outcome or tags
  if (decision.actual_outcome) {
    const truncated = decision.actual_outcome.length > 100
      ? decision.actual_outcome.substring(0, 100) + '...'
      : decision.actual_outcome;
    parts.push(`   Outcome: ${truncated}`);
  } else if (decision.tags && decision.tags.length > 0) {
    parts.push(`   Tags: ${decision.tags.slice(0, 3).join(', ')}`);
  }

  return parts;
}

/**
 * Build brief summary for 6+ decisions (~300 tokens each)
 */
function buildBriefSummary(decision: Decision): string[] {
  const parts: string[] = [];

  // One-line summary
  const summary: string[] = [];

  if (decision.actual_outcome) {
    summary.push('Reviewed');
    if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
      summary.push(`(${decision.outcome_rating}/10)`);
    }
  } else {
    summary.push('In progress');
    if (decision.confidence_level !== null && decision.confidence_level !== undefined) {
      summary.push(`(confidence: ${decision.confidence_level}/10)`);
    }
  }

  if (decision.alternatives && decision.alternatives.length > 0) {
    summary.push(`${decision.alternatives.length} alternatives`);
  }

  if (decision.emotional_flags && decision.emotional_flags.length > 0) {
    summary.push(decision.emotional_flags[0]);
  }

  parts.push(`   ${summary.join(' | ')}`);

  // Tags if available
  if (decision.tags && decision.tags.length > 0) {
    parts.push(`   Tags: ${decision.tags.slice(0, 3).join(', ')}`);
  }

  return parts;
}
