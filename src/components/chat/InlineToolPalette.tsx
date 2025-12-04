/**
 * Inline Tool Palette Component
 *
 * Floating palette that appears above the input field when user types "/".
 * Displays tools in a vertical list grouped by category.
 */

import { useMemo, useRef, useEffect } from 'react'
import {
  Fingerprint,
  Target,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Shield,
  Calculator,
  Compass,
  GitBranch,
  FlipVertical,
  Clock,
  Eye,
} from 'lucide-react'
import type { ToolDefinition, ToolCategory } from '@/services/tools/tool-types'
import { getShortcutForTool } from '@/services/tools/tool-shortcuts'
import type { Decision } from '@/types/decision'

interface InlineToolPaletteProps {
  tools: ToolDefinition[]
  filterQuery: string
  highlightedIndex: number
  onToolSelect: (tool: ToolDefinition) => void
  currentDecision?: Decision
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Fingerprint,
  Target,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Shield,
  Calculator,
  Compass,
  GitBranch,
  FlipVertical,
  Clock,
  Eye,
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  pattern: 'Patterns',
  risk: 'Risk',
  framework: 'Frameworks',
}

export function InlineToolPalette({
  tools,
  filterQuery,
  highlightedIndex,
  onToolSelect,
  currentDecision,
}: InlineToolPaletteProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Group tools by category
  const toolsByCategory = useMemo(() => {
    const grouped = tools.reduce(
      (acc, tool) => {
        if (!acc[tool.category]) {
          acc[tool.category] = []
        }
        acc[tool.category].push(tool)
        return acc
      },
      {} as Record<ToolCategory, ToolDefinition[]>
    )
    return grouped
  }, [tools])

  // Flatten for keyboard navigation
  const flattenedTools = useMemo(() => {
    return tools
  }, [tools])

  // Check if tool should be disabled
  const isToolDisabled = (tool: ToolDefinition): boolean => {
    if (tool.metadata.requiresDecisionLink && !currentDecision) {
      return true
    }
    // Additional checks can be added here (e.g., requiresReviewedDecisions)
    return false
  }

  // Get disabled reason
  const getDisabledReason = (tool: ToolDefinition): string | undefined => {
    if (tool.metadata.requiresDecisionLink && !currentDecision) {
      return 'Requires a decision-linked chat'
    }
    return undefined
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [highlightedIndex])

  const categories: ToolCategory[] = ['pattern', 'risk', 'framework']

  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-[400px] overflow-y-auto">
      {categories.map((category) => {
        const categoryTools = toolsByCategory[category] || []
        if (categoryTools.length === 0) return null

        return (
          <div key={category}>
            {/* Category header */}
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
              {CATEGORY_LABELS[category]}
            </div>

            {/* Tool items */}
            {categoryTools.map((tool) => {
              const globalIndex = flattenedTools.indexOf(tool)
              const isHighlighted = globalIndex === highlightedIndex
              const IconComponent = ICON_MAP[tool.icon] || Compass
              const shortcut = getShortcutForTool(tool.id)
              const disabled = isToolDisabled(tool)
              const disabledReason = getDisabledReason(tool)

              return (
                <button
                  key={tool.id}
                  ref={(el) => {
                    itemRefs.current[globalIndex] = el
                  }}
                  onClick={() => !disabled && onToolSelect(tool)}
                  disabled={disabled}
                  title={disabled ? disabledReason : tool.description}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted cursor-pointer'
                  } ${isHighlighted && !disabled ? 'bg-muted' : ''}`}
                >
                  <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {tool.name}
                      </span>
                      {shortcut && (
                        <span className="text-xs text-muted-foreground font-mono">
                          /{shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {tool.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )
      })}

      {flattenedTools.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No tools found for "{filterQuery}"
        </div>
      )}
    </div>
  )
}
