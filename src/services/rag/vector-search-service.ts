/**
 * Vector Search Service
 *
 * Implements semantic search using cosine similarity and hybrid search
 * combining vector similarity with keyword matching (FTS5).
 */

import type { Decision } from '../../types/decision';
import type {
  SearchResult,
  HybridSearchOptions,
  EmbeddingVector,
} from '../../types/rag';
import { embeddingService } from './embedding-service';
import { sqliteService } from '../database/sqlite-service';

/**
 * Calculate cosine similarity between two vectors.
 * Returns a value between 0 (orthogonal) and 1 (identical).
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Apply recency boost to similarity score.
 * More recent decisions get a boost to their ranking.
 *
 * Formula: score = similarity * (1.0 + boostFactor * exp(-daysSince/90))
 * - Recent decisions (< 30 days): ~30% boost
 * - Medium age (30-90 days): ~10-20% boost
 * - Old decisions (> 180 days): minimal boost
 */
function applyRecencyBoost(
  similarity: number,
  createdAt: number,
  boostFactor: number = 0.3
): number {
  const now = Date.now();
  const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);

  // Exponential decay: recent decisions get higher boost
  const boost = 1.0 + boostFactor * Math.exp(-daysSince / 90);

  return similarity * boost;
}

/**
 * Search for similar decisions using semantic vector search.
 */
async function semanticSearch(
  queryVector: Float32Array,
  embeddings: EmbeddingVector[],
  decisions: Decision[],
  options: HybridSearchOptions
): Promise<SearchResult[]> {
  const { similarityThreshold = 0.65, maxResults = 5 } = options;

  // Create decision lookup map
  const decisionMap = new Map(decisions.map((d) => [d.id, d]));

  // Calculate similarities
  const preliminaryResults: (SearchResult | null)[] = embeddings.map((embedding) => {
    const decision = decisionMap.get(embedding.decisionId);
    if (!decision) return null;

    const similarity = cosineSimilarity(queryVector, embedding.vector);

    // Apply recency boost
    const score = applyRecencyBoost(
      similarity,
      decision.created_at,
      options.recencyBoostFactor
    );

    return {
      decisionId: embedding.decisionId,
      similarity,
      rank: 0, // Will be set after sorting
      matchType: 'semantic',
      score,
    } as SearchResult;
  });

  // Filter out nulls and apply threshold
  const results: SearchResult[] = preliminaryResults.filter(
    (result): result is SearchResult => {
      return result !== null && result.similarity >= similarityThreshold;
    }
  );

  // Sort by score (with recency boost) and assign ranks
  results.sort((a, b) => b.score - a.score);
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  // Return top K results
  return results.slice(0, maxResults);
}

/**
 * Search using keyword matching (FTS5).
 * Returns decision IDs that match the query.
 */
async function keywordSearch(
  query: string,
  maxResults: number = 10
): Promise<Set<string>> {
  try {
    const decisionIds = await sqliteService.searchDecisionsFTS(query);
    return new Set(decisionIds.slice(0, maxResults));
  } catch (error) {
    console.warn('Keyword search failed, falling back to semantic only:', error);
    return new Set();
  }
}

/**
 * Combine semantic and keyword search results.
 */
function combineResults(
  semanticResults: SearchResult[],
  keywordMatches: Set<string>,
  semanticWeight: number = 0.7,
  keywordWeight: number = 0.3
): SearchResult[] {
  // Normalize weights
  const totalWeight = semanticWeight + keywordWeight;
  const normSemanticWeight = semanticWeight / totalWeight;
  const normKeywordWeight = keywordWeight / totalWeight;

  // Combine scores
  const resultMap = new Map<string, SearchResult>();

  // Add semantic results
  for (const result of semanticResults) {
    const hasKeywordMatch = keywordMatches.has(result.decisionId);
    const semanticScore = result.score * normSemanticWeight;
    const keywordScore = hasKeywordMatch ? normKeywordWeight : 0;
    const combinedScore = semanticScore + keywordScore;

    resultMap.set(result.decisionId, {
      ...result,
      score: combinedScore,
      matchType: hasKeywordMatch ? 'hybrid' : 'semantic',
    });
  }

  // Add keyword-only matches (not in semantic results)
  for (const decisionId of keywordMatches) {
    if (!resultMap.has(decisionId)) {
      resultMap.set(decisionId, {
        decisionId,
        similarity: 0,
        rank: 0,
        matchType: 'keyword',
        score: normKeywordWeight * 0.5, // Lower score for keyword-only
      });
    }
  }

  // Sort by combined score and assign ranks
  const combined = Array.from(resultMap.values());
  combined.sort((a, b) => b.score - a.score);
  combined.forEach((result, index) => {
    result.rank = index + 1;
  });

  return combined;
}

/**
 * Apply filters to decisions.
 */
function applyFilters(
  decisions: Decision[],
  filters?: HybridSearchOptions['filters']
): Decision[] {
  if (!filters) return decisions;

  return decisions.filter((decision) => {
    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = decision.tags?.some((tag) =>
        filters.tags!.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Archived filter
    if (filters.isArchived !== undefined) {
      if (decision.is_archived !== filters.isArchived) return false;
    }

    // Outcome filter
    if (filters.hasOutcome !== undefined) {
      const hasOutcome = Boolean(decision.actual_outcome);
      if (hasOutcome !== filters.hasOutcome) return false;
    }

    // Confidence range
    if (filters.minConfidence !== undefined) {
      if (decision.confidence_level < filters.minConfidence) return false;
    }
    if (filters.maxConfidence !== undefined) {
      if (decision.confidence_level > filters.maxConfidence) return false;
    }

    // Date range
    if (filters.startDate !== undefined) {
      if (decision.created_at < filters.startDate) return false;
    }
    if (filters.endDate !== undefined) {
      if (decision.created_at > filters.endDate) return false;
    }

    return true;
  });
}

/**
 * Search for similar decisions using hybrid search.
 *
 * Combines semantic vector similarity with keyword matching for
 * more robust retrieval.
 */
export async function searchSimilarDecisions(
  query: string,
  topK: number = 5,
  options: HybridSearchOptions = {}
): Promise<SearchResult[]> {
  const startTime = Date.now();

  try {
    // Get all decisions and embeddings
    const allDecisions = await sqliteService.getDecisions({});
    const allEmbeddings = await sqliteService.getAllEmbeddings();

    if (allEmbeddings.length === 0) {
      console.warn('No embeddings available for search');
      return [];
    }

    // Apply filters
    const filteredDecisions = applyFilters(allDecisions, options.filters);
    const filteredDecisionIds = new Set(filteredDecisions.map((d) => d.id));

    // Filter embeddings to match filtered decisions
    const filteredEmbeddings = allEmbeddings.filter((e) =>
      filteredDecisionIds.has(e.decisionId)
    );

    if (filteredEmbeddings.length === 0) {
      console.warn('No decisions match the filters');
      return [];
    }

    // Generate query embedding
    const queryVector = await embeddingService.generateTextEmbedding(query);

    // Semantic search
    const semanticResults = await semanticSearch(
      queryVector,
      filteredEmbeddings,
      filteredDecisions,
      { ...options, maxResults: topK * 2 } // Get more for combination
    );

    // Keyword search
    const keywordMatches = await keywordSearch(query, topK * 2);

    // Combine results
    const combined = combineResults(
      semanticResults,
      keywordMatches,
      options.semanticWeight,
      options.keywordWeight
    );

    // Return top K
    const results = combined.slice(0, topK);

    const elapsedMs = Date.now() - startTime;
    console.log(
      `Vector search completed in ${elapsedMs}ms (${results.length} results)`
    );

    return results;
  } catch (error) {
    console.error('Search failed:', error);
    throw new Error(
      `Failed to search decisions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Vector search service singleton.
 */
export const vectorSearchService = {
  searchSimilarDecisions,
  cosineSimilarity, // Export for testing
};
