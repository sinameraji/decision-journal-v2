/**
 * Tool System Type Definitions
 *
 * Types for the coaching tool framework: definitions, execution context,
 * input/output schemas, and results.
 */

import type { Decision } from '../../types/decision';
import type { ChatMessage } from '../../types/chat';

/**
 * Tool categories for organization.
 */
export type ToolCategory = 'pattern' | 'risk' | 'framework';

/**
 * Input field types for tool forms.
 */
export type ToolInputFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean';

/**
 * Input field definition for tool forms.
 */
export interface ToolInputField {
  name: string; // Field identifier
  type: ToolInputFieldType;
  label: string; // Display label
  placeholder?: string;
  options?: Array<{ value: string; label: string }>; // For select/multiselect
  required: boolean;
  validation?: {
    min?: number; // For number type
    max?: number; // For number type
    pattern?: string; // Regex pattern for text
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Input schema defines what data the tool needs.
 */
export interface ToolInputSchema {
  type: 'current-decision' | 'decision-history' | 'custom-query' | 'none';
  customFields?: ToolInputField[];
}

/**
 * Output schema defines the tool's result format.
 */
export interface ToolOutputSchema {
  format: 'json' | 'markdown' | 'hybrid';
  schema?: Record<string, unknown>; // JSON schema for structured data
}

/**
 * Context provided to tool execution.
 */
export interface ToolExecutionContext {
  currentDecision?: Decision; // If chat is decision-linked
  allDecisions: Decision[]; // All user decisions
  userInput?: Record<string, unknown>; // Custom field values
  sessionId: string; // Current chat session
  userId?: string; // User identifier (future)
}

/**
 * Result returned by tool execution.
 */
export interface ToolResult {
  success: boolean;
  data?: unknown; // Structured data (JSON)
  markdown?: string; // Human-readable summary
  error?: string; // Error message if failed
  executionTimeMs: number;
  metadata?: {
    decisionsAnalyzed?: number;
    tokensUsed?: number;
    ragResultsUsed?: number;
    [key: string]: unknown;
  };
}

/**
 * Tool definition - the complete specification of a coaching tool.
 */
export interface ToolDefinition {
  id: string; // Unique identifier (e.g., "pattern-detective")
  name: string; // Display name
  description: string; // User-facing description
  category: ToolCategory;
  icon: string; // Lucide icon name
  version: string; // Semantic versioning

  inputSchema: ToolInputSchema;
  outputSchema: ToolOutputSchema;

  // Execution handler
  execute: (context: ToolExecutionContext) => Promise<ToolResult>;

  // Prompts for LLM interpretation
  systemPrompt: string; // Added to system prompt when tool is used
  userPromptTemplate: string; // Template for user message (supports {{variables}})

  // Metadata
  metadata: {
    requiresDecisionLink: boolean; // Must be in decision-linked chat
    requiresReviewedDecisions: boolean; // Needs decisions with outcomes
    estimatedExecutionTimeMs: number; // Expected runtime
    tags: string[]; // Searchable tags
    recommendedFollowUps?: string[]; // IDs of tools to suggest next (Phase 4)
  };
}

/**
 * Tool execution record (stored in database).
 */
export interface ToolExecution {
  id: string;
  sessionId: string;
  toolId: string;
  toolName: string;
  inputs: Record<string, unknown>; // JSON serialized inputs
  outputs: ToolResult; // JSON serialized outputs
  success: boolean;
  errorMessage?: string;
  createdAt: number; // Unix timestamp
}

/**
 * Extended message type for tool results.
 */
export interface ToolMessage extends ChatMessage {
  role: 'tool';
  toolExecution: {
    toolId: string;
    toolName: string;
    result: ToolResult;
  };
}

/**
 * Tool validation error.
 */
export interface ToolValidationError {
  field: string;
  message: string;
}
