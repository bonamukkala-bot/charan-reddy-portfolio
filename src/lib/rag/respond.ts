import type { Answer, Chunk } from './types';
import { normalizeQuery, retrieve, retrieveCore, type RetrievalResult } from './retriever';
import { detectIntent } from './intents';
import { buildAnswer } from './answer';

export interface RespondOptions {
  chunks?: (Chunk & { embedding?: number[] })[];
  queryEmbedding?: number[] | null;
  topK?: number;
  vocab?: Set<string>;
}

export interface RespondOutput extends Answer {
  results?: RetrievalResult[];
}

/**
 * Unified response pipeline:
 * normalize -> intent check -> retrieve -> buildAnswer
 */
export async function respond(
  query: string,
  options?: RespondOptions
): Promise<RespondOutput> {
  // 1. Normalize query
  const normalized = normalizeQuery(query, options?.vocab);

  // 2. Intent check
  const intentAnswer = detectIntent(normalized, query);
  if (intentAnswer) {
    return {
      ...intentAnswer,
      results: [],
    };
  }

  // 3. Retrieve
  let results: RetrievalResult[];
  if (options?.chunks) {
    results = retrieveCore({
      query,
      chunks: options.chunks,
      queryEmbedding: options.queryEmbedding,
      topK: options.topK ?? 3,
      vocab: options.vocab,
    });
  } else {
    results = await retrieve(query, { topK: options?.topK ?? 3 });
  }

  // 4. Build answer
  const answer = buildAnswer(results);
  return {
    ...answer,
    results,
  };
}

