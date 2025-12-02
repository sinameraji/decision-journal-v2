import { sqliteService } from './database/sqlite-service';
import type { PermissionStatus, BrowserInstructions } from '@/types/preferences';
import { isDesktop } from '@/utils/platform';

class PermissionService {
  /**
   * Check microphone permission status (desktop app - OS handles permissions)
   */
  async checkMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // Check if MediaRecorder exists (basic capability check)
      if (typeof MediaRecorder === 'undefined') {
        return 'unavailable';
      }

      // For desktop apps, OS handles permissions
      // Return saved status or default to prompt
      const prefs = await sqliteService.getUserPreferences();
      const savedStatus = prefs?.microphone_permission_status;

      // If we've successfully recorded before, keep granted status
      return savedStatus === 'granted' ? 'granted' : 'prompt';
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return 'unavailable';
    }
  }

  /**
   * Request microphone permission (for desktop, OS prompts automatically)
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      console.log('Requesting microphone permission...');

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser');
        await this.savePermissionStatus('unavailable');
        return false;
      }

      // For desktop apps, attempting to use getUserMedia will trigger OS prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted, stream acquired');

      // Permission granted, clean up stream
      stream.getTracks().forEach(track => track.stop());

      await this.savePermissionStatus('granted');
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);

      if (error instanceof DOMException) {
        console.error('DOMException:', error.name, error.message);
        if (error.name === 'NotAllowedError') {
          console.log('User denied permission or OS denied access');
          await this.savePermissionStatus('denied');
        } else if (error.name === 'NotFoundError') {
          console.log('No microphone device found');
          await this.savePermissionStatus('unavailable');
        } else if (error.name === 'NotReadableError') {
          console.log('Microphone is being used by another application');
          await this.savePermissionStatus('denied');
        }
      }
      return false;
    }
  }

  /**
   * Save permission status to database
   */
  async savePermissionStatus(status: PermissionStatus): Promise<void> {
    await sqliteService.updateUserPreferences({
      microphone_permission_status: status,
      microphone_last_checked_at: Date.now(),
    });
  }

  /**
   * Get OS-specific instructions for enabling microphone
   */
  getPermissionInstructions(): BrowserInstructions {
    const isMac = navigator.platform.toLowerCase().includes('mac');

    if (isMac) {
      return {
        name: 'macOS',
        icon: '🍎',
        steps: [
          'Open System Settings > Privacy & Security',
          'Click on "Microphone" in the sidebar',
          'Enable microphone access for Decision Journal',
          'Restart the app if needed',
        ],
      };
    } else {
      return {
        name: 'Windows',
        icon: '🪟',
        steps: [
          'Open Settings > Privacy > Microphone',
          'Enable "Allow apps to access your microphone"',
          'Scroll down and enable for Decision Journal',
          'Restart the app if needed',
        ],
      };
    }
  }

  /**
   * Check notification permission status
   */
  async checkNotificationPermission(): Promise<PermissionStatus> {
    try {
      if (isDesktop()) {
        // Desktop mode - use Tauri notification API
        console.log('Checking notification permission in desktop mode...');
        const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
        const granted = await isPermissionGranted();
        console.log('isPermissionGranted returned:', granted);

        // In Tauri, we can't distinguish between 'prompt' and 'denied' directly
        // We need to check the saved status from database for denied state
        const savedPrefs = await sqliteService.getUserPreferences();
        const savedStatus = savedPrefs?.notification_permission_status;
        console.log('Saved permission status from DB:', savedStatus);

        // If explicitly denied before, keep that status
        if (savedStatus === 'denied' && !granted) {
          console.log('Permission was previously denied');
          return 'denied';
        }

        // Otherwise use the current grant status
        const status: PermissionStatus = granted ? 'granted' : 'prompt';
        await this.saveNotificationPermissionStatus(status);

        return status;
      } else {
        // Browser mode - use Notification API
        if (!('Notification' in window)) {
          return 'unavailable';
        }

        const permission = Notification.permission;
        if (permission === 'granted') {
          return 'granted';
        } else if (permission === 'denied') {
          return 'denied';
        } else {
          return 'prompt';
        }
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'unavailable';
    }
  }

  /**
   * Request notification permission
   * For Tauri, this sends a test notification which triggers the OS permission dialog
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (isDesktop()) {
        // Desktop mode - use Tauri notification API
        console.log('Requesting notification permission via Tauri...');
        const { requestPermission, isPermissionGranted, sendNotification } = await import('@tauri-apps/plugin-notification');

        console.log('Calling requestPermission()...');
        const permissionGranted = await requestPermission();
        console.log('requestPermission() returned:', permissionGranted);

        console.log('Checking isPermissionGranted()...');
        let isGranted = await isPermissionGranted();
        console.log('isPermissionGranted() returned:', isGranted);

        // If not granted yet, try sending a test notification to trigger the OS dialog
        if (!isGranted) {
          console.log('Sending test notification to trigger permission dialog...');
          try {
            await sendNotification({
              title: 'Notifications Enabled',
              body: 'You will now receive alerts from Decision Journal',
            });

            // Check again after sending notification
            isGranted = await isPermissionGranted();
            console.log('After test notification, isPermissionGranted():', isGranted);
          } catch (notifError) {
            console.log('Test notification failed (likely denied):', notifError);
          }
        }

        const finalGranted = permissionGranted === 'granted' || isGranted;
        console.log('Final granted status:', finalGranted);

        await this.saveNotificationPermissionStatus(finalGranted ? 'granted' : 'denied');
        return finalGranted;
      } else {
        // Browser mode - use Notification API
        if (!('Notification' in window)) {
          await this.saveNotificationPermissionStatus('unavailable');
          return false;
        }

        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';

        await this.saveNotificationPermissionStatus(granted ? 'granted' : 'denied');
        return granted;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      await this.saveNotificationPermissionStatus('denied');
      return false;
    }
  }

  /**
   * Save notification permission status to database
   */
  async saveNotificationPermissionStatus(status: PermissionStatus): Promise<void> {
    await sqliteService.updateUserPreferences({
      notification_permission_status: status,
      notification_last_checked_at: Date.now(),
    });
  }

  /**
   * Get OS-specific instructions for enabling notifications
   */
  getNotificationInstructions(): BrowserInstructions {
    const isMac = navigator.platform.toLowerCase().includes('mac');

    if (isMac) {
      return {
        name: 'macOS',
        icon: '🍎',
        steps: [
          'Open System Settings > Notifications',
          'Find "Decision Journal" in the app list',
          'Enable "Allow Notifications"',
          'Choose your preferred notification style',
        ],
      };
    } else {
      return {
        name: 'Windows',
        icon: '🪟',
        steps: [
          'Open Settings > System > Notifications',
          'Find "Decision Journal" in the app list',
          'Toggle on notifications',
          'Choose notification priority and behavior',
        ],
      };
    }
  }
}

export const permissionService = new PermissionService();
export default permissionService;
