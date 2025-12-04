/**
 * Bias Detector Tool
 *
 * Identifies cognitive biases based on decision context,
 * mental/emotional state, and patterns. Uses few-shot
 * classification with bias taxonomy.
 */

import type { ToolDefinition, ToolExecutionContext, ToolResult } from '../tool-types';
import { ollamaService } from '../../llm/ollama-service';

// Common cognitive biases to check for
const BIAS_TAXONOMY = [
  {
    name: 'Confirmation Bias',
    description: 'Seeking information that confirms existing beliefs',
    indicators: ['only looking at pros', 'ignoring warnings', 'dismissing contrary evidence'],
  },
  {
    name: 'Sunk Cost Fallacy',
    description: 'Continuing because of past investment, not future value',
    indicators: ['already invested time/money', 'too late to stop', "can't waste what we've done"],
  },
  {
    name: 'Availability Heuristic',
    description: 'Overweighting recent or vivid examples',
    indicators: ['recent similar situation', 'just heard about', 'happened to someone I know'],
  },
  {
    name: 'Anchoring',
    description: 'Over-relying on first piece of information',
    indicators: ['first offer', 'initial estimate', 'original plan'],
  },
  {
    name: 'Overconfidence',
    description: 'Overestimating accuracy of predictions',
    indicators: ['very confident (8-10/10)', 'seems certain', 'no doubt'],
  },
  {
    name: 'Loss Aversion',
    description: 'Losses loom larger than equivalent gains',
    indicators: ['fear of losing', 'playing it safe', 'avoiding regret'],
  },
  {
    name: 'Status Quo Bias',
    description: 'Preferring current state over change',
    indicators: ['keep things as they are', 'too risky to change', 'working fine now'],
  },
  {
    name: 'FOMO (Fear of Missing Out)',
    description: 'Anxiety about missing opportunities',
    indicators: ['everyone else is doing it', 'limited time', 'might miss out'],
  },
];

/**
 * Bias Detector Tool Definition
 */
export const biasDetectorTool: ToolDefinition = {
  id: 'bias-detector',
  name: 'Bias Detector',
  description:
    'Identify cognitive biases that might be affecting your thinking (Kahneman/Tversky framework)',
  category: 'framework',
  icon: 'Eye',
  version: '1.0.0',

  inputSchema: {
    type: 'current-decision',
    customFields: [],
  },

  outputSchema: {
    format: 'hybrid',
    schema: {
      biases: 'array',
      evidence: 'object',
      debiasing: 'array',
    },
  },

  async execute(context: ToolExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      if (!context.currentDecision) {
        return {
          success: false,
          error:
            'Bias Detector requires a decision-linked chat. Open a decision and try again.',
          executionTimeMs: Date.now() - startTime,
        };
      }

      const decision = context.currentDecision;

      // Build bias detection prompt
      const biasPrompt = buildBiasDetectionPrompt(decision);

      // Call LLM for analysis
      const isRunning = await ollamaService.isRunning();
      if (!isRunning) {
        return {
          success: false,
          error: 'Ollama is not running. Start Ollama and try again.',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Call Ollama chat (will use default model)
      const response = await ollamaService.chat([
        {
          role: 'user',
          content: biasPrompt,
        },
      ]);

      // Format markdown output (response is a string)
      const markdown = formatBiasDetectorResult({
        decision: decision.problem_statement || 'Your decision',
        analysis: response,
        emotionalFlags: decision.emotional_flags || [],
        mentalState: decision.mental_state,
        confidenceLevel: decision.confidence_level,
      });

      return {
        success: true,
        data: {
          decision: decision.problem_statement,
          biasAnalysis: response,
          emotionalContext: {
            flags: decision.emotional_flags,
            mentalState: decision.mental_state,
            physicalState: decision.physical_state,
          },
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
        error: `Bias Detector failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },

  systemPrompt: `You are interpreting a Bias Detector analysis. The tool has identified potential cognitive biases.

Your role:
1. Name the ONE bias that seems most active
2. Ask if they can see evidence of that bias in their thinking
3. Keep it brief (2-3 sentences)

DO NOT:
- List all possible biases
- Explain what biases are
- Be judgmental (biases are normal!)`,

  userPromptTemplate: `I ran the Bias Detector on my decision. Here's what it found:

{{markdown}}

Do you see evidence of {{topBias}} in how I'm thinking about this?`,

  metadata: {
    requiresDecisionLink: true,
    requiresReviewedDecisions: false,
    estimatedExecutionTimeMs: 2500,
    tags: ['bias', 'cognitive', 'Kahneman', 'Tversky', 'psychology'],
  },
};

/**
 * Build bias detection prompt for LLM.
 */
function buildBiasDetectionPrompt(decision: any): string {
  const parts: string[] = [];

  parts.push('# BIAS DETECTION ANALYSIS\n');
  parts.push(
    'You are a cognitive psychology expert trained in identifying cognitive biases (Kahneman, Tversky, Ariely).\n'
  );

  parts.push('\n## THE DECISION\n');
  parts.push(`**Problem:** ${decision.problem_statement}\n`);

  if (decision.situation) {
    const situationPreview =
      decision.situation.length > 600
        ? decision.situation.substring(0, 600) + '...'
        : decision.situation;
    parts.push(`**Context:** ${situationPreview}\n`);
  }

  // Mental/emotional state
  if (decision.mental_state || decision.physical_state || decision.emotional_flags?.length > 0) {
    parts.push('\n## MENTAL & EMOTIONAL STATE\n');
    if (decision.mental_state) {
      parts.push(`**Mental state:** ${decision.mental_state}\n`);
    }
    if (decision.physical_state) {
      parts.push(`**Physical state:** ${decision.physical_state}\n`);
    }
    if (decision.emotional_flags && decision.emotional_flags.length > 0) {
      parts.push(`**Emotional flags:** ${decision.emotional_flags.join(', ')}\n`);
    }
  }

  // Confidence
  if (decision.confidence_level !== null && decision.confidence_level !== undefined) {
    parts.push(`**Confidence level:** ${decision.confidence_level}/10\n`);
  }

  // Alternatives
  if (decision.alternatives && decision.alternatives.length > 0) {
    parts.push('\n## ALTERNATIVES CONSIDERED\n');
    decision.alternatives.forEach((alt: any, i: number) => {
      parts.push(`${i + 1}. ${alt.title || alt.description}\n`);
      if (alt.pros?.length > 0) {
        parts.push(`   Pros: ${alt.pros.slice(0, 3).join(', ')}\n`);
      }
      if (alt.cons?.length > 0) {
        parts.push(`   Cons: ${alt.cons.slice(0, 3).join(', ')}\n`);
      }
    });
  }

  parts.push('\n## COMMON COGNITIVE BIASES TO CHECK\n');
  BIAS_TAXONOMY.forEach((bias) => {
    parts.push(`- **${bias.name}**: ${bias.description}\n`);
    parts.push(`  Indicators: ${bias.indicators.join('; ')}\n`);
  });

  parts.push('\n## YOUR TASK\n');
  parts.push('Analyze this decision for cognitive biases. For each bias you detect:\n');
  parts.push('1. **Name the bias**\n');
  parts.push('2. **Provide specific evidence** from the decision context\n');
  parts.push('3. **Rate likelihood** (High/Medium/Low)\n');
  parts.push('4. **Suggest one debiasing strategy**\n');

  parts.push('\n**Focus on the top 2-3 most likely biases.** Do not list every possible bias.\n');

  parts.push('\n## OUTPUT FORMAT\n');
  parts.push('```\n');
  parts.push('### Bias 1: [Name]\n');
  parts.push('**Likelihood:** [High/Medium/Low]\n');
  parts.push('**Evidence:** [What in the decision suggests this bias?]\n');
  parts.push('**Debiasing strategy:** [One concrete action to counter this bias]\n');
  parts.push('\n[Repeat for 2-3 biases max]\n');
  parts.push('```\n');

  parts.push('\nBe specific and evidence-based. Avoid generic advice.');

  return parts.join('');
}

/**
 * Format bias detection results as markdown.
 */
function formatBiasDetectorResult(data: {
  decision: string;
  analysis: string;
  emotionalFlags: string[];
  mentalState?: string;
  confidenceLevel?: number;
}): string {
  const parts: string[] = [];

  parts.push('## Bias Detector Analysis\n');
  parts.push(`**Decision:** ${data.decision}\n`);

  // Context
  if (data.emotionalFlags.length > 0 || data.mentalState) {
    parts.push('\n### Decision Context\n');
    if (data.mentalState) {
      parts.push(`- Mental state: ${data.mentalState}\n`);
    }
    if (data.emotionalFlags.length > 0) {
      parts.push(`- Emotions: ${data.emotionalFlags.join(', ')}\n`);
    }
    if (data.confidenceLevel !== undefined) {
      parts.push(`- Confidence: ${data.confidenceLevel}/10\n`);
    }
  }

  parts.push('\n---\n');
  parts.push('\n' + data.analysis);
  parts.push('\n---\n');
  parts.push('\n**Remember:** Cognitive biases are normal. Being aware of them is the first step to better decisions.\n');

  return parts.join('');
}
