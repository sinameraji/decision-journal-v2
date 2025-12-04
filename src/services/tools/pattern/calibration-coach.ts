/**
 * Calibration Coach Tool
 *
 * Analyzes confidence calibration by comparing predicted confidence
 * to actual outcomes. Computes Brier score and calibration curve.
 */

import type { ToolDefinition, ToolExecutionContext, ToolResult } from '../tool-types';
import * as analyticsService from '../../analytics/analytics-service';

/**
 * Calibration Coach Tool Definition
 */
export const calibrationCoachTool: ToolDefinition = {
  id: 'calibration-coach',
  name: 'Calibration Coach',
  description:
    'Check if your confidence levels match reality. Are you overconfident or underconfident?',
  category: 'pattern',
  icon: 'Target',
  version: '1.0.0',

  inputSchema: {
    type: 'decision-history',
    customFields: [],
  },

  outputSchema: {
    format: 'hybrid',
    schema: {
      brierScore: 'number',
      calibrationCurve: 'array',
      recommendations: 'array',
    },
  },

  async execute(context: ToolExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Filter to reviewed decisions only (need outcomes for calibration)
      const reviewedDecisions = context.allDecisions.filter(
        (d) =>
          d.actual_outcome &&
          d.outcome_rating !== null &&
          d.outcome_rating !== undefined &&
          d.confidence_level !== null &&
          d.confidence_level !== undefined
      );

      if (reviewedDecisions.length < 3) {
        return {
          success: true,
          markdown: `## Calibration Coach

Not enough data yet. You need at least 3 reviewed decisions with outcomes to analyze calibration.

**Current status:** ${reviewedDecisions.length}/3 reviewed decisions

**What to do:**
1. Review past decisions and add outcomes
2. Rate how well each decision turned out (1-10)
3. Come back when you have 3+ reviewed decisions`,
          executionTimeMs: Date.now() - startTime,
          metadata: {
            decisionsAnalyzed: reviewedDecisions.length,
          },
        };
      }

      // Calculate Brier score
      const brierScoreResult =
        analyticsService.calculateBrierScore(reviewedDecisions);

      // Calculate calibration curve
      const calibrationResult = analyticsService.calculateCalibration(
        reviewedDecisions
      );

      if (!calibrationResult) {
        return {
          success: false,
          error: 'Failed to calculate calibration data',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Analyze calibration and generate recommendations
      const analysis = analyzeCalibration(
        brierScoreResult.score,
        calibrationResult.buckets.map(bucket => ({
          confidence_bucket: `${bucket.confidence}%`,
          avg_confidence: bucket.confidence,
          actual_success_rate: bucket.actual,
          count: bucket.count,
        }))
      );

      // Build markdown output
      const markdown = formatCalibrationResult({
        brierScore: brierScoreResult.score,
        calibration: calibrationResult.buckets.map(bucket => ({
          confidence_bucket: `${bucket.confidence}%`,
          avg_confidence: bucket.confidence,
          actual_success_rate: bucket.actual,
          count: bucket.count,
        })),
        analysis,
        totalDecisions: reviewedDecisions.length,
      });

      return {
        success: true,
        data: {
          brierScore: brierScoreResult.score,
          calibrationCurve: calibrationResult.buckets,
          analysis,
          totalDecisions: reviewedDecisions.length,
        },
        markdown,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          decisionsAnalyzed: reviewedDecisions.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Calibration Coach failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },

  systemPrompt: `You are interpreting a Calibration Coach analysis. The tool has calculated the user's confidence calibration.

Your role:
1. Identify the MAIN calibration issue (overconfidence, underconfidence, or well-calibrated)
2. Ask ONE question to help them improve calibration
3. Keep it brief (2-3 sentences)

DO NOT:
- Explain what Brier scores mean
- List all the recommendations
- Repeat the data from the output`,

  userPromptTemplate: `I ran the Calibration Coach tool. Here are my calibration results:

{{markdown}}

What's the main thing I should focus on to improve my calibration?`,

  metadata: {
    requiresDecisionLink: false,
    requiresReviewedDecisions: true,
    estimatedExecutionTimeMs: 500,
    tags: ['calibration', 'confidence', 'accuracy', 'learning'],
  },
};

/**
 * Analyze calibration and generate insights.
 */
function analyzeCalibration(
  brierScore: number,
  calibration: Array<{
    confidence_bucket: string;
    avg_confidence: number;
    actual_success_rate: number;
    count: number;
  }>
): {
  interpretation: string;
  mainIssue: 'overconfident' | 'underconfident' | 'well-calibrated' | 'mixed';
  recommendations: string[];
  calibrationGaps: Array<{ bucket: string; gap: number }>;
} {
  const recommendations: string[] = [];
  const calibrationGaps: Array<{ bucket: string; gap: number }> = [];

  // Interpret Brier score
  let interpretation = '';
  if (brierScore < 0.15) {
    interpretation = 'Excellent calibration';
  } else if (brierScore < 0.25) {
    interpretation = 'Good calibration';
  } else if (brierScore < 0.35) {
    interpretation = 'Fair calibration - room for improvement';
  } else {
    interpretation = 'Poor calibration - significant mismatch';
  }

  // Analyze calibration curve
  let overconfidentCount = 0;
  let underconfidentCount = 0;
  let totalGap = 0;

  calibration.forEach((bucket) => {
    const gap =
      bucket.avg_confidence / 10 - bucket.actual_success_rate / 10;
    calibrationGaps.push({
      bucket: bucket.confidence_bucket,
      gap: gap * 10, // Scale back to 0-10 range
    });

    if (Math.abs(gap) > 0.15) {
      // Significant gap (>15%)
      if (gap > 0) {
        overconfidentCount++;
      } else {
        underconfidentCount++;
      }
      totalGap += Math.abs(gap);
    }
  });

  // Determine main issue
  let mainIssue: 'overconfident' | 'underconfident' | 'well-calibrated' | 'mixed' =
    'well-calibrated';
  if (overconfidentCount > underconfidentCount && overconfidentCount >= 2) {
    mainIssue = 'overconfident';
  } else if (
    underconfidentCount > overconfidentCount &&
    underconfidentCount >= 2
  ) {
    mainIssue = 'underconfident';
  } else if (
    overconfidentCount > 0 &&
    underconfidentCount > 0 &&
    totalGap / calibration.length > 0.15
  ) {
    mainIssue = 'mixed';
  }

  // Generate recommendations
  if (mainIssue === 'overconfident') {
    recommendations.push(
      'Consider what could go wrong before committing to high confidence'
    );
    recommendations.push(
      'Look for disconfirming evidence, not just supporting facts'
    );
    recommendations.push('When 80%+ confident, list 3 ways you could be wrong');
  } else if (mainIssue === 'underconfident') {
    recommendations.push('Trust your judgment more - outcomes are better than expected');
    recommendations.push(
      'Track wins to build confidence in areas where you succeed'
    );
    recommendations.push('When uncertain, consider your past success rate');
  } else if (mainIssue === 'mixed') {
    recommendations.push(
      'Calibration varies by confidence level - pay attention to patterns'
    );
    recommendations.push(
      'Note which types of decisions you over/underestimate'
    );
  } else {
    recommendations.push(
      'Well-calibrated! Keep logging outcomes to maintain accuracy'
    );
    recommendations.push(
      'Your confidence predictions match reality consistently'
    );
  }

  return {
    interpretation,
    mainIssue,
    recommendations,
    calibrationGaps,
  };
}

/**
 * Format calibration results as markdown.
 */
function formatCalibrationResult(data: {
  brierScore: number;
  calibration: Array<{
    confidence_bucket: string;
    avg_confidence: number;
    actual_success_rate: number;
    count: number;
  }>;
  analysis: ReturnType<typeof analyzeCalibration>;
  totalDecisions: number;
}): string {
  const parts: string[] = [];

  parts.push('## Calibration Coach Results\n');
  parts.push(`**Decisions analyzed:** ${data.totalDecisions}\n`);

  // Brier Score
  parts.push('\n### Brier Score\n');
  parts.push(
    `**Score:** ${data.brierScore.toFixed(3)} (${data.analysis.interpretation})\n`
  );
  parts.push(
    `- Range: 0 (perfect) to 1 (terrible)\n- <0.20 = Good calibration\n- >0.30 = Needs improvement\n`
  );

  // Main finding
  parts.push('\n### Main Finding\n');
  if (data.analysis.mainIssue === 'overconfident') {
    parts.push(
      '**You tend to be overconfident.** Your confidence predictions are higher than actual outcomes.\n'
    );
  } else if (data.analysis.mainIssue === 'underconfident') {
    parts.push(
      '**You tend to be underconfident.** Your outcomes are better than your confidence suggests.\n'
    );
  } else if (data.analysis.mainIssue === 'mixed') {
    parts.push(
      '**Mixed calibration.** Overconfident at some levels, underconfident at others.\n'
    );
  } else {
    parts.push(
      '**Well-calibrated!** Your confidence levels match outcomes consistently.\n'
    );
  }

  // Calibration curve
  parts.push('\n### Calibration Curve\n');
  parts.push('| Confidence Level | Actual Success Rate | Count | Gap |\n');
  parts.push('|-----------------|---------------------|-------|-----|\n');

  data.calibration.forEach((bucket, index) => {
    const gap = data.analysis.calibrationGaps[index];
    const gapStr =
      gap.gap > 0
        ? `+${gap.gap.toFixed(1)} (over)`
        : `${gap.gap.toFixed(1)} (under)`;
    parts.push(
      `| ${bucket.confidence_bucket} | ${bucket.actual_success_rate.toFixed(1)}% | ${bucket.count} | ${gapStr} |\n`
    );
  });

  // Recommendations
  parts.push('\n### Recommendations\n');
  data.analysis.recommendations.forEach((rec) => {
    parts.push(`- ${rec}`);
  });
  parts.push('');

  return parts.join('');
}
