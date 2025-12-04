/**
 * Tool Registry
 *
 * Central registry for all coaching tools. Provides registration,
 * discovery, and execution coordination.
 */

import type {
  ToolDefinition,
  ToolCategory,
  ToolExecutionContext,
  ToolResult,
} from './tool-types';

/**
 * Tool Registry Class
 *
 * Manages the collection of available coaching tools.
 */
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a tool in the registry.
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      console.warn(`Tool "${tool.id}" is already registered. Overwriting.`);
    }

    // Validate tool definition
    this.validateTool(tool);

    this.tools.set(tool.id, tool);
    console.log(`✓ Registered tool: ${tool.id} (${tool.name})`);
  }

  /**
   * Register multiple tools at once.
   */
  registerMany(tools: ToolDefinition[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  /**
   * Get a tool by ID.
   */
  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all registered tools.
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category.
   */
  listByCategory(category: ToolCategory): ToolDefinition[] {
    return this.list().filter((tool) => tool.category === category);
  }

  /**
   * Check if a tool is registered.
   */
  has(id: string): boolean {
    return this.tools.has(id);
  }

  /**
   * Unregister a tool.
   */
  unregister(id: string): boolean {
    return this.tools.delete(id);
  }

  /**
   * Execute a tool with the given context.
   *
   * This is a convenience wrapper that:
   * 1. Validates the tool exists
   * 2. Executes the tool
   * 3. Handles errors
   * 4. Returns the result
   */
  async execute(
    toolId: string,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const tool = this.get(toolId);

    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolId}" not found in registry`,
        executionTimeMs: 0,
      };
    }

    // Validate context
    const validationError = this.validateContext(tool, context);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        executionTimeMs: 0,
      };
    }

    try {
      const startTime = Date.now();
      const result = await tool.execute(context);
      const executionTimeMs = Date.now() - startTime;

      // Ensure executionTimeMs is set
      return {
        ...result,
        executionTimeMs: result.executionTimeMs || executionTimeMs,
      };
    } catch (error) {
      console.error(`Tool execution failed for "${toolId}":`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Get tool count.
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Get tools by tag.
   */
  findByTag(tag: string): ToolDefinition[] {
    return this.list().filter((tool) =>
      tool.metadata.tags.includes(tag.toLowerCase())
    );
  }

  /**
   * Search tools by name or description.
   */
  search(query: string): ToolDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(
      (tool) =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery) ||
        tool.metadata.tags.some((tag) => tag.includes(lowerQuery))
    );
  }

  /**
   * Validate tool definition.
   */
  private validateTool(tool: ToolDefinition): void {
    if (!tool.id || tool.id.trim() === '') {
      throw new Error('Tool ID is required');
    }

    if (!tool.name || tool.name.trim() === '') {
      throw new Error(`Tool "${tool.id}" must have a name`);
    }

    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new Error(`Tool "${tool.id}" must have an execute function`);
    }

    if (!tool.category) {
      throw new Error(`Tool "${tool.id}" must have a category`);
    }

    if (!['pattern', 'risk', 'framework'].includes(tool.category)) {
      throw new Error(
        `Tool "${tool.id}" has invalid category: ${tool.category}`
      );
    }
  }

  /**
   * Validate execution context for a tool.
   */
  private validateContext(
    tool: ToolDefinition,
    context: ToolExecutionContext
  ): string | null {
    // Check if tool requires decision link
    if (tool.metadata.requiresDecisionLink && !context.currentDecision) {
      return `Tool "${tool.id}" requires a decision-linked chat session`;
    }

    // Check if tool requires reviewed decisions
    if (tool.metadata.requiresReviewedDecisions) {
      const hasReviewedDecisions = context.allDecisions.some(
        (d) => d.actual_outcome
      );
      if (!hasReviewedDecisions) {
        return `Tool "${tool.id}" requires at least one reviewed decision (with outcome)`;
      }
    }

    // Check if required custom fields are provided
    if (tool.inputSchema.customFields) {
      for (const field of tool.inputSchema.customFields) {
        if (field.required && !context.userInput?.[field.name]) {
          return `Required field "${field.label}" is missing`;
        }
      }
    }

    return null;
  }

  /**
   * Clear all registered tools (useful for testing).
   */
  clear(): void {
    this.tools.clear();
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();

// Export class for testing
export { ToolRegistry };
