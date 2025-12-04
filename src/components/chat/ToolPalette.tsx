/**
 * Tool Palette Component
 *
 * Displays available coaching tools in a collapsible sidebar with category tabs.
 * User can select a tool to trigger execution via modal.
 */

import { useState } from 'react';
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
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { ToolDefinition, ToolCategory } from '../../services/tools/tool-types';

interface ToolPaletteProps {
  tools: ToolDefinition[];
  onToolSelect: (tool: ToolDefinition) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
};

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  pattern: 'Patterns',
  risk: 'Risk',
  framework: 'Frameworks',
};

export function ToolPalette({
  tools,
  onToolSelect,
  isCollapsed = false,
  onToggleCollapse,
}: ToolPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('pattern');

  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, ToolDefinition[]>);

  const categories: ToolCategory[] = ['pattern', 'risk', 'framework'];
  const activeCategoryTools = toolsByCategory[activeCategory] || [];

  if (isCollapsed) {
    return (
      <div className="relative">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Show coaching tools"
        >
          <Compass className="w-4 h-4" />
          <span>Tools</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Coaching Tools
          </h3>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
            title="Hide tools"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {categories.map((category) => {
          const count = toolsByCategory[category]?.length || 0;
          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {CATEGORY_LABELS[category]} ({count})
            </button>
          );
        })}
      </div>

      {/* Tool Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
        {activeCategoryTools.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            No tools in this category yet.
          </div>
        ) : (
          activeCategoryTools.map((tool) => {
            const IconComponent = ICON_MAP[tool.icon] || Compass;

            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool)}
                className="flex flex-col items-start gap-2 p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center gap-2 w-full">
                  <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {tool.name}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {tool.description}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
