import type { StateCreator } from 'zustand';
import { sqliteService } from '@/services/database/sqlite-service';
import { permissionService } from '@/services/permission-service';
import { ollamaService } from '@/services/llm/ollama-service';
import type { PermissionStatus, FontSize } from '@/types/preferences';

export interface PreferencesState {
  onboardingCompleted: boolean;
  microphonePermission: PermissionStatus;
  microphoneAvailable: boolean;
  showVoiceTooltips: boolean;
  isLoadingPreferences: boolean;
  preferredOllamaModel: string | null;
  ollamaSetupCompleted: boolean;
  notificationPermission: PermissionStatus;
  preferencesLoadedFromDatabase: boolean;
  fontSize: FontSize;
}

export interface PreferencesActions {
  loadPreferences: () => Promise<void>;
  setOnboardingCompleted: () => Promise<void>;
  updateMicrophonePermission: (status: PermissionStatus) => Promise<void>;
  checkMicrophonePermission: () => Promise<void>;
  dismissVoiceTooltips: () => Promise<void>;
  setOllamaSetupCompleted: (modelName: string) => Promise<void>;
  checkOllamaStatus: () => Promise<boolean>;
  updateFontSize: (size: FontSize) => Promise<void>;
}

export type PreferencesSlice = PreferencesState & PreferencesActions;

export const createPreferencesSlice: StateCreator<PreferencesSlice> = (set, get) => ({
  // Initial state
  onboardingCompleted: false,
  microphonePermission: 'prompt',
  microphoneAvailable: true,
  showVoiceTooltips: true,
  isLoadingPreferences: false,
  preferredOllamaModel: null,
  ollamaSetupCompleted: false,
  notificationPermission: 'prompt',
  preferencesLoadedFromDatabase: false,
  fontSize: 'base',

  // Actions
  loadPreferences: async () => {
    set({ isLoadingPreferences: true });

    try {
      const prefs = await sqliteService.getUserPreferences();

      if (prefs) {
        set({
          onboardingCompleted: Boolean(prefs.onboarding_completed_at),
          microphonePermission: prefs.microphone_permission_status,
          notificationPermission: prefs.notification_permission_status,
          showVoiceTooltips: prefs.show_voice_tooltips,
          preferredOllamaModel: prefs.preferred_ollama_model || null,
          fontSize: prefs.font_size || 'base',
        });
      }

      // Check current permission status
      const status = await permissionService.checkMicrophonePermission();
      set({
        microphonePermission: status,
        microphoneAvailable: status !== 'unavailable',
      });

      // Check if Ollama is actually running
      await get().checkOllamaStatus();
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      set({
        isLoadingPreferences: false,
        preferencesLoadedFromDatabase: true, // Mark that DB is source of truth
      });
    }
  },

  setOnboardingCompleted: async () => {
    await sqliteService.updateUserPreferences({
      onboarding_completed_at: Date.now(),
    });
    set({ onboardingCompleted: true });
  },

  updateMicrophonePermission: async (status: PermissionStatus) => {
    await permissionService.savePermissionStatus(status);
    set({
      microphonePermission: status,
      microphoneAvailable: status !== 'unavailable',
    });
  },

  checkMicrophonePermission: async () => {
    const status = await permissionService.checkMicrophonePermission();
    set({
      microphonePermission: status,
      microphoneAvailable: status !== 'unavailable',
    });
  },

  dismissVoiceTooltips: async () => {
    await sqliteService.updateUserPreferences({
      show_voice_tooltips: false,
    });
    set({ showVoiceTooltips: false });
  },

  setOllamaSetupCompleted: async (modelName: string) => {
    await sqliteService.updateUserPreferences({
      preferred_ollama_model: modelName,
    });
    set({
      ollamaSetupCompleted: true,
      preferredOllamaModel: modelName,
    });
  },

  checkOllamaStatus: async () => {
    try {
      const isRunning = await ollamaService.isRunning();
      const models = await ollamaService.listModels();
      const hasModels = models.length > 0;
      set({ ollamaSetupCompleted: isRunning && hasModels });
      return isRunning && hasModels;
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
      set({ ollamaSetupCompleted: false });
      return false;
    }
  },

  updateFontSize: async (size: FontSize) => {
    await sqliteService.updateUserPreferences({
      font_size: size,
    });
    set({ fontSize: size });
  },
});
