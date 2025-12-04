/**
 * Base Tool
 *
 * Abstract base class for coaching tools. Provides common
 * functionality like validation, timing, and error handling.
 */

import type {
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
  ToolValidationError,
} from './tool-types';

/**
 * Abstract base class for tools.
 *
 * Extend this class to create new tools with built-in validation
 * and error handling.
 */
export abstract class BaseTool {
  abstract definition: ToolDefinition;

  /**
   * Execute the tool with automatic timing and error handling.
   */
  async execute(context: ToolExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Validate input
      const validationErrors = this.validateInput(context);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: this.formatValidationErrors(validationErrors),
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Execute tool-specific logic
      const result = await this.executeInternal(context);

      // Ensure timing is set
      return {
        ...result,
        executionTimeMs: result.executionTimeMs || Date.now() - startTime,
      };
    } catch (error) {
      console.error(`Tool execution error (${this.definition.id}):`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Tool-specific execution logic.
   * Override this in subclasses.
   */
  protected abstract executeInternal(
    context: ToolExecutionContext
  ): Promise<ToolResult>;

  /**
   * Validate tool input.
   * Override to add custom validation.
   */
  protected validateInput(
    context: ToolExecutionContext
  ): ToolValidationError[] {
    const errors: ToolValidationError[] = [];

    // Validate required fields from input schema
    if (this.definition.inputSchema.customFields) {
      for (const field of this.definition.inputSchema.customFields) {
        if (field.required && !context.userInput?.[field.name]) {
          errors.push({
            field: field.name,
            message: `${field.label} is required`,
          });
        }

        // Type-specific validation
        if (context.userInput?.[field.name]) {
          const value = context.userInput[field.name];

          if (field.type === 'number') {
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push({
                field: field.name,
                message: `${field.label} must be a valid number`,
              });
            } else {
              // Range validation
              if (
                field.validation?.min !== undefined &&
                value < field.validation.min
              ) {
                errors.push({
                  field: field.name,
                  message: `${field.label} must be at least ${field.validation.min}`,
                });
              }
              if (
                field.validation?.max !== undefined &&
                value > field.validation.max
              ) {
                errors.push({
                  field: field.name,
                  message: `${field.label} must be at most ${field.validation.max}`,
                });
              }
            }
          }

          if (field.type === 'text') {
            const strValue = String(value);

            // Length validation
            if (
              field.validation?.minLength !== undefined &&
              strValue.length < field.validation.minLength
            ) {
              errors.push({
                field: field.name,
                message: `${field.label} must be at least ${field.validation.minLength} characters`,
              });
            }
            if (
              field.validation?.maxLength !== undefined &&
              strValue.length > field.validation.maxLength
            ) {
              errors.push({
                field: field.name,
                message: `${field.label} must be at most ${field.validation.maxLength} characters`,
              });
            }

            // Pattern validation
            if (field.validation?.pattern) {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(strValue)) {
                errors.push({
                  field: field.name,
                  message: `${field.label} format is invalid`,
                });
              }
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Format validation errors into a single error message.
   */
  protected formatValidationErrors(errors: ToolValidationError[]): string {
    if (errors.length === 1) {
      return errors[0].message;
    }

    return `Validation errors:\n${errors.map((e) => `- ${e.message}`).join('\n')}`;
  }

  /**
   * Generate a unique ID.
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Truncate text to a maximum length.
   */
  protected truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format a date as a human-readable string.
   */
  protected formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Calculate days ago from timestamp.
   */
  protected daysAgo(timestamp: number): number {
    const now = Date.now();
    const diff = now - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
