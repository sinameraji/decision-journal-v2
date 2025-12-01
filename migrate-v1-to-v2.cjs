#!/usr/bin/env node

/**
 * Migration script to copy data from v1 to v2 database
 *
 * Usage: node migrate-v1-to-v2.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const V1_DB_PATH = path.join(
  os.homedir(),
  'Library/Application Support/com.decisionjournal.app/decision-journal.db'
);

const V2_DB_PATH = path.join(
  os.homedir(),
  'Library/Application Support/com.sinameraji.decisionjournal/decision-journal.db'
);

console.log('🔄 Starting migration from v1 to v2...\n');

// Check if v1 database exists
if (!fs.existsSync(V1_DB_PATH)) {
  console.error('❌ v1 database not found at:', V1_DB_PATH);
  process.exit(1);
}

// Check if v2 database exists
if (!fs.existsSync(V2_DB_PATH)) {
  console.error('❌ v2 database not found at:', V2_DB_PATH);
  console.error('   Please run the v2 app at least once to create the database.');
  process.exit(1);
}

// Backup v2 database
const backupPath = V2_DB_PATH + '.backup-' + Date.now();
console.log('📦 Creating backup of v2 database...');
fs.copyFileSync(V2_DB_PATH, backupPath);
console.log('✅ Backup created at:', backupPath);
console.log('');

try {
  // Open databases
  const v1db = new Database(V1_DB_PATH, { readonly: true });
  const v2db = new Database(V2_DB_PATH);

  // Get stats from v1
  const v1DecisionCount = v1db.prepare('SELECT COUNT(*) as count FROM decisions').get().count;
  const v1SessionCount = v1db.prepare('SELECT COUNT(*) as count FROM chat_sessions').get().count;
  const v1MessageCount = v1db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count;

  console.log('📊 v1 Database Stats:');
  console.log(`   Decisions: ${v1DecisionCount}`);
  console.log(`   Chat Sessions: ${v1SessionCount}`);
  console.log(`   Chat Messages: ${v1MessageCount}`);
  console.log('');

  // Get current v2 stats
  const v2DecisionCountBefore = v2db.prepare('SELECT COUNT(*) as count FROM decisions').get().count;
  console.log(`📊 v2 Database (before): ${v2DecisionCountBefore} decisions`);
  console.log('');

  // Start transaction
  v2db.prepare('BEGIN TRANSACTION').run();

  try {
    // Migrate decisions
    console.log('🔄 Migrating decisions...');
    const v1Decisions = v1db.prepare('SELECT * FROM decisions').all();

    const insertDecision = v2db.prepare(`
      INSERT OR REPLACE INTO decisions (
        id, problem_statement, situation, variables, complications,
        alternatives, selected_alternative_id, expected_outcome,
        best_case_scenario, worst_case_scenario, confidence_level,
        mental_state, physical_state, emotional_flags, time_of_day,
        tags, actual_outcome, outcome_rating, lessons_learned,
        is_archived, encryption_key_id, created_at, updated_at
      ) VALUES (
        @id, @problem_statement, @situation, @variables, @complications,
        @alternatives, @selected_alternative_id, @expected_outcome,
        @best_case_scenario, @worst_case_scenario, @confidence_level,
        @mental_state, @physical_state, @emotional_flags, @time_of_day,
        @tags, @actual_outcome, @outcome_rating, @lessons_learned,
        @is_archived, @encryption_key_id, @created_at, @updated_at
      )
    `);

    let migratedDecisions = 0;
    for (const decision of v1Decisions) {
      insertDecision.run(decision);
      migratedDecisions++;
    }
    console.log(`✅ Migrated ${migratedDecisions} decisions`);

    // Migrate chat sessions
    console.log('🔄 Migrating chat sessions...');
    const v1Sessions = v1db.prepare('SELECT * FROM chat_sessions').all();

    const insertSession = v2db.prepare(`
      INSERT OR REPLACE INTO chat_sessions (
        id, title, decision_id, trigger_type, created_at, updated_at
      ) VALUES (
        @id, @title, @decision_id, @trigger_type, @created_at, @updated_at
      )
    `);

    let migratedSessions = 0;
    for (const session of v1Sessions) {
      insertSession.run(session);
      migratedSessions++;
    }
    console.log(`✅ Migrated ${migratedSessions} chat sessions`);

    // Migrate chat messages
    console.log('🔄 Migrating chat messages...');
    const v1Messages = v1db.prepare('SELECT * FROM chat_messages').all();

    const insertMessage = v2db.prepare(`
      INSERT OR REPLACE INTO chat_messages (
        id, session_id, role, content, created_at, context_decisions
      ) VALUES (
        @id, @session_id, @role, @content, @created_at, @context_decisions
      )
    `);

    let migratedMessages = 0;
    for (const message of v1Messages) {
      insertMessage.run(message);
      migratedMessages++;
    }
    console.log(`✅ Migrated ${migratedMessages} chat messages`);

    // Commit transaction
    v2db.prepare('COMMIT').run();

    // Get final v2 stats
    const v2DecisionCountAfter = v2db.prepare('SELECT COUNT(*) as count FROM decisions').get().count;
    const v2SessionCountAfter = v2db.prepare('SELECT COUNT(*) as count FROM chat_sessions').get().count;
    const v2MessageCountAfter = v2db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count;

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 v2 Database (after):');
    console.log(`   Decisions: ${v2DecisionCountAfter}`);
    console.log(`   Chat Sessions: ${v2SessionCountAfter}`);
    console.log(`   Chat Messages: ${v2MessageCountAfter}`);
    console.log('');
    console.log('💡 Backup location:', backupPath);
    console.log('');
    console.log('🎉 Please restart your v2 app to see the migrated data!');

  } catch (error) {
    // Rollback on error
    v2db.prepare('ROLLBACK').run();
    throw error;
  } finally {
    v1db.close();
    v2db.close();
  }

} catch (error) {
  console.error('');
  console.error('❌ Migration failed:', error.message);
  console.error('');
  console.error('💡 Your v2 database has been restored from backup');
  console.error('   Backup location:', backupPath);
  process.exit(1);
}
