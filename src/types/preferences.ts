export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

export const FONT_SIZE_CONFIG = {
  xs: { label: 'Extra Small', scale: 0.875 },
  sm: { label: 'Small', scale: 0.9375 },
  base: { label: 'Default', scale: 1.0 },
  lg: { label: 'Large', scale: 1.125 },
  xl: { label: 'Extra Large', scale: 1.25 },
} as const;

export interface ProfileContextItem {
  question: string;
  answer: string;
}

export const DEFAULT_PROFILE_QUESTIONS = [
  "Who are you and what do you do?",
  "What are some essential context about your decision-making life that you want the AI to know about you?",
  "What are your key values or principles that guide your decisions?",
  "What types of decisions do you typically struggle with?",
  "What external factors or constraints regularly influence your decisions (time, budget, family, etc.)?",
  "What has been your biggest learning from past decisions?"
] as const;

export interface UserPreferences {
  id: string;
  onboarding_completed_at: number | null;
  onboarding_skipped_steps: string[];
  microphone_permission_status: PermissionStatus;
  microphone_last_checked_at: number | null;
  show_voice_tooltips: boolean;
  notification_permission_status: PermissionStatus;
  notification_last_checked_at: number | null;
  preferred_ollama_model: string | null;
  font_size: FontSize;
  profile_name: string | null;
  profile_description: string | null;
  profile_image_path: string | null;
  profile_context: ProfileContextItem[];
  created_at: number;
  updated_at: number;
}

export interface BrowserInstructions {
  name: string;
  icon: string;
  steps: string[];
}
