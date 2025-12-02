import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { isCmdOrCtrl, isInputElement, NAVIGATION_SHORTCUTS } from "@/utils/keyboard"

/**
 * Global keyboard shortcuts hook
 * Handles Cmd/Ctrl+1-6 for navigation between main app sections
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (isInputElement(e.target)) {
        return
      }

      // Check for Cmd/Ctrl modifier
      if (!isCmdOrCtrl(e)) {
        return
      }

      // Check for number keys 1-6
      const key = e.key
      const number = parseInt(key, 10)

      // Find matching shortcut
      const shortcut = NAVIGATION_SHORTCUTS.find((s) => s.number === number)

      if (shortcut) {
        // Prevent browser default behavior (e.g., switching browser tabs)
        e.preventDefault()

        // Navigate to the route
        navigate({ to: shortcut.href })
      }
    }

    // Attach global keyboard listener
    document.addEventListener("keydown", handleKeyDown)

    // Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [navigate])
}
