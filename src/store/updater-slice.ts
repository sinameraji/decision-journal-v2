import type { StateCreator } from 'zustand'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
  version: string
  currentVersion: string
  date: string
  body: string
}

export interface UpdaterState {
  // State
  isCheckingForUpdates: boolean
  isDownloadingUpdate: boolean
  downloadProgress: number
  availableUpdate: UpdateInfo | null
  updateError: string | null
  lastUpdateCheck: number | null
  showUpdateDialog: boolean

  // Preferences
  autoCheckEnabled: boolean
}

export interface UpdaterActions {
  checkForUpdates: (manual?: boolean) => Promise<void>
  downloadAndInstall: () => Promise<void>
  dismissUpdateDialog: () => void
  scheduleNextCheck: () => void
  setAutoCheckEnabled: (enabled: boolean) => Promise<void>
}

export type UpdaterSlice = UpdaterState & UpdaterActions

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const createUpdaterSlice: StateCreator<UpdaterSlice> = (set, get) => ({
  // Initial state
  isCheckingForUpdates: false,
  isDownloadingUpdate: false,
  downloadProgress: 0,
  availableUpdate: null,
  updateError: null,
  lastUpdateCheck: null,
  showUpdateDialog: false,
  autoCheckEnabled: true,

  // Actions
  checkForUpdates: async (manual = false) => {
    const { isCheckingForUpdates, lastUpdateCheck } = get()

    // Prevent duplicate checks
    if (isCheckingForUpdates) return

    // For automatic checks, enforce 24-hour minimum interval
    if (!manual && lastUpdateCheck) {
      const timeSinceLastCheck = Date.now() - lastUpdateCheck
      if (timeSinceLastCheck < ONE_DAY_MS) {
        console.log('Skipping automatic update check - too soon')
        return
      }
    }

    set({
      isCheckingForUpdates: true,
      updateError: null,
    })

    try {
      const update = await check()

      set({ lastUpdateCheck: Date.now() })

      if (update) {
        const updateInfo: UpdateInfo = {
          version: update.version,
          currentVersion: update.currentVersion,
          date: update.date || new Date().toISOString(),
          body: update.body || 'No release notes available.',
        }

        set({
          availableUpdate: updateInfo,
          showUpdateDialog: true,
        })

        console.log(`Update available: ${update.version}`)
      } else {
        console.log('No updates available')

        // For manual checks, show a toast even if no update
        if (manual) {
          // This will be handled in the UI layer
          set({ updateError: 'NO_UPDATE_AVAILABLE' })
        }
      }
    } catch (error) {
      console.error('Update check failed:', error)
      set({
        updateError: error instanceof Error ? error.message : 'Failed to check for updates',
      })
    } finally {
      set({ isCheckingForUpdates: false })
    }
  },

  downloadAndInstall: async () => {
    const { availableUpdate, isDownloadingUpdate } = get()

    if (!availableUpdate || isDownloadingUpdate) return

    set({
      isDownloadingUpdate: true,
      downloadProgress: 0,
      updateError: null,
    })

    try {
      // Re-check to get the update object
      const update = await check()

      if (!update) {
        throw new Error('Update no longer available')
      }

      // Download and install with progress tracking
      let totalDownloaded = 0
      let contentLength = 0

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            set({ downloadProgress: 0 })
            totalDownloaded = 0
            contentLength = event.data.contentLength || 0
            console.log('Update download started')
            break
          case 'Progress':
            totalDownloaded += event.data.chunkLength
            if (contentLength > 0) {
              const progress = (totalDownloaded / contentLength) * 100
              set({ downloadProgress: progress })
              console.log(`Download progress: ${progress.toFixed(1)}%`)
            }
            break
          case 'Finished':
            set({ downloadProgress: 100 })
            console.log('Update downloaded and installed')
            break
        }
      })

      // Close the dialog and relaunch
      set({
        showUpdateDialog: false,
        availableUpdate: null,
      })

      // Relaunch the application
      try {
        await relaunch()
      } catch (relaunchError) {
        console.error('Relaunch failed:', relaunchError)
        throw new Error(
          'Update installed successfully but failed to restart. Please restart the application manually.'
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to install update'
      console.error('Update installation failed:', error)

      // Re-open the dialog to show the error
      set({
        showUpdateDialog: true,
        updateError: errorMessage,
        isDownloadingUpdate: false,
        downloadProgress: 0,
      })
    }
  },

  dismissUpdateDialog: () => {
    set({
      showUpdateDialog: false,
      updateError: null,
    })
  },

  scheduleNextCheck: () => {
    const { autoCheckEnabled, checkForUpdates } = get()

    if (!autoCheckEnabled) return

    // Schedule next check in 24 hours
    setTimeout(() => {
      checkForUpdates(false)
      get().scheduleNextCheck() // Reschedule
    }, ONE_DAY_MS)
  },

  setAutoCheckEnabled: async (enabled: boolean) => {
    set({ autoCheckEnabled: enabled })

    if (enabled) {
      get().scheduleNextCheck()
    }
  },
})
