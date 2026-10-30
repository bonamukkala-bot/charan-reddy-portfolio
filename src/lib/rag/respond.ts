import type { Answer, Chunk, ConversationState } from './types';
import {
  normalizeQuery,
  retrieve,
  retrieveCore,
  buildVocabulary,
  loadIndex,
  type RetrievalResult,
} from './retriever';
import { detectIntent, DEFAULT_SUGGESTION_CHIPS } from './intents';
import { buildAnswer, buildOtherSuggestions } from './answer';
import { resolveFollowUp, buildProjectSuggestions } from './followup';

export interface RespondOptions {
  chunks?: (Chunk & { embedding?: number[] })[];
  queryEmbedding?: number[] | null;
  topK?: number;
  vocab?: Set<string>;
}

export interface RespondResult {
  answer: Answer;
  state: ConversationState;
  results?: RetrievalResult[];
}

const MORE_REGEX =
  /^(tell\s+me\s+more|more|more\s+details|more\s+info|go\s+on|continue|elaborate|explain\s+more|explain\s+further|what\s+else|anything\s+else|and\s+then|can\s+you\s+elaborate|show\s+me\s+more)$/i;

/**
 * Unified response pipeline:
 * Pure function: takes (query, state, options) and returns { answer, state, results }.
 */
export async function respond(
  query: string,
  state: ConversationState = { lastChunkId: null, detailShown: {} },
  options?: RespondOptions
): Promise<RespondResult> {
  const currentState: ConversationState = {
    lastChunkId: state.lastChunkId,
    detailShown: { ...state.detailShown },
  };

  let chunks = options?.chunks;
  let vocab = options?.vocab;
  if (!chunks) {
    const index = await loadIndex();
    chunks = index.chunks;
    vocab = buildVocabulary(chunks);
  }

  // 1. Normalize query
  const normalized = normalizeQuery(query, vocab);

  // 1. Existing intents (including ack)
  const intentAnswer = detectIntent(normalized, query);
  if (intentAnswer) {
    return {
      answer: intentAnswer,
      state: currentState, // Intents never change lastChunkId
      results: [],
    };
  }

  // 2. MORE request
  const cleanQuery = query.toLowerCase().trim().replace(/[?!.,;:]+$/g, '').trim();
  const cleanNorm = normalized.toLowerCase().trim().replace(/[?!.,;:]+$/g, '').trim();

  if (MORE_REGEX.test(cleanQuery) || MORE_REGEX.test(cleanNorm)) {
    // If lastChunkId is null
    if (!currentState.lastChunkId) {
      return {
        answer: {
          text: 'What would you like to know more about? Here are a few things you can ask.',
          sources: [],
          confidence: 'high',
          kind: 'intent',
          suggestions: [...DEFAULT_SUGGESTION_CHIPS],
        },
        state: currentState,
        results: [],
      };
    }

    const lastChunk = chunks.find((c) => c.id === currentState.lastChunkId);
    if (lastChunk && lastChunk.detail && !currentState.detailShown[lastChunk.id]) {
      currentState.detailShown[lastChunk.id] = true;
      const suggestions =
        lastChunk.kind === 'project' || lastChunk.id.startsWith('project-')
          ? buildProjectSuggestions(lastChunk, currentState)
          : buildOtherSuggestions(lastChunk, currentState);

      return {
        answer: {
          text: lastChunk.detail,
          sources: [{ id: lastChunk.id, title: lastChunk.title }],
          confidence: 'high',
          kind: 'knowledge',
          suggestions,
        },
        state: currentState,
        results: [],
      };
    }

    // Detail was already shown, or chunk has no detail
    return {
      answer: {
        text: "That's everything I have on this. Is there anything else you'd like to know?",
        sources: [],
        confidence: 'high',
        kind: 'intent',
        suggestions: [
          'What are your other projects?',
          'Are you available for freelance?',
          'How can I contact you?',
        ],
      },
      state: currentState,
      results: [],
    };
  }

  // 3. FOLLOW-UP about the last topic
  const followUpResult = resolveFollowUp(query, normalized, currentState, chunks, vocab);
  if (followUpResult) {
    return {
      answer: followUpResult.answer,
      state: followUpResult.state,
      results: [],
    };
  }

  // 4. Otherwise normal retrieval
  let results: RetrievalResult[];
  if (options?.chunks) {
    results = retrieveCore({
      query,
      chunks: options.chunks,
      queryEmbedding: options.queryEmbedding,
      topK: options.topK ?? 3,
      vocab,
    });
  } else {
    results = await retrieve(query, { topK: options?.topK ?? 3 });
  }

  const { answer, state: newState } = buildAnswer(results, normalized, currentState);

  return {
    answer,
    state: newState,
    results,
  };
}
