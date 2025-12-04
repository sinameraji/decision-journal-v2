/**
 * Tool Input Modal Component
 *
 * Renders a dynamic form based on a tool's inputSchema.
 * Handles validation and submission to trigger tool execution.
 */

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { ToolDefinition, ToolInputField } from '../../services/tools/tool-types';

interface ToolInputModalProps {
  tool: ToolDefinition;
  isOpen: boolean;
  isExecuting?: boolean;
  onClose: () => void;
  onSubmit: (userInput: Record<string, unknown>) => void;
}

export function ToolInputModal({
  tool,
  isOpen,
  isExecuting = false,
  onClose,
  onSubmit,
}: ToolInputModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const customFields =
    tool.inputSchema.type === 'custom-query' ? tool.inputSchema.customFields || [] : [];

  const hasCustomFields = customFields.length > 0;

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error when user types
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    customFields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && !value) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      if (value && field.validation) {
        const validation = field.validation;

        // Text validation
        if (field.type === 'text' && typeof value === 'string') {
          if (validation.minLength && value.length < validation.minLength) {
            newErrors[field.name] = `Minimum length is ${validation.minLength}`;
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            newErrors[field.name] = `Maximum length is ${validation.maxLength}`;
          }
        }

        // Number validation
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleExecuteWithoutInput = () => {
    onSubmit({});
  };

  const renderField = (field: ToolInputField) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                error
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              disabled={isExecuting}
            />
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={(value as number) || ''}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              disabled={isExecuting}
            />
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              disabled={isExecuting}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tool.name}
          </h2>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
        </div>

        {/* Form */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {hasCustomFields ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {customFields.map(renderField)}
            </form>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This tool will analyze your current decision context. No additional input
              required.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={hasCustomFields ? handleSubmit : handleExecuteWithoutInput}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}
