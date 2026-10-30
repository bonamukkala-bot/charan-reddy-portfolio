import type { Chunk } from './types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at',
  'from', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'in', 'on', 'of', 'off',
  'over', 'under', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'doing', 'it', 'its', 'he', 'him',
  'his', 'she', 'her', 'hers', 'they', 'them', 'their', 'theirs', 'we', 'us',
  'our', 'ours', 'you', 'your', 'yours', 'i', 'me', 'my', 'myself',
  'who', 'what', 'which', 'where', 'how', 'why', 'whom', 'whose',
  'this', 'that', 'these', 'those', 'can', 'could', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'like', 'charan',
]);

export function normalizeToken(token: string): string {
  if (token === 'c++') return token;

  // Common related forms for high-precision retrieval
  if (token === 'studying' || token === 'student' || token === 'students' || token === 'studies') {
    return 'study';
  }
  if (token === 'built' || token === 'building' || token === 'builder' || token === 'builds') {
    return 'build';
  }
  if (token === 'worked' || token === 'working' || token === 'works') {
    return 'work';
  }
  if (token === 'spoken' || token === 'speaking' || token === 'speaks') {
    return 'speak';
  }

  // Light normalization of plural and participle endings
  if (token.endsWith('ies') && token.length > 4) {
    return token.slice(0, -3) + 'y';
  }
  if (token.endsWith('ing') && token.length > 5) {
    return token.slice(0, -3);
  }
  if (token.endsWith('es') && token.length > 3 && !token.endsWith('ses') && !token.endsWith('xes')) {
    return token.slice(0, -2);
  }
  if (token.endsWith('s') && token.length > 3 && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  return token;
}

export function tokenize(text: string): string[] {
  const raw = text.toLowerCase();
  const matches = raw.match(/c\+\+|[a-z0-9]+/g);
  if (!matches) return [];

  const tokens: string[] = [];
  for (const m of matches) {
    if (STOP_WORDS.has(m)) continue;
    const normalized = normalizeToken(m);
    if (normalized && !STOP_WORDS.has(normalized)) {
      tokens.push(normalized);
    }
  }
  return tokens;
}

export interface BM25Index {
  score(query: string): Map<string, number>;
}

export function createBM25Index(chunks: Chunk[], k1 = 1.2, b = 0.75): BM25Index {
  const N = chunks.length;
  const docTokens: Map<string, string[]> = new Map();
  const docLengths: Map<string, number> = new Map();
  const termDocFreq: Map<string, number> = new Map();
  const docTermFreqs: Map<string, Map<string, number>> = new Map();

  let totalLength = 0;

  for (const chunk of chunks) {
    // Title repeated twice, text, and variants
    const variantsText = chunk.variants && chunk.variants.length > 0 ? chunk.variants.join(' ') : '';
    const combinedText = `${chunk.title} ${chunk.title} ${chunk.text} ${variantsText}`;
    const tokens = tokenize(combinedText);
    docTokens.set(chunk.id, tokens);
    docLengths.set(chunk.id, tokens.length);
    totalLength += tokens.length;

    const termFreq = new Map<string, number>();
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }
    docTermFreqs.set(chunk.id, termFreq);

    for (const term of termFreq.keys()) {
      termDocFreq.set(term, (termDocFreq.get(term) || 0) + 1);
    }
  }

  const avgdl = N > 0 ? totalLength / N : 1;

  // IDF lookup map: ln(1 + (N - n + 0.5) / (n + 0.5))
  const idfMap = new Map<string, number>();
  for (const [term, df] of termDocFreq.entries()) {
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    idfMap.set(term, idf);
  }

  return {
    score(query: string): Map<string, number> {
      const queryTokens = tokenize(query);
      const scores = new Map<string, number>();

      for (const chunk of chunks) {
        scores.set(chunk.id, 0);
      }

      if (queryTokens.length === 0) {
        return scores;
      }

      for (const chunk of chunks) {
        const id = chunk.id;
        const dLen = docLengths.get(id) || 0;
        const termFreq = docTermFreqs.get(id);
        if (!termFreq) continue;

        let docScore = 0;
        for (const token of queryTokens) {
          const tf = termFreq.get(token) || 0;
          if (tf === 0) continue;

          const idf = idfMap.get(token) || 0;
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + (b * dLen) / avgdl);
          docScore += idf * (numerator / denominator);
        }

        scores.set(id, docScore);
      }

      return scores;
    },
  };
}
