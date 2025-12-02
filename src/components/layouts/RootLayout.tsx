import { useState, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { CommandPalette } from '@/components/command-palette'
import { AppOnboardingModal } from '@/components/onboarding/AppOnboardingModal'
import { useStore, useLoadPreferences, useIsLoadingPreferences, useOnboardingCompleted, useFontSize, useSetFontSize } from '@/store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useFontSizeShortcuts } from '@/hooks/useFontSizeShortcuts'

export function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const loadPreferences = useLoadPreferences()
  const isLoadingPreferences = useIsLoadingPreferences()
  const onboardingCompleted = useOnboardingCompleted()
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const fontSize = useFontSize()
  const setFontSize = useSetFontSize()

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()
  useFontSizeShortcuts()

  // Initialize theme on mount
  useEffect(() => {
    // This will apply the current theme and set up listeners
    setTheme(theme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize font size on mount
  useEffect(() => {
    // Apply current font size
    setFontSize(fontSize)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  // Show onboarding when preferences loaded and not completed
  useEffect(() => {
    if (!isLoadingPreferences && !onboardingCompleted) {
      setShowOnboarding(true)
    }
  }, [isLoadingPreferences, onboardingCompleted])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Titlebar Drag Region */}
      <div
        data-tauri-drag-region
        className="fixed top-0 left-0 right-0 h-10 z-50 bg-background/80 backdrop-blur-sm border-b border-border"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden pt-10">
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <Toaster />

      {/* Command Palette */}
      <CommandPalette />

      {/* Onboarding Modal */}
      <AppOnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  )
}
