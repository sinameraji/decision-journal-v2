/**
 * Prompt Builder
 *
 * Assembles dynamic system prompts based on conversation context.
 */

import type { Decision } from '../../types/decision';
import type { ChatMessage } from '../../types/chat';
import {
  BASE_SYSTEM_PROMPT,
  DECISION_LINKED_SUFFIX,
  TOOL_ASSISTED_SUFFIX,
} from './base-prompt';
import { buildDecisionContextPrompt } from './decision-context-prompt';
import { buildMultiDecisionContextPrompt } from './multi-decision-context-prompt';
import { selectFewShotExamples, type FewShotExample } from './few-shot-examples';

/**
 * Conversation type determines which prompt components to use.
 */
export type ConversationType = 'decision-linked' | 'general' | 'tool-assisted';

/**
 * Context for building prompts.
 */
export interface PromptContext {
  conversationType: ConversationType;
  currentDecision?: Decision;  // Deprecated - use attachedDecisions
  attachedDecisions?: Decision[];
  toolId?: string;
  conversationHistory: ChatMessage[];
}

/**
 * Assembled prompt ready for LLM.
 */
export interface AssembledPrompt {
  systemPrompt: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  totalTokens: number; // Estimated
  truncated: boolean;
}

/**
 * Prompt Builder Class
 */
class PromptBuilder {
  /**
   * Build system prompt based on context.
   */
  buildSystemPrompt(context: PromptContext): string {
    const parts: string[] = [];

    // Base prompt (always included)
    parts.push(BASE_SYSTEM_PROMPT);

    // Decision-linked suffix with multi-decision support
    if (context.conversationType === 'decision-linked') {
      parts.push(DECISION_LINKED_SUFFIX);

      // Multi-decision context (NEW)
      if (context.attachedDecisions && context.attachedDecisions.length > 0) {
        parts.push('\n\n' + buildMultiDecisionContextPrompt(context.attachedDecisions));
      }
      // Backward compatibility: single decision
      else if (context.currentDecision) {
        parts.push('\n\n' + buildDecisionContextPrompt(context.currentDecision));
      }
    }

    // Tool-assisted suffix
    if (context.conversationType === 'tool-assisted') {
      parts.push(TOOL_ASSISTED_SUFFIX);
    }

    // Few-shot examples
    const examples = this.selectExamples(context);
    if (examples.length > 0) {
      parts.push('\n\n' + this.formatFewShotExamples(examples));
    }

    return parts.join('\n');
  }

  /**
   * Build complete prompt assembly.
   */
  buildPrompt(context: PromptContext): AssembledPrompt {
    const systemPrompt = this.buildSystemPrompt(context);

    // Convert conversation history to message format
    const messages: AssembledPrompt['messages'] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history
    for (const msg of context.conversationHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Estimate tokens (rough heuristic: 1 token ≈ 4 characters)
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const totalTokens = Math.ceil(totalChars / 4);

    return {
      systemPrompt,
      messages,
      totalTokens,
      truncated: false,
    };
  }

  /**
   * Select appropriate few-shot examples based on context.
   */
  private selectExamples(context: PromptContext): FewShotExample[] {
    if (context.toolId) {
      return selectFewShotExamples('tool-interpretation', 2);
    }

    if (context.conversationType === 'decision-linked') {
      return selectFewShotExamples('decision-linked', 2);
    }

    // Check conversation for pattern-related queries
    const lastUserMessage = context.conversationHistory
      .filter((m) => m.role === 'user')
      .slice(-1)[0];

    if (lastUserMessage) {
      const content = lastUserMessage.content.toLowerCase();
      if (
        content.includes('pattern') ||
        content.includes('similar') ||
        content.includes('past decision')
      ) {
        return selectFewShotExamples('pattern-recognition', 2);
      }
    }

    // Default: no examples (keep prompt lean)
    return [];
  }

  /**
   * Format few-shot examples for prompt injection.
   */
  private formatFewShotExamples(examples: FewShotExample[]): string {
    const parts: string[] = [];

    parts.push('='.repeat(60));
    parts.push('EXAMPLE CONVERSATIONS');
    parts.push('='.repeat(60));

    for (const example of examples) {
      parts.push(`\nUser: ${example.user}`);
      parts.push(`Assistant: ${example.assistant}`);
    }

    parts.push('='.repeat(60));

    return parts.join('\n');
  }
}

// Export singleton
export const promptBuilder = new PromptBuilder();

// Export class for testing
export { PromptBuilder };
