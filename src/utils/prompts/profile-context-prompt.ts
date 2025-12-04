/**
 * User Profile Context Builder
 *
 * Formats user profile information (name, bio, structured Q&A) for injection
 * into the LLM system prompt. This allows the AI to personalize its coaching
 * based on the user's background, values, and decision-making context.
 */

import type { ProfileContextItem } from '@/types/preferences';

export interface UserProfile {
  name: string | null;
  description: string | null;
  contextItems: ProfileContextItem[];
}

/**
 * Build user profile context section for LLM system prompt.
 *
 * Formats the user's profile information (name, bio, structured Q&A)
 * into a clear, scannable format for the LLM to understand who the user is.
 *
 * @param profile - User profile data from preferences store
 * @returns Formatted profile context string, or null if no profile data exists
 */
export function buildProfileContext(profile: UserProfile | null): string | null {
  if (!profile) return null;

  // Skip if profile is completely empty
  const hasName = profile.name && profile.name.trim().length > 0;
  const hasDescription = profile.description && profile.description.trim().length > 0;
  const hasContext = profile.contextItems.length > 0;

  if (!hasName && !hasDescription && !hasContext) {
    return null;
  }

  // Build profile context
  let context = '============================================================\n';
  context += 'USER PROFILE\n';
  context += '============================================================\n\n';

  if (hasName) {
    context += `Name: ${profile.name}\n\n`;
  }

  if (hasDescription) {
    context += `Bio: ${profile.description}\n\n`;
  }

  if (hasContext) {
    context += 'Additional Context:\n\n';
    profile.contextItems.forEach((item, index) => {
      // Only include answered questions (skip empty answers)
      if (item.answer && item.answer.trim().length > 0) {
        context += `${index + 1}. ${item.question}\n`;
        context += `   ${item.answer}\n\n`;
      }
    });
  }

  context += '============================================================\n';
  context += 'Use this profile information to personalize your coaching and\n';
  context += 'reference relevant context when helping with decisions.\n';
  context += '============================================================\n';

  return context;
}
