import { z } from 'zod';

// Review update schema (for post-decision review)
export const reviewUpdateSchema = z.object({
  actual_outcome: z
    .string()
    .min(10, 'Describe what actually happened (at least 10 characters)'),
  outcome_rating: z
    .number()
    .min(1, 'Rating must be between 1-10')
    .max(10, 'Rating must be between 1-10'),
  lessons_learned: z
    .string()
    .min(10, 'Share your learnings (at least 10 characters)')
    .optional(),
});

export type ReviewUpdateFormData = z.infer<typeof reviewUpdateSchema>;
