export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

export const FONT_SIZE_CONFIG = {
  xs: { label: 'Extra Small', scale: 0.875 },
  sm: { label: 'Small', scale: 0.9375 },
  base: { label: 'Default', scale: 1.0 },
  lg: { label: 'Large', scale: 1.125 },
  xl: { label: 'Extra Large', scale: 1.25 },
} as const;

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
  created_at: number;
  updated_at: number;
}

export interface BrowserInstructions {
  name: string;
  icon: string;
  steps: string[];
}
