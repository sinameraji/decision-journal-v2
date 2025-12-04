/**
 * Embedding Service
 *
 * Generates vector embeddings using Ollama's nomic-embed-text model.
 * Handles communication with Ollama API and error recovery.
 */

import type { Decision } from '../../types/decision';
import type {
  EmbeddingVector,
  OllamaEmbeddingResponse,
} from '../../types/rag';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text';
const EMBEDDING_VERSION = 1; // Increment when embedding text template changes
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Generate embedding text from a decision.
 * This template determines what context is embedded.
 */
function buildDecisionEmbeddingText(decision: Decision): string {
  const parts: string[] = [];

  // Core decision content
  if (decision.problem_statement) {
    parts.push(`Problem: ${decision.problem_statement}`);
  }

  if (decision.situation) {
    // Truncate situation to ~200 words to keep embeddings focused
    const truncatedSituation =
      decision.situation.length > 800
        ? decision.situation.substring(0, 800) + '...'
        : decision.situation;
    parts.push(`Situation: ${truncatedSituation}`);
  }

  // Outcome (if reviewed)
  if (decision.actual_outcome) {
    const truncatedOutcome =
      decision.actual_outcome.length > 400
        ? decision.actual_outcome.substring(0, 400) + '...'
        : decision.actual_outcome;
    parts.push(`Outcome: ${truncatedOutcome}`);
  }

  // Tags for categorical matching
  if (decision.tags && decision.tags.length > 0) {
    parts.push(`Tags: ${decision.tags.join(', ')}`);
  }

  return parts.join(' | ');
}

/**
 * Generate a single embedding via Ollama API.
 */
async function generateEmbedding(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL,
  retries: number = 0
): Promise<Float32Array> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama embedding API error: ${response.status} ${response.statusText}`
      );
    }

    const data: OllamaEmbeddingResponse = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    // Convert to Float32Array for efficient storage and computation
    return new Float32Array(data.embedding);
  } catch (error) {
    // Retry logic
    if (retries < MAX_RETRIES) {
      console.warn(
        `Embedding generation failed (attempt ${retries + 1}/${MAX_RETRIES}), retrying...`,
        error
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * (retries + 1))
      );
      return generateEmbedding(text, model, retries + 1);
    }

    console.error('Failed to generate embedding after retries:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate an embedding vector for a decision.
 */
export async function generateDecisionEmbedding(
  decision: Decision
): Promise<EmbeddingVector> {
  const embeddingText = buildDecisionEmbeddingText(decision);
  const vector = await generateEmbedding(embeddingText);

  const now = Date.now();

  return {
    decisionId: decision.id,
    embeddingText,
    vector,
    modelName: DEFAULT_EMBEDDING_MODEL,
    version: EMBEDDING_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generate an embedding for arbitrary text (for queries).
 */
export async function generateTextEmbedding(
  text: string,
  model?: string
): Promise<Float32Array> {
  return generateEmbedding(text, model);
}

/**
 * Check if Ollama embedding service is available.
 */
export async function isEmbeddingServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if the embedding model is downloaded.
 */
export async function isEmbeddingModelAvailable(
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return false;

    const data = await response.json();
    const models = data.models || [];

    return models.some(
      (m: { name: string }) =>
        m.name === model || m.name.startsWith(`${model}:`)
    );
  } catch {
    return false;
  }
}

/**
 * Get the current embedding model name.
 */
export function getEmbeddingModelName(): string {
  return DEFAULT_EMBEDDING_MODEL;
}

/**
 * Get the current embedding version.
 */
export function getEmbeddingVersion(): number {
  return EMBEDDING_VERSION;
}

/**
 * Embedding service singleton.
 */
export const embeddingService = {
  generateDecisionEmbedding,
  generateTextEmbedding,
  isEmbeddingServiceAvailable,
  isEmbeddingModelAvailable,
  getEmbeddingModelName,
  getEmbeddingVersion,
};
