import { z } from 'zod';

export const profileContextItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().max(2000, 'Answer is too long'),
});

export const profileFormSchema = z.object({
  profile_name: z.string().max(100, 'Name is too long').optional(),
  profile_description: z.string().max(500, 'Description is too long').optional(),
  profile_context: z.array(profileContextItemSchema).optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
