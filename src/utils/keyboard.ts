/**
 * Keyboard utility functions for handling shortcuts across platforms
 */

/**
 * Navigation shortcuts configuration
 * Maps keyboard numbers to route paths
 */
export const NAVIGATION_SHORTCUTS = [
  { number: 1, href: "/", label: "Decisions" },
  { number: 2, href: "/new", label: "New Decision" },
  { number: 3, href: "/reviews", label: "Reviews" },
  { number: 4, href: "/analytics", label: "Analytics" },
  { number: 5, href: "/chat", label: "Chat" },
  { number: 6, href: "/settings", label: "Settings" },
  { number: 7, href: "/search", label: "Search" },
] as const

/**
 * Detects if the Cmd (macOS) or Ctrl (Windows/Linux) modifier key is pressed
 */
export function isCmdOrCtrl(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey
}

/**
 * Returns the appropriate modifier key symbol for the current platform
 * @returns "⌘" for macOS, "Ctrl" for Windows/Linux
 */
export function getModifierKeySymbol(): string {
  // Check if running on macOS
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent)
  return isMac ? "⌘" : "Ctrl"
}

/**
 * Returns the full modifier key name for the current platform
 * @returns "Cmd" for macOS, "Ctrl" for Windows/Linux
 */
export function getModifierKeyName(): string {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent)
  return isMac ? "Cmd" : "Ctrl"
}

/**
 * Checks if the event target is an input element where shortcuts should be disabled
 */
export function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  )
}
