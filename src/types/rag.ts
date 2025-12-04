/**
 * RAG (Retrieval-Augmented Generation) Type Definitions
 *
 * Types for vector embeddings, semantic search, and context retrieval.
 */

import type { Decision } from './decision';

/**
 * Vector embedding for a decision.
 * Uses Ollama's nomic-embed-text model (768 dimensions).
 */
export interface EmbeddingVector {
  decisionId: string;
  embeddingText: string; // The text that was embedded
  vector: Float32Array; // 768-dimensional embedding
  modelName: string; // e.g., "nomic-embed-text"
  version: number; // Schema version for re-embedding
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

/**
 * Result from vector/semantic search.
 */
export interface SearchResult {
  decisionId: string;
  similarity: number; // 0-1 cosine similarity score
  rank: number; // Position in results (1-based)
  matchType: 'semantic' | 'keyword' | 'hybrid'; // How this was matched
  score: number; // Final score after recency boost
}

/**
 * Context assembled from RAG retrieval for LLM.
 */
export interface RAGContext {
  query: string; // Original query/message
  similarDecisions: Array<{
    decision: Decision;
    similarity: number;
    snippet: string; // Brief context snippet
  }>;
  totalRetrieved: number; // How many decisions were found
  retrievalTimeMs: number; // Performance metric
}

/**
 * Options for hybrid search (semantic + keyword).
 */
export interface HybridSearchOptions {
  semanticWeight?: number; // 0-1, default 0.7
  keywordWeight?: number; // 0-1, default 0.3
  recencyBoostFactor?: number; // 0-1, default 0.3
  similarityThreshold?: number; // 0-1, default 0.65
  maxResults?: number; // default 5
  filters?: {
    tags?: string[];
    isArchived?: boolean;
    hasOutcome?: boolean; // Only reviewed decisions
    minConfidence?: number; // 1-10
    maxConfidence?: number; // 1-10
    startDate?: number; // Unix timestamp
    endDate?: number; // Unix timestamp
  };
}

/**
 * Request to generate an embedding.
 */
export interface EmbeddingRequest {
  text: string;
  model?: string; // default: "nomic-embed-text"
}

/**
 * Response from Ollama embedding API.
 */
export interface OllamaEmbeddingResponse {
  embedding: number[]; // Array of floats
}

/**
 * Statistics about the embedding index.
 */
export interface EmbeddingStats {
  totalEmbeddings: number;
  oldestEmbedding: number | null; // Unix timestamp
  newestEmbedding: number | null; // Unix timestamp
  modelVersions: Record<string, number>; // model name -> count
  averageEmbeddingAge: number; // days
}
