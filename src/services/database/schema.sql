-- Decision Journal Database Schema

-- Core decision table
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    -- Situation & Context
    situation TEXT NOT NULL,
    problem_statement TEXT NOT NULL,

    -- Decision Details
    variables TEXT, -- JSON array
    complications TEXT, -- JSON array

    -- Mental State
    mental_state TEXT,
    physical_state TEXT,
    time_of_day TEXT,
    emotional_flags TEXT, -- JSON array: ['regret', 'fomo', 'fear', etc.]

    -- Outcome Projections
    expected_outcome TEXT,
    best_case_scenario TEXT,
    worst_case_scenario TEXT,
    confidence_level INTEGER, -- 1-10

    -- Selected Alternative
    selected_alternative_id TEXT,

    -- Review Data
    actual_outcome TEXT,
    outcome_rating INTEGER, -- 1-10
    lessons_learned TEXT,

    -- Metadata
    tags TEXT, -- JSON array
    is_archived INTEGER DEFAULT 0,
    encryption_key_id TEXT -- Reference to encrypted data
);

-- Alternatives considered
CREATE TABLE IF NOT EXISTS alternatives (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    is_selected INTEGER DEFAULT 0,
    probability_estimate REAL, -- 0.0-1.0
    created_at INTEGER NOT NULL,

    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

-- Review Schedule
CREATE TABLE IF NOT EXISTS review_schedules (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    scheduled_date INTEGER NOT NULL,
    review_type TEXT NOT NULL, -- '1week', '1month', '3months', '1year', 'custom'
    is_completed INTEGER DEFAULT 0,
    completed_at INTEGER,
    notification_sent INTEGER DEFAULT 0,

    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

-- AI Chat History
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    decision_id TEXT, -- NULL for general conversations
    created_at INTEGER NOT NULL,
    trigger_type TEXT, -- 'manual', 'emotional_flag', 'review_prompt'

    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    context_decisions TEXT, -- JSON array of decision IDs used as context

    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Analytics & Metrics
CREATE TABLE IF NOT EXISTS decision_metrics (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    calculated_at INTEGER NOT NULL,

    -- Calibration metrics
    confidence_accuracy REAL, -- How well confidence matched outcome
    prediction_accuracy REAL, -- How close prediction was to actual

    -- Decision quality
    alternatives_considered INTEGER,
    time_to_decide INTEGER, -- milliseconds
    bias_flags TEXT, -- JSON array of identified biases

    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

-- Encrypted Data (for sensitive content)
CREATE TABLE IF NOT EXISTS encrypted_data (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    field_name TEXT NOT NULL, -- 'situation', 'problem_statement', etc.
    encrypted_content BLOB NOT NULL,
    iv BLOB NOT NULL, -- Initialization vector
    created_at INTEGER NOT NULL,

    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON decisions(tags);
CREATE INDEX IF NOT EXISTS idx_decisions_flags ON decisions(emotional_flags);
CREATE INDEX IF NOT EXISTS idx_alternatives_decision ON alternatives(decision_id);
CREATE INDEX IF NOT EXISTS idx_reviews_scheduled ON review_schedules(scheduled_date)
    WHERE is_completed = 0;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
