import { subMonths, subYears, startOfDay, endOfDay, format } from 'date-fns';
import type { DateRangePreset, GroupedDecisions } from '@/types/export';
import type { Decision } from '@/types/decision';

/**
 * Convert a date range preset to timestamp range
 */
export function getDateRangeFromPreset(preset: DateRangePreset): { from: number; to: number } {
  const now = new Date();
  const to = endOfDay(now).getTime();

  let from: number;

  switch (preset) {
    case 'month':
      from = startOfDay(subMonths(now, 1)).getTime();
      break;
    case '3months':
      from = startOfDay(subMonths(now, 3)).getTime();
      break;
    case 'year':
      from = startOfDay(subYears(now, 1)).getTime();
      break;
    case 'all':
      from = 0; // Beginning of time
      break;
    default:
      from = 0;
  }

  return { from, to };
}

/**
 * Group decisions by their creation date (YYYY-MM-DD format)
 */
export function groupDecisionsByDate(decisions: Decision[]): GroupedDecisions {
  const grouped: GroupedDecisions = {};

  for (const decision of decisions) {
    const dateKey = formatDateForFilename(decision.created_at);

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(decision);
  }

  return grouped;
}

/**
 * Format a timestamp as YYYY-MM-DD for folder names
 */
export function formatDateForFilename(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd');
}

/**
 * Format a timestamp as a human-readable date string
 */
export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'MMMM d, yyyy');
}

/**
 * Format a timestamp as a human-readable date and time string
 */
export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'MMMM d, yyyy \'at\' h:mm a');
}
