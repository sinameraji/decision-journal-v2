/**
 * Pre-Mortem Facilitator Tool
 *
 * Uses the Gary Klein pre-mortem framework: imagine the decision
 * failed completely, then work backwards to identify causes.
 *
 * This is a pure prompt-based tool that uses Chain-of-Thought
 * reasoning to generate failure scenarios.
 */

import type { ToolDefinition, ToolExecutionContext, ToolResult } from '../tool-types';
import { ollamaService } from '../../llm/ollama-service';

/**
 * Pre-Mortem Facilitator Tool Definition
 */
export const preMortemTool: ToolDefinition = {
  id: 'pre-mortem',
  name: 'Pre-Mortem Facilitator',
  description:
    'Imagine this decision failed completely. What went wrong? (Gary Klein framework)',
  category: 'risk',
  icon: 'AlertTriangle',
  version: '1.0.0',

  inputSchema: {
    type: 'current-decision',
    customFields: [
      {
        name: 'alternativeIndex',
        type: 'number',
        label: 'Which alternative do you want to pre-mortem? (1, 2, 3...)',
        placeholder: '1',
        required: false,
        validation: {
          min: 1,
          max: 10,
        },
      },
    ],
  },

  outputSchema: {
    format: 'hybrid',
    schema: {
      alternative: 'string',
      failureScenarios: 'array',
      mitigations: 'array',
    },
  },

  async execute(context: ToolExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      if (!context.currentDecision) {
        return {
          success: false,
          error:
            'Pre-Mortem requires a decision-linked chat. Open a decision and try again.',
          executionTimeMs: Date.now() - startTime,
        };
      }

      const decision = context.currentDecision;

      // Determine which alternative to analyze
      let alternative: any;
      const altIndex = context.userInput?.alternativeIndex as number | undefined;

      if (altIndex && decision.alternatives && decision.alternatives[altIndex - 1]) {
        alternative = decision.alternatives[altIndex - 1];
      } else if (
        decision.selected_alternative_id &&
        decision.alternatives
      ) {
        // Use selected alternative
        alternative = decision.alternatives.find(
          (a) => a.id === decision.selected_alternative_id
        );
      } else if (decision.alternatives && decision.alternatives.length > 0) {
        // Default to first alternative
        alternative = decision.alternatives[0];
      }

      if (!alternative) {
        return {
          success: false,
          error:
            'No alternatives found for this decision. Add alternatives first.',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Build pre-mortem prompt
      const preMortemPrompt = buildPreMortemPrompt(decision, alternative);

      // Call LLM for analysis
      const isRunning = await ollamaService.isRunning();
      if (!isRunning) {
        return {
          success: false,
          error:
            'Ollama is not running. Start Ollama and try again.',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Call Ollama chat (will use default model)
      const response = await ollamaService.chat([
        {
          role: 'user',
          content: preMortemPrompt,
        },
      ]);

      // Parse response (response is a string)
      const markdown = formatPreMortemResult({
        alternative: alternative.title || alternative.description || 'Selected option',
        decision: decision.problem_statement || 'Your decision',
        analysis: response,
      });

      return {
        success: true,
        data: {
          alternative: alternative.title || alternative.description,
          preMortemAnalysis: response,
        },
        markdown,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          decisionsAnalyzed: 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Pre-Mortem failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },

  systemPrompt: `You are interpreting a Pre-Mortem analysis. The tool has generated failure scenarios for the user's decision.

Your role:
1. Highlight the ONE most concerning failure scenario
2. Ask if that risk feels real to them
3. Keep it brief (2-3 sentences)

DO NOT:
- List all the scenarios
- Repeat the pre-mortem output
- Give solutions (that comes later)`,

  userPromptTemplate: `I ran the Pre-Mortem tool on "{{alternative}}". Here's what could go wrong:

{{markdown}}

Which of these failure scenarios concerns you most?`,

  metadata: {
    requiresDecisionLink: true,
    requiresReviewedDecisions: false,
    estimatedExecutionTimeMs: 3000,
    tags: ['risk', 'failure', 'planning', 'Gary Klein'],
  },
};

/**
 * Build the pre-mortem prompt for LLM.
 */
function buildPreMortemPrompt(decision: any, alternative: any): string {
  const parts: string[] = [];

  parts.push('# PRE-MORTEM EXERCISE\n');
  parts.push(
    'You are facilitating a pre-mortem analysis using the Gary Klein framework.\n'
  );

  parts.push('\n## THE DECISION\n');
  parts.push(`**Problem:** ${decision.problem_statement}\n`);
  if (decision.situation) {
    const situationPreview =
      decision.situation.length > 500
        ? decision.situation.substring(0, 500) + '...'
        : decision.situation;
    parts.push(`**Context:** ${situationPreview}\n`);
  }

  parts.push('\n## THE CHOICE\n');
  parts.push(`**Option being analyzed:** ${alternative.title || alternative.description}\n`);
  if (alternative.pros && alternative.pros.length > 0) {
    parts.push(`**Pros:** ${alternative.pros.join(', ')}\n`);
  }
  if (alternative.cons && alternative.cons.length > 0) {
    parts.push(`**Cons:** ${alternative.cons.join(', ')}\n`);
  }

  parts.push('\n## YOUR TASK\n');
  parts.push(
    'Imagine it is 6-12 months in the future. The decision has been implemented and **failed completely**.\n'
  );
  parts.push('\nWorking backwards from this failure, generate:\n');
  parts.push('1. **5-7 specific failure scenarios** - What went wrong?\n');
  parts.push(
    '   - Be concrete and specific (not "bad timing" but "launched during Q4 freeze")\n'
  );
  parts.push('   - Consider internal factors (our mistakes)\n');
  parts.push('   - Consider external factors (market, competition)\n');
  parts.push('   - Consider unknown unknowns (what we didn\'t see coming)\n');
  parts.push('\n2. **For each scenario, estimate likelihood:**\n');
  parts.push('   - High, Medium, or Low\n');
  parts.push('\n3. **Suggest 1-2 early warning signs** for the most likely failures\n');

  parts.push('\n## OUTPUT FORMAT\n');
  parts.push('```\n');
  parts.push('## Failure Scenario 1: [Title]\n');
  parts.push('**Likelihood:** [High/Medium/Low]\n');
  parts.push('**What happened:** [2-3 sentences]\n');
  parts.push('**Why it happened:** [root cause]\n');
  parts.push('**Early warning sign:** [how to detect this early]\n');
  parts.push('\n[Repeat for 5-7 scenarios]\n');
  parts.push('```\n');

  parts.push('\nBe pessimistic but realistic. Focus on plausible failures, not catastrophic edge cases.');

  return parts.join('');
}

/**
 * Format pre-mortem results as markdown.
 */
function formatPreMortemResult(data: {
  alternative: string;
  decision: string;
  analysis: string;
}): string {
  const parts: string[] = [];

  parts.push('## Pre-Mortem Analysis\n');
  parts.push(`**Decision:** ${data.decision}\n`);
  parts.push(`**Option analyzed:** ${data.alternative}\n`);
  parts.push('\n---\n');
  parts.push('\n**Imagined outcome:** This decision failed completely.\n');
  parts.push('**Task:** Work backwards to identify what went wrong.\n');
  parts.push('\n---\n');
  parts.push('\n' + data.analysis);

  return parts.join('');
}
