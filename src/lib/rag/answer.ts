import type { Answer, AnswerSource, Chunk, ConversationState } from './types';
import type { RetrievalResult } from './retriever';
import { DEFAULT_SUGGESTION_CHIPS } from './intents';
import { tokenize } from './bm25';
import { buildProjectSuggestions } from './followup';

export const CONFIDENCE_HIGH = 0.55;
export const CONFIDENCE_MEDIUM = 0.35;
export const STRONG_TITLE_MATCH = 0.85;

export const LOW_CONFIDENCE_FALLBACK =
  "I don't have that information. The best way to get an answer is to email me at bonamukkalacharan@gmail.com or use the inquiry form on this site.";

export const DETAIL_CUES_REGEX =
  /\b(details?|detailed|in\s+depth|in\s+detail|full|everything|deep\s+dive|explain|elaborate|complete)\b/i;

/**
 * Normalizes title for topic comparison by removing leading "Q: ", "Project: ", and punctuation.
 */
function cleanTopic(title: string): string {
  return title
    .toLowerCase()
    .replace(/^q:\s*/i, '')
    .replace(/^project:\s*/i, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes text for containment comparisons.
 */
function cleanText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Splits text into substantive sentences (length > 15).
 */
export function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 15);
}

/**
 * Token-based Jaccard similarity between two texts (no stopwords).
 */
export function tokenJaccard(text1: string, text2: string): number {
  const words1 = new Set(tokenize(text1));
  const words2 = new Set(tokenize(text2));
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Determines whether a second chunk should be appended to the first chunk's answer.
 * A single-chunk answer is the default. Two chunks are only used when they clearly
 * add different information.
 */
function shouldAppendSecond(first: RetrievalResult, second: RetrievalResult): boolean {
  // If top result has strong title match (>= 0.85), answer is ONLY that chunk
  if ((first.titleMatch ?? 0) >= STRONG_TITLE_MATCH) {
    return false;
  }

  // Must not have identical chunk IDs
  if (first.chunk.id === second.chunk.id) {
    return false;
  }

  // If first chunk is an FAQ or a Project, never append a second chunk
  if (
    first.chunk.kind === 'faq' ||
    first.chunk.kind === 'project' ||
    first.chunk.id.startsWith('project-')
  ) {
    return false;
  }

  // Second chunk must score within 0.1 of the first
  const scoreDiff = first.score - second.score;
  if (scoreDiff > 0.1) {
    return false;
  }

  // Skip appending when the two chunks repeat the same topic
  const t1 = cleanTopic(first.chunk.title);
  const t2 = cleanTopic(second.chunk.title);
  if (t1 === t2) {
    return false;
  }

  // Skip appending if one title is contained within the other
  if (t1.length > 5 && t2.length > 5 && (t1.includes(t2) || t2.includes(t1))) {
    return false;
  }

  // Skip appending when Jaccard similarity of non-stop words is >= 0.45 (near-duplicates)
  if (tokenJaccard(first.chunk.text, second.chunk.text) >= 0.45) {
    return false;
  }

  // Skip appending when one chunk contains the other's main sentences
  const s1 = getSentences(first.chunk.text);
  const s2 = getSentences(second.chunk.text);
  for (const sent1 of s1) {
    for (const sent2 of s2) {
      if (sent1 === sent2 || sent1.includes(sent2) || sent2.includes(sent1)) {
        return false;
      }
    }
  }

  // Skip appending when whole text of one is contained in the other
  const c1 = cleanText(first.chunk.text);
  const c2 = cleanText(second.chunk.text);
  if (c1.includes(c2) || c2.includes(c1)) {
    return false;
  }

  return true;
}

export function buildOtherSuggestions(
  chunk: Chunk,
  state: ConversationState,
  results?: RetrievalResult[]
): string[] {
  const chips: string[] = [];

  // If chunk has detail not yet shown: the FIRST chip is exactly "Tell me more"
  if (chunk.detail && !state.detailShown[chunk.id]) {
    chips.push('Tell me more');
  }

  if (chunk.suggestion && !chips.includes(chunk.suggestion)) {
    chips.push(chunk.suggestion);
  }

  if (results) {
    for (const r of results) {
      if (r.chunk.id !== chunk.id && r.chunk.suggestion) {
        if (!chips.includes(r.chunk.suggestion)) {
          chips.push(r.chunk.suggestion);
          if (chips.length >= 3) break;
        }
      }
    }
  }

  if (chips.length < 3) {
    for (const def of DEFAULT_SUGGESTION_CHIPS) {
      if (!chips.includes(def)) {
        chips.push(def);
        if (chips.length >= 3) break;
      }
    }
  }

  return chips.slice(0, 3);
}

export interface BuildAnswerResult {
  answer: Answer;
  state: ConversationState;
}

/**
 * Constructs an Answer and updated ConversationState from the ranked retrieval results.
 */
export function buildAnswer(
  results: RetrievalResult[],
  query?: string,
  state: ConversationState = { lastChunkId: null, detailShown: {} }
): BuildAnswerResult {
  const currentState: ConversationState = {
    lastChunkId: state.lastChunkId,
    detailShown: { ...state.detailShown },
  };

  if (!results || results.length === 0 || results[0].score < CONFIDENCE_MEDIUM) {
    const fallbackSuggestions: string[] = [];
    if (results && results.length > 0) {
      for (const r of results) {
        if (r.score >= 0.15 && r.chunk.suggestion) {
          if (!fallbackSuggestions.includes(r.chunk.suggestion)) {
            fallbackSuggestions.push(r.chunk.suggestion);
            if (fallbackSuggestions.length === 2) break;
          }
        }
      }
    }

    const suggestions =
      fallbackSuggestions.length > 0
        ? fallbackSuggestions
        : [...DEFAULT_SUGGESTION_CHIPS.slice(0, 3)];

    return {
      answer: {
        text: LOW_CONFIDENCE_FALLBACK,
        sources: [],
        confidence: 'low',
        kind: 'fallback',
        suggestions,
      },
      state: currentState, // fallbacks do not change lastChunkId
    };
  }

  const first = results[0];
  const isHigh = first.score >= CONFIDENCE_HIGH;
  const confidence: 'high' | 'medium' = isHigh ? 'high' : 'medium';

  // Short-first logic
  let bodyText: string;
  const isProject =
    first.chunk.kind === 'project' || first.chunk.id.startsWith('project-');

  if (first.chunk.short) {
    const hasDetailCue = query ? DETAIL_CUES_REGEX.test(query) : false;
    if (hasDetailCue) {
      bodyText = first.chunk.text;
      currentState.detailShown[first.chunk.id] = true;
    } else {
      bodyText = first.chunk.short;
      currentState.detailShown[first.chunk.id] = false;
    }
  } else {
    bodyText = first.chunk.text;
  }

  const sources: AnswerSource[] = [{ title: first.chunk.title, id: first.chunk.id }];
  const usedIds = new Set<string>([first.chunk.id]);

  // Check if second chunk should be appended (only for non-project, non-FAQ chunks)
  if (results.length > 1) {
    const second = results[1];
    if (shouldAppendSecond(first, second)) {
      bodyText += `\n\n${second.chunk.text}`;
      sources.push({ title: second.chunk.title, id: second.chunk.id });
      usedIds.add(second.chunk.id);
    }
  }

  const text = isHigh ? bodyText : `Here is what I found:\n\n${bodyText}`;

  // Update lastChunkId:
  // "If a knowledge answer was produced, set lastChunkId to the answering chunk's relatedId
  // when it has one, otherwise to the answering chunk's id.
  // If the top chunk is an FAQ without relatedId, set lastChunkId to that FAQ's id."
  currentState.lastChunkId = first.chunk.relatedId || first.chunk.id;

  // Generate suggestions
  let suggestions: string[];
  if (isProject) {
    suggestions = buildProjectSuggestions(first.chunk, currentState);
  } else {
    suggestions = buildOtherSuggestions(first.chunk, currentState, results);
  }

  return {
    answer: {
      text,
      sources,
      confidence,
      kind: 'knowledge',
      suggestions,
    },
    state: currentState,
  };
}
