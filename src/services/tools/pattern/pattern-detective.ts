/**
 * Pattern Detective Tool
 *
 * Finds similar past decisions and identifies recurring patterns
 * in tags, emotions, and outcomes.
 */

import type { ToolDefinition, ToolExecutionContext, ToolResult } from '../tool-types';
import { vectorSearchService } from '../../rag/vector-search-service';
import * as analyticsService from '../../analytics/analytics-service';

/**
 * Pattern Detective Tool Definition
 */
export const patternDetectiveTool: ToolDefinition = {
  id: 'pattern-detective',
  name: 'Pattern Detective',
  description:
    'Find similar past decisions and identify recurring patterns in your decision-making history',
  category: 'pattern',
  icon: 'Fingerprint',
  version: '1.0.0',

  inputSchema: {
    type: 'custom-query',
    customFields: [
      {
        name: 'query',
        type: 'text',
        label: 'What patterns are you looking for?',
        placeholder:
          'e.g., "career decisions", "times I felt anxious", "high-confidence choices"',
        required: true,
        validation: {
          minLength: 3,
          maxLength: 500,
        },
      },
      {
        name: 'limit',
        type: 'number',
        label: 'How many similar decisions to analyze?',
        required: false,
        validation: {
          min: 3,
          max: 20,
        },
      },
    ],
  },

  outputSchema: {
    format: 'hybrid',
    schema: {
      query: 'string',
      similarDecisions: 'array',
      patterns: 'object',
      insights: 'array',
    },
  },

  async execute(context: ToolExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Get query and limit from user input or defaults
      const query =
        (context.userInput?.query as string) ||
        context.currentDecision?.problem_statement ||
        'recent decisions';
      const limit = (context.userInput?.limit as number) || 5;

      // Search for similar decisions
      const searchResults = await vectorSearchService.searchSimilarDecisions(
        query,
        limit,
        {
          similarityThreshold: 0.5, // Lower threshold to get more results
          filters: {
            isArchived: false,
          },
        }
      );

      if (searchResults.length === 0) {
        return {
          success: true,
          markdown: `## Pattern Detective

No similar decisions found for "${query}".

Try:
- Using different keywords
- Being more general (e.g., "work" instead of "specific project name")
- Checking if you have enough decisions logged (at least 3-5 recommended)`,
          executionTimeMs: Date.now() - startTime,
          metadata: {
            decisionsAnalyzed: 0,
          },
        };
      }

      // Load full decision objects
      const similarDecisions = searchResults
        .map((result) => {
          const decision = context.allDecisions.find(
            (d) => d.id === result.decisionId
          );
          return decision
            ? {
                decision,
                similarity: result.similarity,
                score: result.score,
              }
            : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Analyze patterns
      const decisions = similarDecisions.map((item) => item.decision);

      // Tag patterns
      const tagPatterns = analyticsService.calculateTagPatterns(decisions);

      // Emotional patterns
      const emotionalPatterns =
        analyticsService.calculateEmotionalPatterns(decisions);

      // Confidence analysis
      const confidenceLevels = decisions
        .map((d) => d.confidence_level)
        .filter((c): c is number => c !== null && c !== undefined);
      const avgConfidence =
        confidenceLevels.length > 0
          ? confidenceLevels.reduce((a, b) => a + b, 0) / confidenceLevels.length
          : null;

      // Outcome analysis (for reviewed decisions)
      const reviewedDecisions = decisions.filter((d) => d.actual_outcome);
      const outcomeRatings = reviewedDecisions
        .map((d) => d.outcome_rating)
        .filter((r): r is number => r !== null && r !== undefined);
      const avgOutcome =
        outcomeRatings.length > 0
          ? outcomeRatings.reduce((a, b) => a + b, 0) / outcomeRatings.length
          : null;

      // Generate insights
      const insights: string[] = [];

      if (avgConfidence !== null) {
        if (avgConfidence >= 7.5) {
          insights.push(
            `You tend to be highly confident in these decisions (avg ${avgConfidence.toFixed(1)}/10)`
          );
        } else if (avgConfidence <= 5) {
          insights.push(
            `These decisions show lower confidence (avg ${avgConfidence.toFixed(1)}/10)`
          );
        }
      }

      if (avgOutcome !== null && avgConfidence !== null) {
        const calibrationGap = Math.abs((avgConfidence - avgOutcome) * 10) / 10;
        if (calibrationGap > 2) {
          insights.push(
            `Confidence-outcome gap: ${calibrationGap.toFixed(1)} points (possible over/underconfidence)`
          );
        }
      }

      if (tagPatterns.length > 0) {
        const topTag = tagPatterns[0];
        insights.push(
          `Most common category: "${topTag.tag}" (${topTag.count} decisions)`
        );
      }

      if (emotionalPatterns.length > 0) {
        const topEmotion = emotionalPatterns[0];
        insights.push(
          `Most common emotion: "${topEmotion.emotion}" (${topEmotion.count} times)`
        );
      }

      // Build markdown output
      const markdown = formatPatternDetectiveResult({
        query,
        similarDecisions,
        tagPatterns: tagPatterns.slice(0, 5),
        emotionalPatterns: emotionalPatterns.slice(0, 5),
        avgConfidence,
        avgOutcome,
        insights,
        reviewedCount: reviewedDecisions.length,
      });

      return {
        success: true,
        data: {
          query,
          similarDecisions: similarDecisions.map((item) => ({
            id: item.decision.id,
            problemStatement: item.decision.problem_statement,
            similarity: item.similarity,
            confidence: item.decision.confidence_level,
            outcome: item.decision.actual_outcome,
            outcomeRating: item.decision.outcome_rating,
            tags: item.decision.tags,
            emotionalFlags: item.decision.emotional_flags,
          })),
          patterns: {
            tags: tagPatterns,
            emotions: emotionalPatterns,
          },
          statistics: {
            avgConfidence,
            avgOutcome,
            reviewedCount: reviewedDecisions.length,
            totalAnalyzed: decisions.length,
          },
          insights,
        },
        markdown,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          decisionsAnalyzed: decisions.length,
          ragResultsUsed: searchResults.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Pattern Detective failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },

  systemPrompt: `You are interpreting a Pattern Detective analysis. The tool has identified similar past decisions and extracted patterns.

Your role:
1. Highlight the ONE most interesting pattern or insight
2. Ask a focused question about what that pattern reveals
3. Keep it brief (2-3 sentences max)

DO NOT:
- List all the data
- Repeat what's in the tool output
- Give generic advice`,

  userPromptTemplate: `I ran the Pattern Detective tool with the query: "{{query}}"

Here are the results:

{{markdown}}

What stands out to you about these patterns?`,

  metadata: {
    requiresDecisionLink: false,
    requiresReviewedDecisions: false,
    estimatedExecutionTimeMs: 1000,
    tags: ['patterns', 'analysis', 'history', 'learning'],
  },
};

/**
 * Format the Pattern Detective result as markdown.
 */
function formatPatternDetectiveResult(data: {
  query: string;
  similarDecisions: Array<{
    decision: any;
    similarity: number;
  }>;
  tagPatterns: Array<{ tag: string; count: number }>;
  emotionalPatterns: Array<{ emotion: string; count: number }>;
  avgConfidence: number | null;
  avgOutcome: number | null;
  insights: string[];
  reviewedCount: number;
}): string {
  const parts: string[] = [];

  parts.push('## Pattern Detective Results\n');
  parts.push(`**Query:** "${data.query}"\n`);
  parts.push(
    `**Analyzed:** ${data.similarDecisions.length} similar decisions\n`
  );

  // Key insights
  if (data.insights.length > 0) {
    parts.push('\n### Key Insights\n');
    data.insights.forEach((insight) => {
      parts.push(`- ${insight}`);
    });
    parts.push('');
  }

  // Similar decisions
  parts.push('\n### Similar Decisions\n');
  data.similarDecisions.slice(0, 5).forEach((item, index) => {
    const d = item.decision;
    parts.push(
      `${index + 1}. **${d.problem_statement || 'Untitled'}** (${Math.round(item.similarity * 100)}% match)`
    );
    if (d.actual_outcome) {
      parts.push(`   - Outcome: ${d.outcome_rating}/10`);
    } else {
      parts.push(`   - Confidence: ${d.confidence_level}/10`);
    }
    if (d.tags && d.tags.length > 0) {
      parts.push(`   - Tags: ${d.tags.slice(0, 3).join(', ')}`);
    }
    parts.push('');
  });

  // Tag patterns
  if (data.tagPatterns.length > 0) {
    parts.push('\n### Category Patterns\n');
    data.tagPatterns.forEach((pattern) => {
      parts.push(`- **${pattern.tag}**: ${pattern.count} decisions`);
    });
    parts.push('');
  }

  // Emotional patterns
  if (data.emotionalPatterns.length > 0) {
    parts.push('\n### Emotional Patterns\n');
    data.emotionalPatterns.forEach((pattern) => {
      parts.push(`- **${pattern.emotion}**: ${pattern.count} occurrences`);
    });
    parts.push('');
  }

  // Statistics
  parts.push('\n### Statistics\n');
  if (data.avgConfidence !== null) {
    parts.push(`- Average confidence: ${data.avgConfidence.toFixed(1)}/10`);
  }
  if (data.avgOutcome !== null) {
    parts.push(`- Average outcome: ${data.avgOutcome.toFixed(1)}/10`);
    parts.push(`- Reviewed decisions: ${data.reviewedCount}`);
  }

  return parts.join('\n');
}
