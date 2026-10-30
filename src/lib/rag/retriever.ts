import type { Chunk, IndexFile, RetrievalResult as BaseRetrievalResult } from './types';
import { createBM25Index } from './bm25';
import { embedQuery } from './embedder';

export const FAQ_TITLE_BOOST = 0.25;
export const FAQ_LOW_MATCH_THRESHOLD = 0.4;
export const FAQ_LOW_MATCH_PENALTY = 0.05;
export const STRONG_TITLE_MATCH = 0.85;

// Keyword-only (no embedding) retrieval weights
export const KEYWORD_BM25_WEIGHT = 0.75;
export const KEYWORD_TITLE_BOOST = 0.65;

export interface RetrievalResult extends BaseRetrievalResult {
  titleMatch: number;
}

let cachedIndex: IndexFile | null = null;
let cachedVocab: Set<string> | null = null;

const STRUCTURAL_WORDS = new Set([
  'charan',
  "charan's",
  'is',
  'does',
  'do',
  'are',
  'have',
  'has',
  'was',
  'were',
  'a',
  'an',
  'the',
  'to',
  'in',
  'of',
  'for',
  'about',
]);

const QUESTION_WORDS = new Set(['how', 'what', 'where', 'who', 'why', 'which', 'when']);

export function buildVocabulary(chunks: Chunk[]): Set<string> {
  const vocab = new Set<string>();
  for (const chunk of chunks) {
    const allText = `${chunk.title} ${chunk.text} ${(chunk.variants || []).join(' ')}`;
    const words = allText.toLowerCase().match(/[a-z0-9+]+/g) || [];
    for (const w of words) {
      vocab.add(w);
    }
  }
  return vocab;
}

/**
 * Fetch /knowledge-index.json once and cache it in memory.
 */
export async function loadIndex(): Promise<IndexFile> {
  if (cachedIndex) return cachedIndex;

  const res = await fetch('/knowledge-index.json');
  if (!res.ok) {
    throw new Error(`Failed to load knowledge index: ${res.status} ${res.statusText}`);
  }

  cachedIndex = (await res.json()) as IndexFile;
  cachedVocab = buildVocabulary(cachedIndex.chunks);
  return cachedIndex;
}

/**
 * Manually set the cached index (useful for tests or Node environments).
 */
export function setCachedIndex(index: IndexFile): void {
  cachedIndex = index;
  cachedVocab = buildVocabulary(index.chunks);
}

/**
 * Levenshtein distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (Math.abs(m - n) > 2) return 999;

  let row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const nextRow = [i];
    const aChar = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const cost = aChar === b[j - 1] ? 0 : 1;
      nextRow[j] = Math.min(
        row[j] + 1, // deletion
        nextRow[j - 1] + 1, // insertion
        row[j - 1] + cost // substitution
      );
    }
    row = nextRow;
  }
  return row[n];
}

/**
 * Expands English contractions into full words.
 */
export function expandContractions(text: string): string {
  let s = text;
  s = s.replace(/\bwhat['’]s\b/gi, 'what is');
  s = s.replace(/\bwho['’]s\b/gi, 'who is');
  s = s.replace(/\bwhere['’]s\b/gi, 'where is');
  s = s.replace(/\bhow['’]s\b/gi, 'how is');
  s = s.replace(/\bwhen['’]s\b/gi, 'when is');
  s = s.replace(/\bthat['’]s\b/gi, 'that is');
  s = s.replace(/\bit['’]s\b/gi, 'it is');
  s = s.replace(/\bthere['’]s\b/gi, 'there is');
  s = s.replace(/\blet['’]s\b/gi, 'let us');
  s = s.replace(/\bcan['’]t\b/gi, 'can not');
  s = s.replace(/\bdon['’]t\b/gi, 'do not');
  s = s.replace(/\bdoesn['’]t\b/gi, 'does not');
  s = s.replace(/\bisn['’]t\b/gi, 'is not');
  s = s.replace(/\baren['’]t\b/gi, 'are not');
  s = s.replace(/\bwon['’]t\b/gi, 'will not');
  s = s.replace(/\bi['’]m\b/gi, 'i am');
  s = s.replace(/\bi['’]ve\b/gi, 'i have');
  s = s.replace(/\bi['’]d\b/gi, 'i would');
  return s;
}

/**
 * Query normalization:
 * - Drops leading greetings if followed by more words
 * - Strips leading polite filler
 * - Expands chat shorthand
 * - Expands contractions BEFORE pronoun mapping
 * - Swaps pronouns (you -> charan, your -> charan's)
 * - Fixes subject-verb agreement (do charan -> does charan)
 * - Typo tolerance with vocabulary check (distance 1 or 2 with same first letter)
 */
export function normalizeQuery(query: string, vocab?: Set<string>): string {
  let q = query.toLowerCase().trim();

  // 1. Drop leading greeting if followed by more words ("hi, who are you" -> "who are you")
  q = q.replace(
    /^(\b(hi+|hello|hey|yo|good\s+(morning|afternoon|evening))(\s+there)?)[,\s]+(?=\S)/i,
    ''
  );

  // 2. Remove polite filler only when it starts the message:
  // "can/could you (please) tell me", "i want to know", "i would like to know", "i wanna know", "please"
  // Never strip "can you" in "can you build a chatbot"
  q = q.replace(/^(?:can|could)\s+(?:you|u)\s+(?:please\s+)?tell\s+me\s+/i, '');
  q = q.replace(/^i\s+(?:want|would\s+like|wanna)\s+to\s+know\s+/i, '');
  q = q.replace(/^please\s+/i, '');

  // 3. Chat shorthand (word boundaries)
  q = q.replace(/\bu\b/g, 'you');
  q = q.replace(/\bur\b/g, 'your');
  q = q.replace(/\b(?:pls|plz)\b/g, 'please');
  q = q.replace(/\babt\b/g, 'about');
  q = q.replace(/\b(?:wat|wht)\b/g, 'what');

  // 4. Contractions (BEFORE pronoun mapping)
  q = expandContractions(q);

  // 5. Pronouns
  q = q.replace(/\byou're\b/g, 'charan is');
  q = q.replace(/\byou've\b/g, 'charan has');
  q = q.replace(/\byou'll\b/g, 'charan will');
  q = q.replace(/\byou'd\b/g, 'charan would');
  q = q.replace(/\byourself\b/g, 'charan');
  q = q.replace(/\b(?:yours|your)\b/g, "charan's");
  q = q.replace(/\byou\b/g, 'charan');

  q = q.replace(/\bhe's\b/g, 'charan is');
  q = q.replace(/\b(he|his|him|himself)\b/g, 'charan');

  // 6. Agreement fixes after swap
  q = q.replace(/\bdo\s+charan\b/g, 'does charan');
  q = q.replace(/\bare\s+charan\b/g, 'is charan');
  q = q.replace(/\bhave\s+charan\b/g, 'has charan');
  q = q.replace(/\bwere\s+charan\b/g, 'was charan');

  // Location phrasing
  q = q.replace(/\bwhere\s+(?:does\s+)?charan\s+lives?\b/g, 'where is charan based');
  q = q.replace(/\bwhere\s+charan\s+lives?\b/g, 'where charan is based');

  // 7. Typo tolerance
  const activeVocab = vocab || cachedVocab;
  if (activeVocab && activeVocab.size > 0) {
    const tokens = q.split(/\b/);
    const correctedTokens = tokens.map((token) => {
      // Must be an alphabetic token, length >= 5, not containing @, ., or numbers
      if (!/^[a-z]+$/.test(token)) return token;
      if (token.length < 5) return token;
      if (activeVocab.has(token)) return token;

      const firstLetter = token[0];
      const maxDist = token.length >= 8 ? 2 : 1;

      let bestMatch = token;
      let bestDist = maxDist + 1;

      for (const word of activeVocab) {
        if (word[0] !== firstLetter) continue;
        if (Math.abs(word.length - token.length) > maxDist) continue;
        const dist = levenshtein(token, word);
        if (dist <= maxDist && dist < bestDist) {
          bestDist = dist;
          bestMatch = word;
        }
      }
      return bestMatch;
    });
    q = correctedTokens.join('');
  }

  return q.trim();
}

/**
 * Extracts full token list (lowercase, punctuation stripped, leading Q: removed,
 * with possessive 's normalized) preserving stop words like "who", "is", "where", "what", "does".
 */
export function getFullTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/^q:\s*/i, '')
    .replace(/['’]s\b/g, '')
    .replace(/[^a-z0-9+\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Computes cosine similarity between two unit-normalized vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dot));
}

function computeOverlap(
  candidateTitle: string,
  qFullTokens: string[],
  qTokenSet: Set<string>,
  vocab?: Set<string>
): number {
  const normalizedCandidate = normalizeQuery(candidateTitle, vocab);
  const titleTokens = getFullTokens(normalizedCandidate);
  if (titleTokens.length === 0 || qFullTokens.length === 0) return 0;
  const tTokenSet = new Set(titleTokens);

  let tInQ = 0;
  let hasTopicToken = false;
  for (const t of titleTokens) {
    if (qTokenSet.has(t)) {
      tInQ++;
      if (!STRUCTURAL_WORDS.has(t) && !QUESTION_WORDS.has(t)) {
        hasTopicToken = true;
      }
    }
  }

  const titleOverlap = tInQ / titleTokens.length;

  let qInT = 0;
  for (const q of qFullTokens) {
    if (tTokenSet.has(q)) qInT++;
  }
  const queryCoverage = qInT / qFullTokens.length;

  // If neither a topic word matched, nor is there a complete/near-complete title match (>= 0.8),
  // treat titleMatch as 0 (prevents questions like "How old are you?" from matching "How can I hire Charan?")
  if (!hasTopicToken && titleOverlap < 0.8 && queryCoverage < 0.8) {
    return 0;
  }

  return Number(Math.min(titleOverlap, queryCoverage).toFixed(4));
}

export interface RetrieveCoreOptions {
  query: string;
  chunks: (Chunk & { embedding?: number[] })[];
  queryEmbedding?: number[] | null;
  topK?: number;
  vocab?: Set<string>;
}

/**
 * Pure function core for hybrid retrieval. Runs identically in browser and Node.
 */
export function retrieveCore({
  query,
  chunks,
  queryEmbedding = null,
  topK = 3,
  vocab,
}: RetrieveCoreOptions): RetrievalResult[] {
  if (chunks.length === 0) return [];

  const activeVocab = vocab || cachedVocab || buildVocabulary(chunks);
  if (!cachedVocab) {
    cachedVocab = activeVocab;
  }

  // Normalize query
  const normalizedQuery = normalizeQuery(query, activeVocab);

  // 1. BM25 calculation
  const bm25Index = createBM25Index(chunks);
  const rawBm25Scores = bm25Index.score(normalizedQuery);

  let maxBm25 = 0;
  for (const score of rawBm25Scores.values()) {
    if (score > maxBm25) maxBm25 = score;
  }

  // 2. Hybrid scoring
  const hasSemantic = Array.isArray(queryEmbedding) && queryEmbedding.length > 0;
  const results: RetrievalResult[] = [];
  const qFullTokens = getFullTokens(normalizedQuery);
  const qTokenSet = new Set(qFullTokens);

  for (const chunk of chunks) {
    const rawBm25 = rawBm25Scores.get(chunk.id) || 0;
    const bm25Norm = maxBm25 > 0 ? Number((rawBm25 / maxBm25).toFixed(4)) : 0;

    let semantic = 0;
    if (hasSemantic && Array.isArray(chunk.embedding)) {
      semantic = Number(cosineSimilarity(queryEmbedding, chunk.embedding).toFixed(4));
      if (Array.isArray(chunk.variantEmbeddings)) {
        for (const vEmb of chunk.variantEmbeddings) {
          const vSim = Number(cosineSimilarity(queryEmbedding, vEmb).toFixed(4));
          if (vSim > semantic) {
            semantic = vSim;
          }
        }
      }
    }

    // Title matching across chunk title AND all variants
    let titleMatch = computeOverlap(chunk.title, qFullTokens, qTokenSet, activeVocab);
    if (chunk.variants && chunk.variants.length > 0) {
      for (const variant of chunk.variants) {
        const vMatch = computeOverlap(variant, qFullTokens, qTokenSet, activeVocab);
        if (vMatch > titleMatch) {
          titleMatch = vMatch;
        }
      }
    }

    // Score computation
    let score: number;
    let boost: number;
    if (hasSemantic) {
      score = 0.4 * bm25Norm + 0.6 * semantic;
      boost = FAQ_TITLE_BOOST * titleMatch;
    } else {
      score = KEYWORD_BM25_WEIGHT * bm25Norm;
      boost = KEYWORD_TITLE_BOOST * titleMatch;
    }

    // Apply FAQ_TITLE_BOOST and the low-match penalty to every chunk that has variants or is FAQ
    const shouldApplyBoost = chunk.kind === 'faq' || (chunk.variants && chunk.variants.length > 0);
    if (shouldApplyBoost) {
      score += boost;

      if (titleMatch < FAQ_LOW_MATCH_THRESHOLD) {
        score -= FAQ_LOW_MATCH_PENALTY;
      }
    }

    // Zero-match penalty: when neither BM25 nor titleMatch found any substantive match,
    // prevent embedding model domain noise from passing as an answer
    if (bm25Norm === 0 && titleMatch === 0) {
      score = Math.min(score, 0.25);
    }

    results.push({
      chunk,
      score,
      bm25: bm25Norm,
      semantic,
      titleMatch,
    });
  }

  // 3. Sort by raw score descending, with preference for FAQ chunks on strong matches
  results.sort((a, b) => {
    const aFaqStrong = a.chunk.kind === 'faq' && (a.titleMatch ?? 0) >= STRONG_TITLE_MATCH;
    const bFaqStrong = b.chunk.kind === 'faq' && (b.titleMatch ?? 0) >= STRONG_TITLE_MATCH;
    if (aFaqStrong && !bFaqStrong && a.score >= b.score - 0.2) {
      return -1;
    }
    if (bFaqStrong && !aFaqStrong && b.score >= a.score - 0.2) {
      return 1;
    }

    if (Math.abs(b.score - a.score) > 0.0001) {
      return b.score - a.score;
    }
    const aFaq = a.chunk.kind === 'faq' ? 1 : 0;
    const bFaq = b.chunk.kind === 'faq' ? 1 : 0;
    if (bFaq !== aFaq) {
      return bFaq - aFaq;
    }
    return (b.titleMatch ?? 0) - (a.titleMatch ?? 0);
  });

  // Clamp final scores between 0 and 1
  for (const r of results) {
    r.score = Number(Math.min(1, Math.max(0, r.score)).toFixed(4));
  }

  return results.slice(0, topK);
}

/**
 * High-level retrieve function for the browser.
 * Loads index, generates embedding using normalized query, and returns top K.
 */
export async function retrieve(
  query: string,
  options: { topK?: number } = {}
): Promise<RetrievalResult[]> {
  const index = await loadIndex();
  const topK = options.topK ?? 3;

  const normalizedQuery = normalizeQuery(query, cachedVocab || undefined);

  let queryEmbedding: number[] | null = null;
  try {
    queryEmbedding = await embedQuery(normalizedQuery);
  } catch (err) {
    console.warn('Embedding model unavailable, falling back to BM25 only:', err);
    queryEmbedding = null;
  }

  return retrieveCore({
    query: normalizedQuery,
    chunks: index.chunks,
    queryEmbedding,
    topK,
    vocab: cachedVocab || undefined,
  });
}
