/**
 * Slash Command Parser
 *
 * Parses input text for slash commands to trigger tool palette or execute tools directly.
 */

import { toolRegistry } from '@/services/tools/tool-registry'
import { getToolByShortcut } from '@/services/tools/tool-shortcuts'
import type { ToolDefinition } from '@/services/tools/tool-types'

export interface SlashCommandParseResult {
  type: 'none' | 'trigger' | 'partial' | 'exact-match'
  command: string // The part after "/"
  tool: ToolDefinition | null // If exact match found
  cursorPosition: number
}

/**
 * Parse input text for slash commands.
 *
 * Rules:
 * 1. "/" at position 0 → Show palette
 * 2. "/pattern" partial → Filter palette to matching tools
 * 3. "/patterns " (with space after) → Exact match, execute tool
 * 4. "/" in middle of text → Ignore (not a command)
 */
export function parseSlashCommand(
  text: string,
  cursorPosition: number
): SlashCommandParseResult {
  // Rule 4: Only detect "/" at start of input
  if (!text.startsWith('/')) {
    return { type: 'none', command: '', tool: null, cursorPosition }
  }

  // Cursor must be at end or within the command
  // This prevents triggering when user moves cursor backward
  const textBeforeCursor = text.substring(0, cursorPosition)
  if (!textBeforeCursor.startsWith('/')) {
    return { type: 'none', command: '', tool: null, cursorPosition }
  }

  // Extract command (everything after "/" until space or end)
  const match = text.match(/^\/(\S*)/)
  if (!match) {
    // Just "/" with nothing after
    return { type: 'trigger', command: '', tool: null, cursorPosition }
  }

  const command = match[1].toLowerCase()

  // If no command yet (just "/"), show all tools
  if (command === '') {
    return { type: 'trigger', command: '', tool: null, cursorPosition }
  }

  // Check for exact shortcut match
  const toolId = getToolByShortcut(command)
  if (toolId) {
    const tool = toolRegistry.get(toolId)
    if (tool) {
      // Check if there's a space after (indicates user wants to execute)
      const hasSpaceAfter = text.length > match[0].length && text[match[0].length] === ' '

      if (hasSpaceAfter) {
        // Exact match with space = execute immediately
        return { type: 'exact-match', command, tool, cursorPosition }
      } else {
        // Exact match but no space = still typing, show filtered palette
        return { type: 'partial', command, tool, cursorPosition }
      }
    }
  }

  // Partial match - filter tools
  return { type: 'partial', command, tool: null, cursorPosition }
}

/**
 * Remove slash command from input text.
 * Used after tool selection to clean up the input field.
 */
export function removeSlashCommand(text: string): string {
  return text.replace(/^\/\S*\s*/, '')
}
