import type { Decision } from '@/types/decision'
import type {
  AnalyticsData,
  AnalyticsOverview,
  BrierScore,
  CalibrationData,
  CalibrationBucket,
  QualityScore,
  QualityFactor,
  EmotionalPattern,
  TagPattern,
} from '@/types/analytics'

/**
 * Calculate Brier Score for calibration
 * Brier Score = (1/N) * Σ(forecast - outcome)²
 * Lower is better (0 = perfect, 1 = worst)
 */
export function calculateBrierScore(decisions: Decision[]): BrierScore {
  const reviewedDecisions = decisions.filter(
    (d) =>
      d?.actual_outcome !== undefined &&
      d.actual_outcome !== null &&
      d.confidence_level !== undefined &&
      d.confidence_level !== null
  )

  if (reviewedDecisions.length === 0) {
    return {
      score: 0,
      count: 0,
      description: 'No reviewed decisions yet',
    }
  }

  let sumSquaredErrors = 0

  for (const decision of reviewedDecisions) {
    // Convert confidence (0-10) to probability (0-1)
    const forecast = decision.confidence_level! / 10

    // Convert actual outcome to binary (1 = success/positive, 0 = failure/negative)
    // actual_outcome is a string describing the outcome
    // Use outcome_rating (1-10) if available, otherwise default based on description
    let outcome: number
    if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
      outcome = decision.outcome_rating / 10 // Normalize to 0-1
    } else if (decision.actual_outcome) {
      // Fallback: try to infer from text (simple heuristic)
      const lowerOutcome = decision.actual_outcome.toLowerCase()
      if (lowerOutcome.includes('better') || lowerOutcome.includes('success') || lowerOutcome.includes('good')) {
        outcome = 1
      } else if (lowerOutcome.includes('worse') || lowerOutcome.includes('fail') || lowerOutcome.includes('bad')) {
        outcome = 0
      } else {
        outcome = 0.5 // Neutral/unclear
      }
    } else {
      outcome = 0.5
    }

    sumSquaredErrors += Math.pow(forecast - outcome, 2)
  }

  const brierScore = sumSquaredErrors / reviewedDecisions.length

  let description = ''
  if (brierScore < 0.1) {
    description = 'Excellent calibration'
  } else if (brierScore < 0.2) {
    description = 'Good calibration'
  } else if (brierScore < 0.3) {
    description = 'Fair calibration'
  } else {
    description = 'Needs improvement'
  }

  return {
    score: brierScore,
    count: reviewedDecisions.length,
    description,
  }
}

/**
 * Calculate calibration curve data
 * Groups decisions by confidence level and checks actual outcomes
 */
export function calculateCalibration(decisions: Decision[]): CalibrationData | null {
  const reviewedDecisions = decisions.filter(
    (d) =>
      d?.actual_outcome !== undefined &&
      d.actual_outcome !== null &&
      d.confidence_level !== undefined &&
      d.confidence_level !== null
  )

  if (reviewedDecisions.length < 5) {
    return null // Need at least 5 reviewed decisions for calibration
  }

  // Create buckets: 0-20, 20-40, 40-60, 60-80, 80-100
  const buckets: Map<number, { successCount: number; totalCount: number }> = new Map()
  const bucketRanges = [20, 40, 60, 80, 100]

  for (const bucketMax of bucketRanges) {
    buckets.set(bucketMax, { successCount: 0, totalCount: 0 })
  }

  for (const decision of reviewedDecisions) {
    const confidence = decision.confidence_level! * 10 // Convert to 0-100

    // Find appropriate bucket
    let bucketMax = 100
    for (const range of bucketRanges) {
      if (confidence <= range) {
        bucketMax = range
        break
      }
    }

    const bucket = buckets.get(bucketMax)!
    bucket.totalCount++

    // Check if outcome was positive
    // Use outcome_rating if available, otherwise infer from actual_outcome text
    let isSuccess: boolean
    if (decision.outcome_rating !== null && decision.outcome_rating !== undefined) {
      isSuccess = decision.outcome_rating >= 5 // 5+ is positive outcome
    } else if (decision.actual_outcome) {
      const lowerOutcome = decision.actual_outcome.toLowerCase()
      isSuccess = lowerOutcome.includes('better') || lowerOutcome.includes('success') || lowerOutcome.includes('good')
    } else {
      isSuccess = false
    }

    if (isSuccess) {
      bucket.successCount++
    }
  }

  // Convert to calibration buckets
  const calibrationBuckets: CalibrationBucket[] = []
  for (const [bucketMax, data] of buckets.entries()) {
    if (data.totalCount > 0) {
      calibrationBuckets.push({
        confidence: bucketMax - 10, // Use midpoint of bucket
        actual: (data.successCount / data.totalCount) * 100,
        count: data.totalCount,
      })
    }
  }

  const brierScore = calculateBrierScore(decisions).score

  return {
    buckets: calibrationBuckets,
    brierScore,
    description: 'Calibration curve based on reviewed decisions',
  }
}

/**
 * Calculate decision quality score (0-100)
 * Based on 5 factors:
 * 1. Reflection depth (20 points) - Length and detail of problem statement
 * 2. Alternative exploration (20 points) - Number and quality of alternatives
 * 3. Outcome projection (20 points) - Specificity of expected outcomes
 * 4. Mental state awareness (20 points) - Documentation of emotional/physical state
 * 5. Review completion (20 points) - Whether decision was reviewed
 */
export function calculateQualityScore(decision: Decision): QualityScore {
  const factors: QualityFactor[] = []

  // Factor 1: Reflection Depth (20 points)
  let reflectionScore = 0
  if (decision.problem_statement) {
    const length = decision.problem_statement.length
    if (length > 200) reflectionScore = 20
    else if (length > 100) reflectionScore = 15
    else if (length > 50) reflectionScore = 10
    else reflectionScore = 5
  }
  factors.push({
    name: 'Reflection Depth',
    score: reflectionScore,
    weight: 0.2,
    description: 'Quality of problem statement',
  })

  // Factor 2: Alternative Exploration (20 points)
  let alternativeScore = 0
  const altCount = decision.alternatives?.length || 0
  if (altCount >= 4) alternativeScore = 20
  else if (altCount === 3) alternativeScore = 15
  else if (altCount === 2) alternativeScore = 10
  else if (altCount === 1) alternativeScore = 5

  // Bonus for detailed pros/cons
  if (decision.alternatives && decision.alternatives.length > 0) {
    const hasDetails = decision.alternatives.some(
      (alt) =>
        (alt.pros && alt.pros.length > 0) || (alt.cons && alt.cons.length > 0)
    )
    if (hasDetails) alternativeScore = Math.min(20, alternativeScore + 5)
  }
  factors.push({
    name: 'Alternative Exploration',
    score: alternativeScore,
    weight: 0.2,
    description: 'Number and detail of alternatives',
  })

  // Factor 3: Outcome Projection (20 points)
  let outcomeScore = 0
  if (decision.expected_outcome) {
    const length = decision.expected_outcome.length
    if (length > 150) outcomeScore = 20
    else if (length > 75) outcomeScore = 15
    else if (length > 30) outcomeScore = 10
    else outcomeScore = 5
  }
  factors.push({
    name: 'Outcome Projection',
    score: outcomeScore,
    weight: 0.2,
    description: 'Specificity of expected outcomes',
  })

  // Factor 4: Mental State Awareness (20 points)
  let mentalScore = 0
  const emotionCount = decision.emotional_flags?.length || 0
  if (emotionCount >= 3) mentalScore = 15
  else if (emotionCount >= 2) mentalScore = 10
  else if (emotionCount >= 1) mentalScore = 5

  if (decision.physical_state) {
    mentalScore = Math.min(20, mentalScore + 5)
  }
  factors.push({
    name: 'Mental State Awareness',
    score: mentalScore,
    weight: 0.2,
    description: 'Documentation of mental/emotional state',
  })

  // Factor 5: Review Completion (20 points)
  let reviewScore = 0
  if (decision) {
    reviewScore = 20
    if (decision.lessons_learned) {
      reviewScore = Math.min(20, reviewScore + 5)
    }
  }
  factors.push({
    name: 'Review Completion',
    score: reviewScore,
    weight: 0.2,
    description: 'Whether decision was reviewed',
  })

  // Calculate overall score
  const overall = factors.reduce((sum, factor) => sum + factor.score, 0)

  // Assign letter grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (overall >= 90) grade = 'A'
  else if (overall >= 80) grade = 'B'
  else if (overall >= 70) grade = 'C'
  else if (overall >= 60) grade = 'D'
  else grade = 'F'

  return {
    overall,
    grade,
    factors,
  }
}

/**
 * Calculate emotional patterns across decisions
 */
export function calculateEmotionalPatterns(decisions: Decision[]): EmotionalPattern[] {
  const emotionMap = new Map<
    string,
    { count: number; totalConfidence: number; decisions: string[] }
  >()

  for (const decision of decisions) {
    if (decision.emotional_flags && decision.emotional_flags.length > 0) {
      for (const emotion of decision.emotional_flags) {
        if (!emotionMap.has(emotion)) {
          emotionMap.set(emotion, { count: 0, totalConfidence: 0, decisions: [] })
        }

        const data = emotionMap.get(emotion)!
        data.count++
        data.totalConfidence += decision.confidence_level || 0
        data.decisions.push(decision.id)
      }
    }
  }

  const patterns: EmotionalPattern[] = []
  for (const [emotion, data] of emotionMap.entries()) {
    patterns.push({
      emotion,
      count: data.count,
      avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
      decisions: data.decisions,
    })
  }

  // Sort by count descending
  patterns.sort((a, b) => b.count - a.count)

  return patterns
}

/**
 * Calculate tag patterns across decisions
 */
export function calculateTagPatterns(decisions: Decision[]): TagPattern[] {
  const tagMap = new Map<
    string,
    { count: number; totalConfidence: number; decisions: string[] }
  >()

  for (const decision of decisions) {
    if (decision.tags && decision.tags.length > 0) {
      for (const tag of decision.tags) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, { count: 0, totalConfidence: 0, decisions: [] })
        }

        const data = tagMap.get(tag)!
        data.count++
        data.totalConfidence += decision.confidence_level || 0
        data.decisions.push(decision.id)
      }
    }
  }

  const patterns: TagPattern[] = []
  for (const [tag, data] of tagMap.entries()) {
    patterns.push({
      tag,
      count: data.count,
      avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
      decisions: data.decisions,
    })
  }

  // Sort by count descending
  patterns.sort((a, b) => b.count - a.count)

  return patterns
}

/**
 * Generate complete analytics data
 */
export function generateAnalytics(decisions: Decision[]): AnalyticsData {
  const reviewedDecisions = decisions.filter((d) => d)

  // Calculate overview stats
  const totalDecisions = decisions.length
  const reviewedCount = reviewedDecisions.length
  const reviewedPercent = totalDecisions > 0 ? (reviewedCount / totalDecisions) * 100 : 0

  const avgConfidence =
    decisions.length > 0
      ? decisions.reduce((sum, d) => sum + (d.confidence_level || 0), 0) / decisions.length
      : 0

  const avgAlternatives =
    decisions.length > 0
      ? decisions.reduce((sum, d) => sum + (d.alternatives?.length || 0), 0) /
        decisions.length
      : 0

  const calibration = calculateCalibration(decisions)
  const qualityScore =
    decisions.length > 0 ? calculateAverageQualityScore(decisions) : null

  const overview: AnalyticsOverview = {
    totalDecisions,
    reviewedCount,
    reviewedPercent,
    avgConfidence,
    avgAlternatives,
    calibration,
    qualityScore,
  }

  // Calculate patterns
  const emotionalPatterns = calculateEmotionalPatterns(decisions)
  const tagPatterns = calculateTagPatterns(decisions)

  // Calculate recent activity (last 7 weeks)
  const recentActivity = calculateRecentActivity(decisions, 7)

  return {
    overview,
    emotionalPatterns,
    tagPatterns,
    recentActivity,
  }
}

/**
 * Calculate average quality score across all decisions
 */
function calculateAverageQualityScore(decisions: Decision[]): QualityScore {
  const scores = decisions.map((d) => calculateQualityScore(d))

  const avgOverall =
    scores.reduce((sum, s) => sum + s.overall, 0) / scores.length

  // Average each factor
  const avgFactors: QualityFactor[] = []
  for (let i = 0; i < 5; i++) {
    const factorScores = scores.map((s) => s.factors[i])
    const avgScore =
      factorScores.reduce((sum, f) => sum + f.score, 0) / factorScores.length

    avgFactors.push({
      name: factorScores[0].name,
      score: avgScore,
      weight: factorScores[0].weight,
      description: factorScores[0].description,
    })
  }

  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (avgOverall >= 90) grade = 'A'
  else if (avgOverall >= 80) grade = 'B'
  else if (avgOverall >= 70) grade = 'C'
  else if (avgOverall >= 60) grade = 'D'
  else grade = 'F'

  return {
    overall: avgOverall,
    grade,
    factors: avgFactors,
  }
}

/**
 * Calculate weekly decision counts for recent activity
 */
function calculateRecentActivity(
  decisions: Decision[],
  weeks: number
): { weeklyDecisions: number[]; labels: string[] } {
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  const weeklyCounts = new Array(weeks).fill(0)
  const labels: string[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = now - (i + 1) * weekMs
    const weekEnd = now - i * weekMs

    const count = decisions.filter((d) => {
      const created = d.created_at || 0
      return created >= weekStart && created < weekEnd
    }).length

    weeklyCounts[weeks - 1 - i] = count

    // Create label (e.g., "2 weeks ago", "Last week")
    if (i === 0) labels.push('This week')
    else if (i === 1) labels.push('Last week')
    else labels.push(`${i + 1} weeks ago`)
  }

  return {
    weeklyDecisions: weeklyCounts,
    labels: labels.reverse(),
  }
}
