/**
 * Tool Palette Component
 *
 * Displays available coaching tools in a collapsible sidebar with category tabs.
 * Handles tool selection, form display, and immediate execution for no-input tools.
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
  Loader2,
} from 'lucide-react';
import type { ToolDefinition, ToolCategory } from '../../services/tools/tool-types';
import { ToolInputForm } from './ToolInputForm';

interface ToolPaletteProps {
  tools: ToolDefinition[];
  onToolExecute: (tool: ToolDefinition, userInput: Record<string, unknown>) => Promise<void>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isExecuting?: boolean;
}

type ViewState = 'grid' | 'form' | 'loading';

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
  onToolExecute,
  isCollapsed = true,
  onToggleCollapse,
  isExecuting = false,
}: ToolPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('pattern');
  const [viewState, setViewState] = useState<ViewState>('grid');
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleToolSelect = async (tool: ToolDefinition) => {
    const customFields =
      tool.inputSchema.type === 'custom-query' ? tool.inputSchema.customFields || [] : [];

    if (customFields.length === 0) {
      // No custom fields - execute immediately
      setViewState('loading');
      setSelectedTool(tool);
      try {
        await onToolExecute(tool, {});
      } finally {
        setViewState('grid');
        setSelectedTool(null);
      }
    } else {
      // Has custom fields - show form
      setSelectedTool(tool);
      setFormData({});
      setErrors({});
      setViewState('form');
    }
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    if (!selectedTool) return false;

    const customFields =
      selectedTool.inputSchema.type === 'custom-query'
        ? selectedTool.inputSchema.customFields || []
        : [];
    const newErrors: Record<string, string> = {};

    customFields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && !value) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      if (value && field.validation) {
        const validation = field.validation;

        if (field.type === 'text' && typeof value === 'string') {
          if (validation.minLength && value.length < validation.minLength) {
            newErrors[field.name] = `Minimum length is ${validation.minLength}`;
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            newErrors[field.name] = `Maximum length is ${validation.maxLength}`;
          }
        }

        if (field.type === 'number' && typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            newErrors[field.name] = `Minimum value is ${validation.min}`;
          }
          if (validation.max !== undefined && value > validation.max) {
            newErrors[field.name] = `Maximum value is ${validation.max}`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedTool) return;

    setViewState('loading');
    try {
      await onToolExecute(selectedTool, formData);
      // Reset to grid view after successful execution
      setViewState('grid');
      setSelectedTool(null);
      setFormData({});
      setErrors({});
    } catch (error) {
      // Keep form visible on error, user can see error messages or try again
      setViewState('form');
    }
  };

  const handleCancel = () => {
    setViewState('grid');
    setSelectedTool(null);
    setFormData({});
    setErrors({});
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className="relative">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          title="Show coaching tools"
        >
          <Compass className="w-4 h-4" />
          <span>Tools</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="border-t border-border bg-muted">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Coaching Tools</h3>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-muted/70 rounded transition-colors"
            title="Hide tools"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Content */}
      {viewState === 'grid' && (
        <>
          {/* Category Tabs */}
          <div className="flex border-b border-border">
            {categories.map((category) => {
              const count = toolsByCategory[category]?.length || 0;
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary border-b-2 border-primary bg-card'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
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
              <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
                No tools in this category yet.
              </div>
            ) : (
              activeCategoryTools.map((tool) => {
                const IconComponent = ICON_MAP[tool.icon] || Compass;

                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool)}
                    className="flex flex-col items-start gap-2 p-3 text-left border border-border rounded-lg hover:border-primary hover:bg-card transition-colors group"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {tool.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Form View */}
      {viewState === 'form' && selectedTool && (
        <ToolInputForm
          tool={selectedTool}
          formData={formData}
          errors={errors}
          isExecuting={isExecuting}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          onBack={handleCancel}
          showHeader={true}
          showFooter={true}
        />
      )}

      {/* Loading View */}
      {viewState === 'loading' && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              {selectedTool ? `Running ${selectedTool.name}...` : 'Executing tool...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
