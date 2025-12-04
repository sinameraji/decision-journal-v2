/**
 * Auto Embedding Service
 *
 * Automatically generates embeddings for decisions in the background.
 * No user intervention required - embeddings are created on decision save
 * and retried silently if they fail.
 */

import { embeddingService } from './embedding-service';
import { sqliteService } from '../database/sqlite-service';
import type { Decision } from '../../types/decision';

// Configuration
const RATE_LIMIT_DELAY_MS = 500; // 2 embeddings/second
const MAX_RETRY_COUNT = 5;
const RETRY_DELAYS = [
  60 * 1000,      // 1 minute
  5 * 60 * 1000,  // 5 minutes
  15 * 60 * 1000, // 15 minutes
  60 * 60 * 1000, // 1 hour
  60 * 60 * 1000, // 1 hour (final retry)
];

interface QueuedEmbedding {
  decisionId: string;
  retryCount: number;
  nextRetryAt: number;
}

/**
 * Auto-embedding service class
 */
class AutoEmbeddingService {
  private embeddingQueue: QueuedEmbedding[] = [];
  private isProcessing = false;
  private backgroundWorkerInterval: NodeJS.Timeout | null = null;

  // Internal metrics (for debugging)
  private metrics = {
    totalGenerated: 0,
    totalFailed: 0,
    lastSuccessfulEmbedding: 0,
  };

  /**
   * Generate embedding for a single decision.
   * Called immediately after decision create/update.
   */
  async generateEmbeddingForDecision(decisionId: string): Promise<void> {
    try {
      // Fetch the full decision from database
      const decision = await sqliteService.getDecision(decisionId);
      if (!decision) {
        console.warn(`[AutoEmbedding] Decision ${decisionId} not found`);
        return;
      }

      // Check if embedding model is available
      const isModelAvailable = await embeddingService.isEmbeddingModelAvailable();
      if (!isModelAvailable) {
        console.warn('[AutoEmbedding] Embedding model not available, queueing for retry');
        this.queueFailedEmbedding(decisionId, 0);
        return;
      }

      // Generate embedding
      const embedding = await embeddingService.generateDecisionEmbedding(decision);

      // Save to database
      await sqliteService.saveEmbedding(embedding);

      // Update metrics
      this.metrics.totalGenerated++;
      this.metrics.lastSuccessfulEmbedding = Date.now();

      console.log(`[AutoEmbedding] Generated embedding for decision ${decisionId}`);
    } catch (error) {
      console.error(`[AutoEmbedding] Failed to generate embedding for ${decisionId}:`, error);

      // Queue for retry
      this.queueFailedEmbedding(decisionId, 0);
      this.metrics.totalFailed++;
    }
  }

  /**
   * Queue a decision for retry after failure.
   */
  private queueFailedEmbedding(decisionId: string, retryCount: number): void {
    // Don't queue if already at max retries
    if (retryCount >= MAX_RETRY_COUNT) {
      console.warn(`[AutoEmbedding] Max retries reached for ${decisionId}, giving up`);
      return;
    }

    // Check if already queued
    const existingIndex = this.embeddingQueue.findIndex(
      (item) => item.decisionId === decisionId
    );

    if (existingIndex >= 0) {
      // Update existing queue item
      this.embeddingQueue[existingIndex] = {
        decisionId,
        retryCount,
        nextRetryAt: Date.now() + RETRY_DELAYS[retryCount],
      };
    } else {
      // Add new queue item
      this.embeddingQueue.push({
        decisionId,
        retryCount,
        nextRetryAt: Date.now() + RETRY_DELAYS[retryCount],
      });
    }

    console.log(
      `[AutoEmbedding] Queued ${decisionId} for retry ${retryCount + 1}/${MAX_RETRY_COUNT} in ${RETRY_DELAYS[retryCount] / 1000}s`
    );
  }

  /**
   * Background worker that processes the retry queue.
   */
  private async processEmbeddingQueue(): Promise<void> {
    if (this.isProcessing || this.embeddingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = Date.now();
      const itemsToProcess = this.embeddingQueue.filter(
        (item) => item.nextRetryAt <= now
      );

      for (const item of itemsToProcess) {
        try {
          // Remove from queue
          this.embeddingQueue = this.embeddingQueue.filter(
            (q) => q.decisionId !== item.decisionId
          );

          // Fetch decision
          const decision = await sqliteService.getDecision(item.decisionId);
          if (!decision) {
            console.warn(`[AutoEmbedding] Decision ${item.decisionId} no longer exists`);
            continue;
          }

          // Check if already embedded (might have been created by another process)
          const existingEmbedding = await sqliteService.getEmbedding(item.decisionId);
          if (existingEmbedding) {
            console.log(`[AutoEmbedding] Embedding already exists for ${item.decisionId}, skipping`);
            continue;
          }

          // Check service availability
          const isAvailable = await embeddingService.isEmbeddingServiceAvailable();
          if (!isAvailable) {
            console.warn('[AutoEmbedding] Ollama not available, re-queueing');
            this.queueFailedEmbedding(item.decisionId, item.retryCount);
            continue;
          }

          // Check model availability
          const isModelAvailable = await embeddingService.isEmbeddingModelAvailable();
          if (!isModelAvailable) {
            console.warn('[AutoEmbedding] Embedding model not available, re-queueing');
            this.queueFailedEmbedding(item.decisionId, item.retryCount);
            continue;
          }

          // Generate embedding
          const embedding = await embeddingService.generateDecisionEmbedding(decision);
          await sqliteService.saveEmbedding(embedding);

          // Update metrics
          this.metrics.totalGenerated++;
          this.metrics.lastSuccessfulEmbedding = Date.now();

          console.log(`[AutoEmbedding] Retry successful for ${item.decisionId}`);

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        } catch (error) {
          console.error(`[AutoEmbedding] Retry failed for ${item.decisionId}:`, error);

          // Re-queue with incremented retry count
          this.queueFailedEmbedding(item.decisionId, item.retryCount + 1);
          this.metrics.totalFailed++;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start the background worker that processes retry queue.
   * Called once on app startup.
   */
  startBackgroundWorker(): void {
    if (this.backgroundWorkerInterval) {
      console.warn('[AutoEmbedding] Background worker already running');
      return;
    }

    // Process queue every 30 seconds
    this.backgroundWorkerInterval = setInterval(() => {
      this.processEmbeddingQueue().catch((error) => {
        console.error('[AutoEmbedding] Background worker error:', error);
      });
    }, 30 * 1000);

    console.log('[AutoEmbedding] Background worker started');
  }

  /**
   * Stop the background worker.
   */
  stopBackgroundWorker(): void {
    if (this.backgroundWorkerInterval) {
      clearInterval(this.backgroundWorkerInterval);
      this.backgroundWorkerInterval = null;
      console.log('[AutoEmbedding] Background worker stopped');
    }
  }

  /**
   * Check for decisions missing embeddings and queue them.
   * Called on app startup.
   */
  async checkForMissingEmbeddings(): Promise<void> {
    try {
      console.log('[AutoEmbedding] Scanning for missing embeddings...');

      // Fetch all decisions
      const decisions = await sqliteService.getDecisions();

      // Fetch all embeddings
      const embeddings = await sqliteService.getAllEmbeddings();
      const embeddedIds = new Set(embeddings.map((e) => e.decisionId));

      // Find missing embeddings
      const missingDecisions = decisions.filter(
        (d: Decision) => !embeddedIds.has(d.id)
      );

      if (missingDecisions.length === 0) {
        console.log('[AutoEmbedding] All decisions are already embedded');
        return;
      }

      console.log(
        `[AutoEmbedding] Found ${missingDecisions.length} decisions without embeddings`
      );

      // Check if Ollama is available
      const isAvailable = await embeddingService.isEmbeddingServiceAvailable();
      const isModelAvailable = await embeddingService.isEmbeddingModelAvailable();

      if (!isAvailable || !isModelAvailable) {
        console.warn(
          '[AutoEmbedding] Ollama or model not available, queueing all for retry'
        );
        // Queue all for retry
        for (const decision of missingDecisions) {
          this.queueFailedEmbedding(decision.id, 0);
        }
        return;
      }

      // Process missing embeddings with rate limiting
      for (const decision of missingDecisions) {
        try {
          const embedding = await embeddingService.generateDecisionEmbedding(decision);
          await sqliteService.saveEmbedding(embedding);

          this.metrics.totalGenerated++;
          this.metrics.lastSuccessfulEmbedding = Date.now();

          console.log(`[AutoEmbedding] Generated embedding for ${decision.id}`);

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        } catch (error) {
          console.error(`[AutoEmbedding] Failed to generate embedding for ${decision.id}:`, error);
          this.queueFailedEmbedding(decision.id, 0);
          this.metrics.totalFailed++;
        }
      }

      console.log(
        `[AutoEmbedding] Scan complete. Generated: ${this.metrics.totalGenerated}, Failed: ${this.metrics.totalFailed}`
      );
    } catch (error) {
      console.error('[AutoEmbedding] Error scanning for missing embeddings:', error);
    }
  }

  /**
   * Get current metrics (for debugging).
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.embeddingQueue.length,
    };
  }

  /**
   * Check if decision needs re-embedding based on content changes.
   */
  needsReembedding(oldDecision: Decision, newDecision: Decision): boolean {
    return (
      oldDecision.problem_statement !== newDecision.problem_statement ||
      oldDecision.situation !== newDecision.situation ||
      oldDecision.actual_outcome !== newDecision.actual_outcome ||
      JSON.stringify(oldDecision.tags) !== JSON.stringify(newDecision.tags)
    );
  }

  /**
   * Handle decision update - regenerate embedding if content changed.
   */
  async handleDecisionUpdate(
    oldDecision: Decision,
    newDecision: Decision
  ): Promise<void> {
    if (this.needsReembedding(oldDecision, newDecision)) {
      console.log(`[AutoEmbedding] Decision ${newDecision.id} content changed, regenerating embedding`);
      await this.generateEmbeddingForDecision(newDecision.id);
    }
  }
}

// Singleton instance
export const autoEmbeddingService = new AutoEmbeddingService();
