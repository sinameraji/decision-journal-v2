/**
 * Analytics types for decision quality scoring and calibration
 */

export interface BrierScore {
  score: number // 0-1 (lower is better)
  count: number
  description: string
}

export interface CalibrationBucket {
  confidence: number // 0-100
  actual: number // 0-100
  count: number
}

export interface CalibrationData {
  buckets: CalibrationBucket[]
  brierScore: number
  description: string
}

export interface QualityFactor {
  name: string
  score: number // 0-100
  weight: number
  description: string
}

export interface QualityScore {
  overall: number // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  factors: QualityFactor[]
}

export interface EmotionalPattern {
  emotion: string
  count: number
  avgConfidence: number
  decisions: string[] // Decision IDs
}

export interface TagPattern {
  tag: string
  count: number
  avgConfidence: number
  decisions: string[] // Decision IDs
}

export interface AnalyticsOverview {
  totalDecisions: number
  reviewedCount: number
  reviewedPercent: number
  avgConfidence: number
  avgAlternatives: number
  calibration: CalibrationData | null
  qualityScore: QualityScore | null
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  emotionalPatterns: EmotionalPattern[]
  tagPatterns: TagPattern[]
  recentActivity: {
    weeklyDecisions: number[]
    labels: string[]
  }
}
