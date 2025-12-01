export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

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
  created_at: number;
  updated_at: number;
}

export interface BrowserInstructions {
  name: string;
  icon: string;
  steps: string[];
}
