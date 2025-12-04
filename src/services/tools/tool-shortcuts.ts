/**
 * Tool Shortcuts Mapping
 *
 * Maps shortcut strings to tool IDs for quick access via slash commands.
 * Shortcuts are case-insensitive.
 */

export const TOOL_SHORTCUTS: Record<string, string> = {
  // Pattern tools
  patterns: 'pattern-detective',
  pattern: 'pattern-detective',
  detective: 'pattern-detective',
  calibrate: 'calibration-coach',
  calibration: 'calibration-coach',
  coach: 'calibration-coach',

  // Risk tools
  premortem: 'pre-mortem',
  'pre-mortem': 'pre-mortem',
  mortem: 'pre-mortem',

  // Framework tools
  bias: 'bias-detector',
  biases: 'bias-detector',
  detector: 'bias-detector',
}

/**
 * Get tool ID by shortcut (case-insensitive)
 */
export function getToolByShortcut(shortcut: string): string | undefined {
  return TOOL_SHORTCUTS[shortcut.toLowerCase()]
}

/**
 * Get primary shortcut for tool ID (returns first match)
 */
export function getShortcutForTool(toolId: string): string | undefined {
  const entry = Object.entries(TOOL_SHORTCUTS).find(([_, id]) => id === toolId)
  return entry?.[0]
}

/**
 * Get all shortcuts for a tool
 */
export function getAllShortcutsForTool(toolId: string): string[] {
  return Object.entries(TOOL_SHORTCUTS)
    .filter(([_, id]) => id === toolId)
    .map(([shortcut]) => shortcut)
}
