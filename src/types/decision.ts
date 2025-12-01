/**
 * Core Decision types following the Farnam Street methodology
 */

export interface Alternative {
  id: string;
  title: string;
  description?: string;
  pros: string[];
  cons: string[];
  estimated_effort?: string;
  estimated_cost?: string;
  reversibility?: 'easy' | 'moderate' | 'difficult' | 'irreversible';
  success_probability?: number; // 0-100
}

export interface Decision {
  id: string;
  created_at: number;
  updated_at: number;

  // Situation & Context
  situation: string;
  problem_statement: string;

  // Decision Details
  variables: string[]; // Key factors
  complications: string[]; // Complexity layers

  // Alternatives
  alternatives: Alternative[];
  selected_alternative_id: string | null;

  // Outcome Projections
  expected_outcome: string;
  best_case_scenario: string;
  worst_case_scenario: string;
  confidence_level: number; // 1-10

  // Context
  mental_state: string;
  physical_state: string;
  time_of_day: string;
  emotional_flags: EmotionalFlag[];

  // Review Data (added later)
  actual_outcome: string | null;
  outcome_rating: number | null; // 1-10
  lessons_learned: string | null;

  // Metadata
  tags: string[];
  is_archived: boolean;
  encryption_key_id: string | null;
}

export type EmotionalFlag =
  | 'regret'
  | 'fomo'
  | 'fear'
  | 'anxiety'
  | 'excitement'
  | 'confidence'
  | 'doubt'
  | 'stress';

export interface ReviewSchedule {
  id: string;
  decision_id: string;
  scheduled_date: number;
  review_type: '1week' | '1month' | '3months' | '1year' | 'custom';
  is_completed: boolean;
  completed_at: number | null;
  notification_sent: boolean;
}

export interface DecisionMetrics {
  id: string;
  decision_id: string;
  calculated_at: number;

  // Calibration metrics
  confidence_accuracy: number | null; // How well confidence matched outcome
  prediction_accuracy: number | null; // How close prediction was to actual

  // Decision quality
  alternatives_considered: number;
  time_to_decide: number; // milliseconds
  bias_flags: string[]; // Identified biases
}

export interface DecisionQualityScore {
  totalScore: number;
  maxScore: number;
  factors: Array<{
    name: string;
    score: number;
    max: number;
  }>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface CalibrationData {
  curve: CalibrationPoint[];
  brierScore: number;
  totalDecisions: number;
  overconfidenceRatio: number; // Positive = overconfident
  recommendation: string;
}

export interface CalibrationPoint {
  confidence: number; // 0-1
  accuracy: number; // 0-1
  count: number; // Number of decisions at this confidence level
}

export interface BiasAnalysis {
  biases: Array<{
    type: string;
    confidence: number; // 0-1
    description: string;
  }>;
  decisionId: string;
}

// Form state types
export type DecisionFormStep =
  | 'situation'
  | 'problem'
  | 'alternatives'
  | 'projections'
  | 'mental-state'
  | 'review';

export interface DecisionFilters {
  search?: string;
  tags?: string[];
  emotional_flags?: EmotionalFlag[];
  date_from?: number;
  date_to?: number;
  has_outcome?: boolean;
  confidence_min?: number;
  confidence_max?: number;
  is_archived?: boolean;
}
