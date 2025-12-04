import Database from '@tauri-apps/plugin-sql';
import type {
  Decision,
  Alternative,
  ReviewSchedule,
  DecisionFilters,
} from '@/types/decision';
import type { ChatSession, ChatMessage } from '@/types/chat';
import type { UserPreferences } from '@/types/preferences';
import { isDesktop } from '@/utils/platform';

class SQLiteService {
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Auto-initialize in desktop mode
    if (isDesktop()) {
      this.initPromise = this.initialize();
    }
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    // Skip initialization in browser environment (not Tauri)
    if (!isDesktop()) {
      return;
    }

    // If already initializing or initialized, return
    if (this.db) {
      return;
    }

    try {
      // Load database using Tauri SQL plugin
      // The database will be created in the app data directory automatically
      this.db = await Database.load('sqlite:decision-journal.db');

      // Execute schema directly
      const schema = `
-- Core decision table
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    situation TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    variables TEXT,
    complications TEXT,
    alternatives TEXT,
    mental_state TEXT,
    physical_state TEXT,
    time_of_day TEXT,
    emotional_flags TEXT,
    expected_outcome TEXT,
    best_case_scenario TEXT,
    worst_case_scenario TEXT,
    confidence_level INTEGER,
    selected_alternative_id TEXT,
    actual_outcome TEXT,
    outcome_rating INTEGER,
    lessons_learned TEXT,
    tags TEXT,
    is_archived INTEGER DEFAULT 0,
    encryption_key_id TEXT
);

CREATE TABLE IF NOT EXISTS alternatives (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    is_selected INTEGER DEFAULT 0,
    probability_estimate REAL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_schedules (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    scheduled_date INTEGER NOT NULL,
    review_type TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    completed_at INTEGER,
    notification_sent INTEGER DEFAULT 0,
    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    decision_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    trigger_type TEXT,
    title TEXT,
    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    context_decisions TEXT,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS decision_metrics (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    calculated_at INTEGER NOT NULL,
    confidence_accuracy REAL,
    prediction_accuracy REAL,
    alternatives_considered INTEGER,
    time_to_decide INTEGER,
    bias_flags TEXT,
    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS encrypted_data (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    encrypted_content BLOB NOT NULL,
    iv BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY DEFAULT 'singleton',

  -- Onboarding
  onboarding_completed_at INTEGER,
  onboarding_skipped_steps TEXT,

  -- Microphone Permissions
  microphone_permission_status TEXT CHECK(microphone_permission_status IN ('prompt', 'granted', 'denied', 'unavailable')),
  microphone_last_checked_at INTEGER,
  show_voice_tooltips INTEGER DEFAULT 1,

  -- Notification Permissions
  notification_permission_status TEXT CHECK(notification_permission_status IN ('prompt', 'granted', 'denied', 'unavailable')),
  notification_last_checked_at INTEGER,

  -- Ollama Preferences
  preferred_ollama_model TEXT,

  -- Accessibility
  font_size TEXT DEFAULT 'base' CHECK(font_size IN ('xs', 'sm', 'base', 'lg', 'xl')),

  -- Profile
  profile_name TEXT,
  profile_description TEXT,
  profile_image_path TEXT,
  profile_context TEXT DEFAULT '[]',

  -- Metadata
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  CHECK (id = 'singleton')
);

-- RAG: Decision embeddings table
CREATE TABLE IF NOT EXISTS decision_embeddings (
    decision_id TEXT PRIMARY KEY,
    embedding_text TEXT NOT NULL,
    embedding_vector BLOB NOT NULL,
    model_name TEXT NOT NULL,
    embedding_version INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

-- RAG: Full-text search index for keyword matching
CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
    decision_id UNINDEXED,
    problem_statement,
    situation,
    actual_outcome,
    lessons_learned,
    tags,
    content='decisions',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

-- Tool system: Tool execution tracking
CREATE TABLE IF NOT EXISTS tool_executions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    inputs TEXT,
    outputs TEXT,
    execution_time_ms INTEGER,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Context management: Conversation summaries
CREATE TABLE IF NOT EXISTS conversation_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    message_count INTEGER NOT NULL,
    start_message_id TEXT NOT NULL,
    end_message_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON decisions(tags);
CREATE INDEX IF NOT EXISTS idx_decisions_flags ON decisions(emotional_flags);
CREATE INDEX IF NOT EXISTS idx_alternatives_decision ON alternatives(decision_id);
CREATE INDEX IF NOT EXISTS idx_reviews_scheduled ON review_schedules(scheduled_date) WHERE is_completed = 0;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON user_preferences(onboarding_completed_at);
CREATE INDEX IF NOT EXISTS idx_embeddings_version ON decision_embeddings(embedding_version);
CREATE INDEX IF NOT EXISTS idx_embeddings_updated ON decision_embeddings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_executions_session ON tool_executions(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool ON tool_executions(tool_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_session ON conversation_summaries(session_id, created_at DESC);
      `;

      await this.db.execute(schema);

      // FTS5 triggers to keep full-text search in sync with decisions table
      await this.db.execute(`
        CREATE TRIGGER IF NOT EXISTS decisions_fts_insert AFTER INSERT ON decisions BEGIN
          INSERT INTO decisions_fts(rowid, decision_id, problem_statement, situation, actual_outcome, lessons_learned, tags)
          VALUES (new.rowid, new.id, new.problem_statement, new.situation, new.actual_outcome, new.lessons_learned, new.tags);
        END;
      `);

      await this.db.execute(`
        CREATE TRIGGER IF NOT EXISTS decisions_fts_update AFTER UPDATE ON decisions BEGIN
          UPDATE decisions_fts
          SET problem_statement = new.problem_statement,
              situation = new.situation,
              actual_outcome = new.actual_outcome,
              lessons_learned = new.lessons_learned,
              tags = new.tags
          WHERE rowid = new.rowid;
        END;
      `);

      await this.db.execute(`
        CREATE TRIGGER IF NOT EXISTS decisions_fts_delete AFTER DELETE ON decisions BEGIN
          DELETE FROM decisions_fts WHERE rowid = old.rowid;
        END;
      `);

      // Initialize default user preferences if not exists
      const now = Date.now();
      await this.db.execute(`
        INSERT OR IGNORE INTO user_preferences (
          id,
          onboarding_completed_at,
          onboarding_skipped_steps,
          microphone_permission_status,
          microphone_last_checked_at,
          show_voice_tooltips,
          notification_permission_status,
          notification_last_checked_at,
          preferred_ollama_model,
          font_size,
          created_at,
          updated_at
        ) VALUES (
          'singleton',
          NULL,
          '[]',
          'prompt',
          NULL,
          1,
          'prompt',
          NULL,
          NULL,
          'base',
          ${now},
          ${now}
        )
      `);

      // Migration: Add font_size column if it doesn't exist (for existing databases)
      try {
        await this.db.execute(`
          ALTER TABLE user_preferences
          ADD COLUMN font_size TEXT DEFAULT 'base'
          CHECK(font_size IN ('xs', 'sm', 'base', 'lg', 'xl'))
        `);
      } catch (migrationError: any) {
        // Column might already exist, which is fine
        if (!migrationError.message?.includes('duplicate column')) {
          console.warn('Font size column migration skipped:', migrationError.message);
        }
      }

      // Migration: Add profile columns if they don't exist (for existing databases)
      try {
        await this.db.execute(`ALTER TABLE user_preferences ADD COLUMN profile_name TEXT`);
      } catch (migrationError: any) {
        if (!migrationError.message?.includes('duplicate column')) {
          console.warn('Profile name column migration skipped:', migrationError.message);
        }
      }

      try {
        await this.db.execute(`ALTER TABLE user_preferences ADD COLUMN profile_description TEXT`);
      } catch (migrationError: any) {
        if (!migrationError.message?.includes('duplicate column')) {
          console.warn('Profile description column migration skipped:', migrationError.message);
        }
      }

      try {
        await this.db.execute(`ALTER TABLE user_preferences ADD COLUMN profile_image_path TEXT`);
      } catch (migrationError: any) {
        if (!migrationError.message?.includes('duplicate column')) {
          console.warn('Profile image path column migration skipped:', migrationError.message);
        }
      }

      try {
        await this.db.execute(`ALTER TABLE user_preferences ADD COLUMN profile_context TEXT DEFAULT '[]'`);
      } catch (migrationError: any) {
        if (!migrationError.message?.includes('duplicate column')) {
          console.warn('Profile context column migration skipped:', migrationError.message);
        }
      }
    } catch (error) {
      console.error('✗ Database initialization failed:', error);
      this.db = null;
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if running in browser mode
   */
  private isBrowserMode(): boolean {
    return !isDesktop();
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<Database> {
    if (this.isBrowserMode()) {
      throw new Error('Database not available in browser mode');
    }

    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.db;
  }

  /**
   * LocalStorage fallback for browser mode
   */
  private getLocalStorageData<T>(key: string): T[] {
    if (!this.isBrowserMode()) return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setLocalStorageData<T>(key: string, data: T[]): void {
    if (!this.isBrowserMode()) return;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ============================================================================
  // DECISION CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new decision
   */
  async createDecision(decision: Omit<Decision, 'id' | 'created_at' | 'updated_at'>): Promise<Decision> {
    const now = Date.now();
    const id = this.generateId();

    const newDecision: Decision = {
      id,
      created_at: now,
      updated_at: now,
      ...decision,
    };

    // Use localStorage in browser mode
    if (this.isBrowserMode()) {
      const decisions = this.getLocalStorageData<Decision>('decisions');
      decisions.push(newDecision);
      this.setLocalStorageData('decisions', decisions);
      return newDecision;
    }

    // Use SQLite in desktop mode
    const db = await this.ensureDB();

    try {
      await db.execute(
        `INSERT INTO decisions (
          id, created_at, updated_at,
          situation, problem_statement,
          variables, complications, alternatives,
          mental_state, physical_state, time_of_day, emotional_flags,
          expected_outcome, best_case_scenario, worst_case_scenario, confidence_level,
          selected_alternative_id,
          actual_outcome, outcome_rating, lessons_learned,
          tags, is_archived, encryption_key_id
        ) VALUES (
          $1, $2, $3,
          $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17,
          $18, $19, $20,
          $21, $22, $23
        )`,
        [
          id,
          now,
          now,
          decision.situation,
          decision.problem_statement,
          JSON.stringify(decision.variables || []),
          JSON.stringify(decision.complications || []),
          JSON.stringify(decision.alternatives || []),
          decision.mental_state || null,
          decision.physical_state || null,
          decision.time_of_day || null,
          JSON.stringify(decision.emotional_flags || []),
          decision.expected_outcome || null,
          decision.best_case_scenario || null,
          decision.worst_case_scenario || null,
          decision.confidence_level || null,
          decision.selected_alternative_id || null,
          decision.actual_outcome || null,
          decision.outcome_rating || null,
          decision.lessons_learned || null,
          JSON.stringify(decision.tags || []),
          decision.is_archived ? 1 : 0,
          decision.encryption_key_id || null,
        ]
      );

      const created = await this.getDecision(id);
      if (!created) {
        throw new Error('Failed to retrieve created decision');
      }

      return created;
    } catch (error) {
      console.error('Error creating decision:', error);
      throw error;
    }
  }

  /**
   * Get a decision by ID
   */
  async getDecision(id: string): Promise<Decision | null> {
    const db = await this.ensureDB();

    const rows = await db.select<any[]>('SELECT * FROM decisions WHERE id = $1', [id]);

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    const alternatives = await this.getAlternativesByDecisionId(id);

    return this.rowToDecision(row, alternatives);
  }

  /**
   * Get all decisions with optional filters
   */
  async getDecisions(filters?: DecisionFilters): Promise<Decision[]> {
    // Use localStorage in browser mode
    if (this.isBrowserMode()) {
      let decisions = this.getLocalStorageData<Decision>('decisions');

      // Apply filters if provided
      if (filters) {
        if (filters.search) {
          const search = filters.search.toLowerCase();
          decisions = decisions.filter(d => {
            // Core fields
            if (d.situation.toLowerCase().includes(search)) return true;
            if (d.problem_statement.toLowerCase().includes(search)) return true;

            // Projection fields
            if (d.expected_outcome?.toLowerCase().includes(search)) return true;
            if (d.best_case_scenario?.toLowerCase().includes(search)) return true;
            if (d.worst_case_scenario?.toLowerCase().includes(search)) return true;

            // Context fields
            if (d.mental_state?.toLowerCase().includes(search)) return true;
            if (d.physical_state?.toLowerCase().includes(search)) return true;

            // Review fields
            if (d.actual_outcome?.toLowerCase().includes(search)) return true;
            if (d.lessons_learned?.toLowerCase().includes(search)) return true;

            // Array fields
            if (d.variables.some(v => v.toLowerCase().includes(search))) return true;
            if (d.complications.some(c => c.toLowerCase().includes(search))) return true;

            // Alternatives (nested objects)
            if (d.alternatives.some(alt =>
              alt.title?.toLowerCase().includes(search) ||
              alt.description?.toLowerCase().includes(search) ||
              alt.pros?.some(p => p.toLowerCase().includes(search)) ||
              alt.cons?.some(c => c.toLowerCase().includes(search))
            )) return true;

            return false;
          });
        }
        if (filters.tags && filters.tags.length > 0) {
          decisions = decisions.filter(d =>
            filters.tags!.some(tag => d.tags.includes(tag))
          );
        }
        if (filters.emotional_flags && filters.emotional_flags.length > 0) {
          decisions = decisions.filter(d =>
            filters.emotional_flags!.some(flag => d.emotional_flags.includes(flag as any))
          );
        }
        if (filters.date_from) {
          decisions = decisions.filter(d => d.created_at >= filters.date_from!);
        }
        if (filters.date_to) {
          decisions = decisions.filter(d => d.created_at <= filters.date_to!);
        }
        if (filters.confidence_min) {
          decisions = decisions.filter(d => d.confidence_level >= filters.confidence_min!);
        }
        if (filters.confidence_max) {
          decisions = decisions.filter(d => d.confidence_level <= filters.confidence_max!);
        }
        if (filters.has_outcome !== undefined) {
          decisions = decisions.filter(d =>
            filters.has_outcome ? d.actual_outcome !== null : d.actual_outcome === null
          );
        }
      }

      return decisions;
    }

    // Use SQLite in desktop mode
    const db = await this.ensureDB();
    let query = 'SELECT * FROM decisions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters) {
      if (filters.search) {
        const searchParam = `%${filters.search}%`;
        query += ` AND (
          situation LIKE $${paramIndex} OR
          problem_statement LIKE $${paramIndex + 1} OR
          expected_outcome LIKE $${paramIndex + 2} OR
          best_case_scenario LIKE $${paramIndex + 3} OR
          worst_case_scenario LIKE $${paramIndex + 4} OR
          mental_state LIKE $${paramIndex + 5} OR
          physical_state LIKE $${paramIndex + 6} OR
          actual_outcome LIKE $${paramIndex + 7} OR
          lessons_learned LIKE $${paramIndex + 8} OR
          variables LIKE $${paramIndex + 9} OR
          complications LIKE $${paramIndex + 10} OR
          alternatives LIKE $${paramIndex + 11}
        )`;
        // Push the same search param for each field
        for (let i = 0; i < 12; i++) {
          params.push(searchParam);
        }
        paramIndex += 12;
      }

      if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => {
          const condition = `tags LIKE $${paramIndex}`;
          paramIndex++;
          return condition;
        }).join(' OR ');
        query += ` AND (${tagConditions})`;
        filters.tags.forEach(tag => {
          // Escape double quotes to prevent JSON pattern matching issues
          const escapedTag = tag.replace(/"/g, '\\"');
          params.push(`%"${escapedTag}"%`);
        });
      }

      if (filters.emotional_flags && filters.emotional_flags.length > 0) {
        const flagConditions = filters.emotional_flags.map(() => {
          const condition = `emotional_flags LIKE $${paramIndex}`;
          paramIndex++;
          return condition;
        }).join(' OR ');
        query += ` AND (${flagConditions})`;
        filters.emotional_flags.forEach(flag => {
          // Escape double quotes to prevent JSON pattern matching issues
          const escapedFlag = flag.replace(/"/g, '\\"');
          params.push(`%"${escapedFlag}"%`);
        });
      }

      if (filters.date_from) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(filters.date_to);
        paramIndex++;
      }

      if (filters.has_outcome !== undefined) {
        query += filters.has_outcome
          ? ' AND actual_outcome IS NOT NULL'
          : ' AND actual_outcome IS NULL';
      }

      if (filters.confidence_min) {
        query += ` AND confidence_level >= $${paramIndex}`;
        params.push(filters.confidence_min);
        paramIndex++;
      }

      if (filters.confidence_max) {
        query += ` AND confidence_level <= $${paramIndex}`;
        params.push(filters.confidence_max);
        paramIndex++;
      }

      if (filters.is_archived !== undefined) {
        query += ` AND is_archived = $${paramIndex}`;
        params.push(filters.is_archived ? 1 : 0);
        paramIndex++;
      }
    }

    query += ' ORDER BY created_at DESC';

    const rows = await db.select<any[]>(query, params);

    const decisions: Decision[] = [];
    for (const row of rows) {
      const alternatives = await this.getAlternativesByDecisionId(row.id);
      decisions.push(this.rowToDecision(row, alternatives));
    }

    return decisions;
  }

  /**
   * Update a decision
   */
  async updateDecision(id: string, updates: Partial<Decision>): Promise<Decision> {
    const now = Date.now();

    // Use localStorage in browser mode
    if (this.isBrowserMode()) {
      const decisions = this.getLocalStorageData<Decision>('decisions');
      const index = decisions.findIndex(d => d.id === id);

      if (index === -1) {
        throw new Error(`Decision with id ${id} not found`);
      }

      // Update the decision
      decisions[index] = {
        ...decisions[index],
        ...updates,
        updated_at: now,
      };

      this.setLocalStorageData('decisions', decisions);
      return decisions[index];
    }

    // Use SQLite in desktop mode
    const db = await this.ensureDB();

    const setClauses: string[] = ['updated_at = $1'];
    const params: any[] = [now];
    let paramIndex = 2;

    // Build dynamic UPDATE query based on provided fields
    const fields: Array<keyof Decision> = [
      'situation',
      'problem_statement',
      'mental_state',
      'physical_state',
      'time_of_day',
      'expected_outcome',
      'best_case_scenario',
      'worst_case_scenario',
      'confidence_level',
      'selected_alternative_id',
      'actual_outcome',
      'outcome_rating',
      'lessons_learned',
      'is_archived',
      'encryption_key_id',
    ];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        if (field === 'is_archived') {
          params.push(updates[field] ? 1 : 0);
        } else {
          params.push(updates[field]);
        }
        paramIndex++;
      }
    }

    // Handle JSON fields
    if (updates.variables !== undefined) {
      setClauses.push(`variables = $${paramIndex}`);
      params.push(JSON.stringify(updates.variables));
      paramIndex++;
    }

    if (updates.complications !== undefined) {
      setClauses.push(`complications = $${paramIndex}`);
      params.push(JSON.stringify(updates.complications));
      paramIndex++;
    }

    if (updates.alternatives !== undefined) {
      setClauses.push(`alternatives = $${paramIndex}`);
      params.push(JSON.stringify(updates.alternatives));
      paramIndex++;
    }

    if (updates.emotional_flags !== undefined) {
      setClauses.push(`emotional_flags = $${paramIndex}`);
      params.push(JSON.stringify(updates.emotional_flags));
      paramIndex++;
    }

    if (updates.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex}`);
      params.push(JSON.stringify(updates.tags));
      paramIndex++;
    }

    params.push(id);

    const query = `UPDATE decisions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    try {
      await db.execute(query, params);
      const updated = await this.getDecision(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated decision');
      }
      return updated;
    } catch (error) {
      console.error('Error updating decision:', error);
      throw error;
    }
  }

  /**
   * Delete a decision
   */
  async deleteDecision(id: string): Promise<void> {
    // Use localStorage in browser mode
    if (this.isBrowserMode()) {
      const decisions = this.getLocalStorageData<Decision>('decisions');
      const filtered = decisions.filter(d => d.id !== id);
      this.setLocalStorageData('decisions', filtered);
      return;
    }

    // Use SQLite in desktop mode
    const db = await this.ensureDB();
    await db.execute('DELETE FROM decisions WHERE id = $1', [id]);
  }

  // ============================================================================
  // ALTERNATIVE OPERATIONS (Alternatives are now stored as JSON in decisions)
  // ============================================================================

  /**
   * @deprecated Alternatives are now stored as JSON within the decision object
   * This method is kept for backwards compatibility with old database schema
   */
  async getAlternativesByDecisionId(_decisionId: string): Promise<Alternative[]> {
    // Return empty array - alternatives are now embedded in decision JSON
    return [];
  }

  // ============================================================================
  // REVIEW SCHEDULE OPERATIONS
  // ============================================================================

  /**
   * Create a review schedule
   */
  async createReviewSchedule(schedule: Omit<ReviewSchedule, 'id'>): Promise<ReviewSchedule> {
    const db = await this.ensureDB();
    const id = this.generateId();

    await db.execute(
      `INSERT INTO review_schedules (
        id, decision_id, scheduled_date, review_type,
        is_completed, completed_at, notification_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        schedule.decision_id,
        schedule.scheduled_date,
        schedule.review_type,
        schedule.is_completed ? 1 : 0,
        schedule.completed_at,
        schedule.notification_sent ? 1 : 0,
      ]
    );

    return { id, ...schedule };
  }

  /**
   * Get due reviews
   */
  async getDueReviews(beforeTimestamp: number): Promise<ReviewSchedule[]> {
    const db = await this.ensureDB();

    const rows = await db.select<any[]>(
      `SELECT * FROM review_schedules
       WHERE scheduled_date <= $1 AND is_completed = 0
       ORDER BY scheduled_date ASC`,
      [beforeTimestamp]
    );

    return rows.map(row => this.rowToReviewSchedule(row));
  }

  /**
   * Update review schedule
   */
  async updateReviewSchedule(id: string, updates: Partial<ReviewSchedule>): Promise<void> {
    const db = await this.ensureDB();
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.is_completed !== undefined) {
      setClauses.push(`is_completed = $${paramIndex}`);
      params.push(updates.is_completed ? 1 : 0);
      paramIndex++;
    }

    if (updates.completed_at !== undefined) {
      setClauses.push(`completed_at = $${paramIndex}`);
      params.push(updates.completed_at);
      paramIndex++;
    }

    if (updates.notification_sent !== undefined) {
      setClauses.push(`notification_sent = $${paramIndex}`);
      params.push(updates.notification_sent ? 1 : 0);
      paramIndex++;
    }

    if (setClauses.length === 0) return;

    params.push(id);
    const query = `UPDATE review_schedules SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await db.execute(query, params);
  }

  // ============================================================================
  // CHAT OPERATIONS
  // ============================================================================

  /**
   * Create chat session
   */
  async createChatSession(session: Omit<ChatSession, 'id'>): Promise<ChatSession> {
    const db = await this.ensureDB();
    const id = this.generateId();
    const updated_at = session.created_at; // Initialize updated_at with created_at

    await db.execute(
      `INSERT INTO chat_sessions (id, decision_id, created_at, updated_at, trigger_type, title)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, session.decision_id, session.created_at, updated_at, session.trigger_type, null]
    );

    return { id, ...session, updated_at, title: null };
  }

  /**
   * Create chat message
   */
  async createChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    const db = await this.ensureDB();
    const id = this.generateId();

    await db.execute(
      `INSERT INTO chat_messages (id, session_id, role, content, created_at, context_decisions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        message.session_id,
        message.role,
        message.content,
        message.created_at,
        JSON.stringify(message.context_decisions || []),
      ]
    );

    return { id, ...message };
  }

  /**
   * Get chat messages for a session
   */
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const db = await this.ensureDB();

    const rows = await db.select<any[]>(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    return rows.map(row => ({
      id: row.id,
      session_id: row.session_id,
      role: row.role,
      content: row.content,
      created_at: row.created_at,
      context_decisions: JSON.parse(row.context_decisions || '[]'),
    }));
  }

  /**
   * Get all chat sessions with metadata
   */
  async getChatSessions(limit?: number): Promise<any[]> {
    const db = await this.ensureDB();

    const query = `
      SELECT
        cs.*,
        COUNT(cm.id) as message_count,
        (SELECT content FROM chat_messages WHERE session_id = cs.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message_preview,
        d.problem_statement as linked_decision_title
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      LEFT JOIN decisions d ON cs.decision_id = d.id
      GROUP BY cs.id
      HAVING message_count > 0
      ORDER BY cs.updated_at DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    const rows = await db.select<any[]>(query);

    return rows.map(row => ({
      id: row.id,
      decision_id: row.decision_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      trigger_type: row.trigger_type,
      title: row.title,
      message_count: row.message_count || 0,
      first_message_preview: row.first_message_preview,
      linked_decision_title: row.linked_decision_title,
    }));
  }

  /**
   * Update chat session
   */
  async updateChatSession(sessionId: string, updates: { title?: string; updated_at?: number }): Promise<void> {
    const db = await this.ensureDB();

    // Whitelist of allowed fields for security
    const ALLOWED_FIELDS = ['title', 'updated_at'] as const;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.title !== undefined) {
      if (!ALLOWED_FIELDS.includes('title')) {
        throw new Error('Invalid field: title');
      }
      updateFields.push(`title = $${updateValues.length + 1}`);
      updateValues.push(updates.title);
    }

    if (updates.updated_at !== undefined) {
      if (!ALLOWED_FIELDS.includes('updated_at')) {
        throw new Error('Invalid field: updated_at');
      }
      updateFields.push(`updated_at = $${updateValues.length + 1}`);
      updateValues.push(updates.updated_at);
    }

    if (updateFields.length === 0) {
      return; // Nothing to update
    }

    updateValues.push(sessionId);
    const query = `UPDATE chat_sessions SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`;

    await db.execute(query, updateValues);
  }

  /**
   * Delete chat session (CASCADE will delete messages)
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    const db = await this.ensureDB();
    await db.execute('DELETE FROM chat_sessions WHERE id = $1', [sessionId]);
  }

  // ============================================================================
  // USER PREFERENCES OPERATIONS
  // ============================================================================

  async getUserPreferences(): Promise<UserPreferences | null> {
    if (this.isBrowserMode()) {
      const data = localStorage.getItem('user-preferences');

      if (!data) {
        // Initialize default preferences in localStorage
        const defaultPrefs: UserPreferences = {
          id: 'singleton',
          onboarding_completed_at: null,
          onboarding_skipped_steps: [],
          microphone_permission_status: 'prompt',
          microphone_last_checked_at: null,
          show_voice_tooltips: true,
          notification_permission_status: 'prompt',
          notification_last_checked_at: null,
          preferred_ollama_model: null,
          font_size: 'base',
          profile_name: null,
          profile_description: null,
          profile_image_path: null,
          profile_context: [],
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        localStorage.setItem('user-preferences', JSON.stringify(defaultPrefs));
        return defaultPrefs;
      }

      return JSON.parse(data);
    }

    const db = await this.ensureDB();
    const rows = await db.select<any[]>(
      'SELECT * FROM user_preferences WHERE id = $1',
      ['singleton']
    );

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      onboarding_completed_at: row.onboarding_completed_at,
      onboarding_skipped_steps: JSON.parse(row.onboarding_skipped_steps || '[]'),
      microphone_permission_status: row.microphone_permission_status,
      microphone_last_checked_at: row.microphone_last_checked_at,
      show_voice_tooltips: Boolean(row.show_voice_tooltips),
      notification_permission_status: row.notification_permission_status,
      notification_last_checked_at: row.notification_last_checked_at,
      preferred_ollama_model: row.preferred_ollama_model || null,
      font_size: row.font_size || 'base',
      profile_name: row.profile_name || null,
      profile_description: row.profile_description || null,
      profile_image_path: row.profile_image_path || null,
      profile_context: JSON.parse(row.profile_context || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async updateUserPreferences(updates: Partial<UserPreferences>): Promise<void> {
    const now = Date.now();
    const existing = await this.getUserPreferences();

    if (this.isBrowserMode()) {
      const newPrefs = { ...existing, ...updates, updated_at: now };
      localStorage.setItem('user-preferences', JSON.stringify(newPrefs));
      return;
    }

    const db = await this.ensureDB();

    if (!existing) {
      // Insert new record
      await db.execute(
        `INSERT INTO user_preferences (
          id, onboarding_completed_at, onboarding_skipped_steps,
          microphone_permission_status, microphone_last_checked_at,
          show_voice_tooltips, notification_permission_status, notification_last_checked_at,
          preferred_ollama_model, font_size, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          'singleton',
          updates.onboarding_completed_at || null,
          JSON.stringify(updates.onboarding_skipped_steps || []),
          updates.microphone_permission_status || 'prompt',
          updates.microphone_last_checked_at || null,
          updates.show_voice_tooltips !== undefined ? (updates.show_voice_tooltips ? 1 : 0) : 1,
          updates.notification_permission_status || 'prompt',
          updates.notification_last_checked_at || null,
          updates.preferred_ollama_model || null,
          updates.font_size || 'base',
          now,
          now,
        ]
      );
    } else {
      // Update existing record
      const setClauses: string[] = ['updated_at = $1'];
      const params: any[] = [now];
      let paramIndex = 2;

      if (updates.onboarding_completed_at !== undefined) {
        setClauses.push(`onboarding_completed_at = $${paramIndex}`);
        params.push(updates.onboarding_completed_at);
        paramIndex++;
      }

      if (updates.onboarding_skipped_steps !== undefined) {
        setClauses.push(`onboarding_skipped_steps = $${paramIndex}`);
        params.push(JSON.stringify(updates.onboarding_skipped_steps));
        paramIndex++;
      }

      if (updates.microphone_permission_status !== undefined) {
        setClauses.push(`microphone_permission_status = $${paramIndex}`);
        params.push(updates.microphone_permission_status);
        paramIndex++;
      }

      if (updates.microphone_last_checked_at !== undefined) {
        setClauses.push(`microphone_last_checked_at = $${paramIndex}`);
        params.push(updates.microphone_last_checked_at);
        paramIndex++;
      }

      if (updates.show_voice_tooltips !== undefined) {
        setClauses.push(`show_voice_tooltips = $${paramIndex}`);
        params.push(updates.show_voice_tooltips ? 1 : 0);
        paramIndex++;
      }

      if (updates.preferred_ollama_model !== undefined) {
        setClauses.push(`preferred_ollama_model = $${paramIndex}`);
        params.push(updates.preferred_ollama_model);
        paramIndex++;
      }

      if (updates.font_size !== undefined) {
        setClauses.push(`font_size = $${paramIndex}`);
        params.push(updates.font_size);
        paramIndex++;
      }

      if (updates.profile_name !== undefined) {
        setClauses.push(`profile_name = $${paramIndex}`);
        params.push(updates.profile_name);
        paramIndex++;
      }

      if (updates.profile_description !== undefined) {
        setClauses.push(`profile_description = $${paramIndex}`);
        params.push(updates.profile_description);
        paramIndex++;
      }

      if (updates.profile_image_path !== undefined) {
        setClauses.push(`profile_image_path = $${paramIndex}`);
        params.push(updates.profile_image_path);
        paramIndex++;
      }

      if (updates.profile_context !== undefined) {
        setClauses.push(`profile_context = $${paramIndex}`);
        params.push(JSON.stringify(updates.profile_context));
        paramIndex++;
      }

      params.push('singleton');
      const query = `UPDATE user_preferences SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
      await db.execute(query, params);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Convert database row to Decision object
   */
  private rowToDecision(row: any, alternatives: Alternative[]): Decision {
    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      situation: row.situation,
      problem_statement: row.problem_statement,
      variables: JSON.parse(row.variables || '[]'),
      complications: JSON.parse(row.complications || '[]'),
      alternatives: row.alternatives ? JSON.parse(row.alternatives) : alternatives,
      selected_alternative_id: row.selected_alternative_id,
      expected_outcome: row.expected_outcome,
      best_case_scenario: row.best_case_scenario,
      worst_case_scenario: row.worst_case_scenario,
      confidence_level: row.confidence_level,
      mental_state: row.mental_state,
      physical_state: row.physical_state,
      time_of_day: row.time_of_day,
      emotional_flags: JSON.parse(row.emotional_flags || '[]'),
      actual_outcome: row.actual_outcome,
      outcome_rating: row.outcome_rating,
      lessons_learned: row.lessons_learned,
      tags: JSON.parse(row.tags || '[]'),
      is_archived: Boolean(row.is_archived),
      encryption_key_id: row.encryption_key_id,
    };
  }

  /**
   * Convert database row to ReviewSchedule object
   */
  private rowToReviewSchedule(row: any): ReviewSchedule {
    return {
      id: row.id,
      decision_id: row.decision_id,
      scheduled_date: row.scheduled_date,
      review_type: row.review_type,
      is_completed: Boolean(row.is_completed),
      completed_at: row.completed_at,
      notification_sent: Boolean(row.notification_sent),
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if database is connected (for logging/debugging)
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  // ========================================
  // RAG: Embedding Methods
  // ========================================

  /**
   * Save an embedding vector to the database
   */
  async saveEmbedding(embedding: any): Promise<void> {
    const db = await this.ensureDB();

    // Convert Float32Array to Buffer for BLOB storage
    const vectorBuffer = Buffer.from(embedding.vector.buffer);

    await db.execute(
      `INSERT OR REPLACE INTO decision_embeddings (
        decision_id, embedding_text, embedding_vector, model_name,
        embedding_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        embedding.decisionId,
        embedding.embeddingText,
        vectorBuffer,
        embedding.modelName,
        embedding.version,
        embedding.createdAt,
        embedding.updatedAt,
      ]
    );
  }

  /**
   * Get an embedding by decision ID
   */
  async getEmbedding(decisionId: string): Promise<any | null> {
    const db = await this.ensureDB();

    const result: any[] = await db.select(
      'SELECT * FROM decision_embeddings WHERE decision_id = ?',
      [decisionId]
    );

    if (result.length === 0) return null;

    const row = result[0];

    // Convert Buffer back to Float32Array
    const vectorArray = new Float32Array(row.embedding_vector);

    return {
      decisionId: row.decision_id,
      embeddingText: row.embedding_text,
      vector: vectorArray,
      modelName: row.model_name,
      version: row.embedding_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get all embeddings
   */
  async getAllEmbeddings(): Promise<any[]> {
    const db = await this.ensureDB();

    const rows: any[] = await db.select('SELECT * FROM decision_embeddings');

    return rows.map((row) => {
      const vectorArray = new Float32Array(row.embedding_vector);

      return {
        decisionId: row.decision_id,
        embeddingText: row.embedding_text,
        vector: vectorArray,
        modelName: row.model_name,
        version: row.embedding_version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  /**
   * Delete an embedding
   */
  async deleteEmbedding(decisionId: string): Promise<void> {
    const db = await this.ensureDB();
    await db.execute('DELETE FROM decision_embeddings WHERE decision_id = ?', [
      decisionId,
    ]);
  }

  /**
   * Search decisions using FTS5 full-text search
   * Returns array of decision IDs that match the query
   */
  async searchDecisionsFTS(query: string): Promise<string[]> {
    const db = await this.ensureDB();

    try {
      const result: any[] = await db.select(
        `SELECT decision_id FROM decisions_fts WHERE decisions_fts MATCH ?
         ORDER BY rank LIMIT 20`,
        [query]
      );

      return result.map((row) => row.decision_id);
    } catch (error) {
      console.error('FTS5 search error:', error);
      return [];
    }
  }

  // ========================================
  // Tool System Methods
  // ========================================

  /**
   * Save a tool execution record
   */
  async saveToolExecution(execution: any): Promise<void> {
    const db = await this.ensureDB();

    await db.execute(
      `INSERT INTO tool_executions (
        id, session_id, tool_id, tool_name, inputs, outputs,
        execution_time_ms, success, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        execution.id,
        execution.sessionId,
        execution.toolId,
        execution.toolName,
        JSON.stringify(execution.inputs),
        JSON.stringify(execution.outputs),
        execution.outputs.executionTimeMs || 0,
        execution.success ? 1 : 0,
        execution.errorMessage || null,
        execution.createdAt,
      ]
    );
  }

  /**
   * Get tool executions for a session
   */
  async getToolExecutions(sessionId: string): Promise<any[]> {
    const db = await this.ensureDB();

    const rows: any[] = await db.select(
      'SELECT * FROM tool_executions WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      toolId: row.tool_id,
      toolName: row.tool_name,
      inputs: JSON.parse(row.inputs || '{}'),
      outputs: JSON.parse(row.outputs || '{}'),
      success: Boolean(row.success),
      errorMessage: row.error_message,
      createdAt: row.created_at,
    }));
  }

  // ========================================
  // Context Management Methods
  // ========================================

  /**
   * Save a conversation summary
   */
  async saveConversationSummary(summary: any): Promise<void> {
    const db = await this.ensureDB();

    await db.execute(
      `INSERT INTO conversation_summaries (
        id, session_id, summary_text, message_count,
        start_message_id, end_message_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        summary.id,
        summary.sessionId,
        summary.summaryText,
        summary.messageCount,
        summary.startMessageId,
        summary.endMessageId,
        summary.createdAt,
      ]
    );
  }

  /**
   * Get conversation summaries for a session
   */
  async getConversationSummaries(sessionId: string): Promise<any[]> {
    const db = await this.ensureDB();

    const rows: any[] = await db.select(
      'SELECT * FROM conversation_summaries WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      summaryText: row.summary_text,
      messageCount: row.message_count,
      startMessageId: row.start_message_id,
      endMessageId: row.end_message_id,
      createdAt: row.created_at,
    }));
  }
}

// Export both the class and singleton instance
export { SQLiteService };
export const sqliteService = new SQLiteService();
export default sqliteService;
