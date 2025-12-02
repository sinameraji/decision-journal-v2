import type { Decision } from '@/types/decision';
import { SEARCH_CONTEXT_LENGTH, SEARCH_DEFAULT_TEXT_LENGTH } from '@/constants/search';

/**
 * Escapes special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns array of field names that matched the search query
 */
export function getMatchedFields(decision: Decision, query: string): string[] {
  if (!query || query.trim() === '') return [];

  const searchTerm = query.toLowerCase();
  const matchedFields: string[] = [];

  // Core content fields
  if (decision.situation?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Situation');
  }
  if (decision.problem_statement?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Problem');
  }

  // Projections
  if (decision.expected_outcome?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Expected Outcome');
  }
  if (decision.best_case_scenario?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Best Case');
  }
  if (decision.worst_case_scenario?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Worst Case');
  }

  // Context
  if (decision.mental_state?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Mental State');
  }
  if (decision.physical_state?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Physical State');
  }

  // Review
  if (decision.actual_outcome?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Actual Outcome');
  }
  if (decision.lessons_learned?.toLowerCase().includes(searchTerm)) {
    matchedFields.push('Lessons Learned');
  }

  // Arrays
  if (decision.variables?.some(v => v.toLowerCase().includes(searchTerm))) {
    matchedFields.push('Variables');
  }
  if (decision.complications?.some(c => c.toLowerCase().includes(searchTerm))) {
    matchedFields.push('Complications');
  }

  // Alternatives (nested)
  if (decision.alternatives?.some(alt =>
    alt.title?.toLowerCase().includes(searchTerm) ||
    alt.description?.toLowerCase().includes(searchTerm) ||
    alt.pros?.some(p => p.toLowerCase().includes(searchTerm)) ||
    alt.cons?.some(c => c.toLowerCase().includes(searchTerm))
  )) {
    matchedFields.push('Alternatives');
  }

  return matchedFields;
}

/**
 * Extracts a snippet of text around the search match
 */
export function extractSearchContext(
  text: string,
  query: string,
  contextLength: number = SEARCH_CONTEXT_LENGTH
): string {
  if (!text || !query || query.trim() === '') {
    return text.slice(0, SEARCH_DEFAULT_TEXT_LENGTH) + (text.length > SEARCH_DEFAULT_TEXT_LENGTH ? '...' : '');
  }

  const searchTerm = query.toLowerCase();
  const lowerText = text.toLowerCase();
  const matchIndex = lowerText.indexOf(searchTerm);

  if (matchIndex === -1) {
    // No match, return beginning
    return text.slice(0, SEARCH_DEFAULT_TEXT_LENGTH) + (text.length > SEARCH_DEFAULT_TEXT_LENGTH ? '...' : '');
  }

  // Calculate start and end positions
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(text.length, matchIndex + query.length + contextLength);

  // Extract snippet
  let snippet = text.slice(start, end);

  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}
