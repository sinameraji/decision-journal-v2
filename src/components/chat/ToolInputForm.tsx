/**
 * Tool Input Form Component
 *
 * Reusable form component for tool inputs. Extracted from ToolInputModal
 * for use in inline contexts (e.g., within ToolPalette).
 */

import { ChevronLeft, Loader2 } from 'lucide-react';
import type { ToolDefinition, ToolInputField } from '../../services/tools/tool-types';

interface ToolInputFormProps {
  tool: ToolDefinition;
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  isExecuting?: boolean;
  onFieldChange: (fieldName: string, value: unknown) => void;
  onSubmit: () => void;
  onBack?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
}

const renderField = (
  field: ToolInputField,
  formData: Record<string, unknown>,
  errors: Record<string, string>,
  isExecuting: boolean,
  onFieldChange: (name: string, value: unknown) => void
) => {
  const value = formData[field.name];
  const error = errors[field.name];

  switch (field.type) {
    case 'text':
      return (
        <div key={field.name} className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-colors ${
              error ? 'border-destructive' : 'border-border'
            } bg-card text-foreground placeholder:text-muted-foreground`}
            disabled={isExecuting}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'number':
      return (
        <div key={field.name} className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onFieldChange(field.name, parseFloat(e.target.value))}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
              error ? 'border-destructive' : 'border-border'
            } bg-card text-foreground placeholder:text-muted-foreground`}
            disabled={isExecuting}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div key={field.name} className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
              error ? 'border-destructive' : 'border-border'
            } bg-card text-foreground`}
            disabled={isExecuting}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    default:
      return null;
  }
};

export function ToolInputForm({
  tool,
  formData,
  errors,
  isExecuting = false,
  onFieldChange,
  onSubmit,
  onBack,
  showHeader = true,
  showFooter = true,
}: ToolInputFormProps) {
  const customFields =
    tool.inputSchema.type === 'custom-query' ? tool.inputSchema.customFields || [] : [];
  const hasCustomFields = customFields.length > 0;

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {onBack && (
            <button
              onClick={onBack}
              disabled={isExecuting}
              className="p-1 hover:bg-muted/70 rounded transition-colors disabled:opacity-50"
              title="Back to tools"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          )}
          <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">{tool.description}</p>

        {hasCustomFields ? (
          <div className="space-y-4">
            {customFields.map((field) =>
              renderField(field, formData, errors, isExecuting, onFieldChange)
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            This tool will analyze your current decision context. No additional input required.
          </div>
        )}
      </div>

      {showFooter && (
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border">
          {onBack && (
            <button
              onClick={onBack}
              disabled={isExecuting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onSubmit}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Analysis'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
