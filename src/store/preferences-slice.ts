import type { StateCreator } from 'zustand';
import { sqliteService } from '@/services/database/sqlite-service';
import { permissionService } from '@/services/permission-service';
import { ollamaService } from '@/services/llm/ollama-service';
import { fileStorageService } from '@/services/file-storage-service';
import type { PermissionStatus, FontSize, ProfileContextItem } from '@/types/preferences';
import type { ProfileFormData } from '@/schemas/profile-form.schema';

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
  profileName: string | null;
  profileDescription: string | null;
  profileImagePath: string | null;
  profileContext: ProfileContextItem[];
  whisperModel: 'tiny' | 'base' | null;
  whisperModelDownloaded: boolean;
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
  updateProfile: (profile: ProfileFormData) => Promise<void>;
  updateProfileImage: (file: File) => Promise<void>;
  removeProfileImage: () => Promise<void>;
  getProfileImageUrl: () => Promise<string | null>;
  setWhisperModel: (modelType: 'tiny' | 'base') => void;
  setWhisperModelDownloaded: (downloaded: boolean) => void;
  checkWhisperModelStatus: () => Promise<void>;
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
  profileName: null,
  profileDescription: null,
  profileImagePath: null,
  profileContext: [],
  whisperModel: null,
  whisperModelDownloaded: false,

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
          profileName: prefs.profile_name || null,
          profileDescription: prefs.profile_description || null,
          profileImagePath: prefs.profile_image_path || null,
          profileContext: prefs.profile_context || [],
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

  updateProfile: async (profile: ProfileFormData) => {
    await sqliteService.updateUserPreferences({
      profile_name: profile.profile_name || null,
      profile_description: profile.profile_description || null,
      profile_context: profile.profile_context || [],
    });
    set({
      profileName: profile.profile_name || null,
      profileDescription: profile.profile_description || null,
      profileContext: profile.profile_context || [],
    });
  },

  updateProfileImage: async (file: File) => {
    const filename = await fileStorageService.saveProfileImage(file);
    await sqliteService.updateUserPreferences({
      profile_image_path: filename,
    });
    set({ profileImagePath: filename });
  },

  removeProfileImage: async () => {
    const { profileImagePath } = get();
    if (profileImagePath) {
      await fileStorageService.deleteProfileImage(profileImagePath);
      await sqliteService.updateUserPreferences({
        profile_image_path: null,
      });
      set({ profileImagePath: null });
    }
  },

  getProfileImageUrl: async () => {
    const { profileImagePath } = get();
    if (!profileImagePath) return null;
    return fileStorageService.getProfileImageUrl(profileImagePath);
  },

  setWhisperModel: (modelType: 'tiny' | 'base') => {
    set({ whisperModel: modelType });
  },

  setWhisperModelDownloaded: (downloaded: boolean) => {
    set({ whisperModelDownloaded: downloaded });
  },

  checkWhisperModelStatus: async () => {
    try {
      const { whisperService } = await import('@/services/transcription/whisper-service');
      const status = await whisperService.getModelStatus();

      set({
        whisperModelDownloaded: status.isDownloaded,
        whisperModel: status.modelType as 'tiny' | 'base' | null,
      });
    } catch (error) {
      console.error('Failed to check Whisper model status:', error);
      set({ whisperModelDownloaded: false, whisperModel: null });
    }
  },
});
