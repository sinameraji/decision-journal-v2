/**
 * Backfill Embeddings Utility
 *
 * Generates embeddings for decisions that don't have them yet.
 * This is a one-time migration script to index existing decisions.
 */

import { sqliteService } from '@/services/database/sqlite-service'
import { embeddingService } from '@/services/rag/embedding-service'

export interface BackfillResult {
  total: number
  generated: number
  failed: number
  skipped: number
}

/**
 * Backfill embeddings for all decisions without embeddings.
 *
 * @returns Statistics about the backfill operation
 */
export async function backfillEmbeddings(): Promise<BackfillResult> {
  console.log('🔄 Starting embedding backfill...')

  try {
    // Get all decisions
    const decisions = await sqliteService.getDecisions({})
    console.log(`📊 Found ${decisions.length} total decisions`)

    if (decisions.length === 0) {
      console.log('ℹ️  No decisions to process')
      return { total: 0, generated: 0, failed: 0, skipped: 0 }
    }

    // Get existing embeddings
    const existingEmbeddings = await sqliteService.getAllEmbeddings()
    const embeddedIds = new Set(existingEmbeddings.map((e) => e.decisionId))

    // Filter to decisions without embeddings
    const needsEmbedding = decisions.filter((d) => !embeddedIds.has(d.id))
    console.log(`📝 ${needsEmbedding.length} decisions need embeddings`)
    console.log(`✅ ${embeddedIds.size} decisions already have embeddings`)

    if (needsEmbedding.length === 0) {
      console.log('✨ All decisions already indexed!')
      return {
        total: decisions.length,
        generated: 0,
        failed: 0,
        skipped: decisions.length,
      }
    }

    // Generate embeddings with rate limiting (Ollama can handle ~2/sec)
    let generated = 0
    let failed = 0

    for (const decision of needsEmbedding) {
      try {
        console.log(
          `⚙️  Processing (${generated + failed + 1}/${needsEmbedding.length}): ${decision.problem_statement?.substring(0, 50)}...`
        )

        const embedding = await embeddingService.generateDecisionEmbedding(decision)
        await sqliteService.saveEmbedding(embedding)
        generated++

        console.log(
          `  ✓ Generated embedding for: ${decision.problem_statement?.substring(0, 50)}...`
        )
      } catch (error) {
        failed++
        console.error(
          `  ✗ Failed for decision ${decision.id}:`,
          error instanceof Error ? error.message : error
        )
      }

      // Rate limit: 500ms between requests to avoid overwhelming Ollama
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log('\n🎉 Backfill complete!')
    console.log(`  Generated: ${generated}`)
    console.log(`  Failed: ${failed}`)
    console.log(`  Skipped: ${embeddedIds.size}`)
    console.log(`  Total: ${decisions.length}`)

    return {
      total: decisions.length,
      generated,
      failed,
      skipped: embeddedIds.size,
    }
  } catch (error) {
    console.error('❌ Backfill failed:', error)
    throw error
  }
}

/**
 * Check if backfill is needed (any decisions without embeddings).
 *
 * @returns True if backfill is needed
 */
export async function isBackfillNeeded(): Promise<boolean> {
  try {
    const decisions = await sqliteService.getDecisions({})
    const embeddings = await sqliteService.getAllEmbeddings()

    return decisions.length > embeddings.length
  } catch (error) {
    console.error('Failed to check backfill status:', error)
    return false
  }
}
