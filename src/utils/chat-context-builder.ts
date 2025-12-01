import type { Decision } from '@/types/decision'
import type { EmotionalPattern, TagPattern } from '@/types/analytics'
import {
  calculateCalibration,
  calculateEmotionalPatterns,
  calculateTagPatterns,
} from '@/services/analytics/analytics-service'

/**
 * Build comprehensive context message for AI chat about a specific decision
 * Includes decision details, review data (if available), and analytics summary
 */
export function buildDecisionChatContext(
  decision: Decision,
  allDecisions: Decision[]
): string {
  const sections: string[] = []

  // System prompt
  sections.push(`# Decision Analysis Request

You are analyzing a decision from a user's decision journal. This journal follows the Farnam Street methodology for structured decision-making, helping users think clearly, identify biases, and learn from outcomes.

The user has shared this decision with you for discussion and analysis.`)

  // Decision details
  sections.push(formatDecisionDetails(decision))

  // Review data (if available)
  if (decision.actual_outcome !== null) {
    sections.push(formatReviewData(decision))
  }

  // Analytics summary
  sections.push(formatAnalyticsSummary(allDecisions))

  sections.push(`\nHey! I'd like to chat about this decision. Can you say hi and ask me ONE question to get started?`)

  return sections.join('\n\n---\n\n')
}

/**
 * Format decision details section
 */
function formatDecisionDetails(decision: Decision): string {
  const lines: string[] = []

  lines.push('## Decision Details')
  lines.push('')
  lines.push(`**Problem Statement:** ${decision.problem_statement}`)
  lines.push('')
  lines.push(`**Situation:**`)
  lines.push(decision.situation)

  // Variables
  if (decision.variables.length > 0) {
    lines.push('')
    lines.push('**Key Variables:**')
    decision.variables.forEach((variable) => {
      lines.push(`- ${variable}`)
    })
  }

  // Complications
  if (decision.complications.length > 0) {
    lines.push('')
    lines.push('**Complications:**')
    decision.complications.forEach((complication) => {
      lines.push(`- ${complication}`)
    })
  }

  // Alternatives
  lines.push('')
  lines.push(`**Alternatives Considered (${decision.alternatives.length} total):**`)
  lines.push('')

  decision.alternatives.forEach((alt, index) => {
    const isSelected = alt.id === decision.selected_alternative_id
    const prefix = isSelected ? '✓ **SELECTED**' : `${index + 1}.`

    lines.push(`${prefix} **${alt.title}**`)

    if (alt.description) {
      lines.push(`   ${alt.description}`)
    }

    if (alt.pros.length > 0) {
      lines.push(`   **Pros:**`)
      alt.pros.forEach((pro) => {
        lines.push(`   - ${pro}`)
      })
    }

    if (alt.cons.length > 0) {
      lines.push(`   **Cons:**`)
      alt.cons.forEach((con) => {
        lines.push(`   - ${con}`)
      })
    }

    if (alt.success_probability !== undefined) {
      lines.push(`   Success Probability: ${alt.success_probability}%`)
    }

    if (alt.estimated_effort || alt.estimated_cost || alt.reversibility) {
      const details = []
      if (alt.estimated_effort) details.push(`Effort: ${alt.estimated_effort}`)
      if (alt.estimated_cost) details.push(`Cost: ${alt.estimated_cost}`)
      if (alt.reversibility) details.push(`Reversibility: ${alt.reversibility}`)
      lines.push(`   ${details.join(' | ')}`)
    }

    lines.push('')
  })

  // Projections
  lines.push('**Outcome Projections:**')
  lines.push(`- **Expected Outcome:** ${decision.expected_outcome}`)
  lines.push(`- **Best Case Scenario:** ${decision.best_case_scenario}`)
  lines.push(`- **Worst Case Scenario:** ${decision.worst_case_scenario}`)
  lines.push(`- **Confidence Level:** ${decision.confidence_level}/10`)

  // Mental context
  lines.push('')
  lines.push('**Mental Context at Time of Decision:**')
  if (decision.mental_state) {
    lines.push(`- **Mental State:** ${decision.mental_state}`)
  }
  if (decision.physical_state) {
    lines.push(`- **Physical State:** ${decision.physical_state}`)
  }

  if (decision.emotional_flags.length > 0) {
    lines.push(`- **Emotional Flags:** ${decision.emotional_flags.join(', ')}`)
  }

  if (decision.time_of_day) {
    lines.push(`- **Time of Day:** ${decision.time_of_day}`)
  }

  // Tags
  if (decision.tags.length > 0) {
    lines.push(`- **Tags:** ${decision.tags.join(', ')}`)
  }

  return lines.join('\n')
}

/**
 * Format review data section
 */
function formatReviewData(decision: Decision): string {
  const lines: string[] = []

  lines.push('## Post-Decision Review (Actual Results)')
  lines.push('')
  lines.push('**What Actually Happened:**')
  lines.push(decision.actual_outcome || 'Not provided')
  lines.push('')
  lines.push(`**Outcome Rating:** ${decision.outcome_rating}/10`)

  // Calibration comparison
  if (decision.outcome_rating !== null) {
    const diff = decision.confidence_level - decision.outcome_rating
    const absDiff = Math.abs(diff)

    lines.push('')
    lines.push('**Calibration Analysis:**')
    if (absDiff <= 1) {
      lines.push(`- Excellent calibration! Confidence (${decision.confidence_level}/10) was very close to actual outcome (${decision.outcome_rating}/10).`)
    } else if (absDiff <= 3) {
      lines.push(`- Good calibration. Confidence (${decision.confidence_level}/10) was reasonably close to actual outcome (${decision.outcome_rating}/10).`)
    } else {
      if (diff > 0) {
        lines.push(`- Overconfident: Predicted ${decision.confidence_level}/10 but actual outcome was ${decision.outcome_rating}/10 (${absDiff} points lower).`)
      } else {
        lines.push(`- Underconfident: Predicted ${decision.confidence_level}/10 but actual outcome was ${decision.outcome_rating}/10 (${absDiff} points higher).`)
      }
    }
  }

  // Lessons learned
  if (decision.lessons_learned) {
    lines.push('')
    lines.push('**Lessons Learned:**')
    lines.push(decision.lessons_learned)
  }

  return lines.join('\n')
}

/**
 * Format analytics summary section
 */
function formatAnalyticsSummary(decisions: Decision[]): string {
  const lines: string[] = []

  lines.push('## Your Overall Decision-Making Analytics')
  lines.push('')

  // Handle first decision case
  if (decisions.length === 0 || decisions.length === 1) {
    lines.push('*This is your first decision! Analytics will become available as you track more decisions and review their outcomes.*')
    return lines.join('\n')
  }

  // Calculate overall stats manually
  const total = decisions.length
  const avgConfidence =
    decisions.reduce((sum, d) => sum + (d.confidence_level || 0), 0) / total
  const reviewed = decisions.filter((d) => d.actual_outcome !== null).length
  const reviewRate = (reviewed / total) * 100

  lines.push('**Overall Statistics:**')
  lines.push(`- Total Decisions: ${total}`)
  lines.push(`- Average Confidence: ${avgConfidence.toFixed(1)}/10`)
  lines.push(`- Decisions Reviewed: ${reviewed} (${Math.round(reviewRate)}%)`)

  if (reviewed > 0) {
    const avgOutcome =
      decisions
        .filter((d) => d.outcome_rating !== null)
        .reduce((sum, d) => sum + (d.outcome_rating || 0), 0) / reviewed
    lines.push(`- Average Outcome Rating: ${avgOutcome.toFixed(1)}/10`)
  }

  const avgAlternatives =
    decisions.reduce((sum, d) => sum + d.alternatives.length, 0) / total
  lines.push(`- Average Alternatives Considered: ${avgAlternatives.toFixed(1)}`)

  // Calibration analysis (only if there are reviewed decisions)
  if (reviewed >= 3) {
    lines.push('')
    lines.push('**Calibration Metrics:**')

    const calibration = calculateCalibration(decisions)
    if (calibration) {
      lines.push(`- Brier Score: ${calibration.brierScore.toFixed(3)} (lower is better, range 0-1)`)
      lines.push(`  ${calibration.description}`)
    }
  }

  // Emotional patterns (if any decisions have emotional flags)
  const emotionalPatterns = calculateEmotionalPatterns(decisions)
  if (emotionalPatterns.length > 0) {
    lines.push('')
    lines.push('**Emotional Patterns:**')

    emotionalPatterns.slice(0, 5).forEach((pattern: EmotionalPattern) => {
      lines.push(`- **${pattern.emotion}**: ${pattern.count} decisions, avg confidence ${pattern.avgConfidence.toFixed(1)}/10`)
    })
  }

  // Tag patterns (if any decisions have tags)
  const tagPatterns = calculateTagPatterns(decisions)
  if (tagPatterns.length > 0) {
    lines.push('')
    lines.push('**Category Patterns:**')

    tagPatterns.slice(0, 5).forEach((pattern: TagPattern) => {
      lines.push(`- **${pattern.tag}**: ${pattern.count} decisions, avg confidence ${pattern.avgConfidence.toFixed(1)}/10`)
    })
  }

  lines.push('')
  lines.push('*Note: If any metrics show as zero or minimal, it means more data is needed for meaningful analysis.*')

  return lines.join('\n')
}
