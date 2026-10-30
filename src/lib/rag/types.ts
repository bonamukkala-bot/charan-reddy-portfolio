export type ChunkKind = 'faq' | 'project' | 'info';

export interface Chunk {
  id: string;
  title: string;
  text: string;
  kind: ChunkKind;
  embedding?: number[];
  variants?: string[];
  variantEmbeddings?: number[][];
  suggestion?: string;
}

export interface IndexFile {
  model: string;
  createdAt: string;
  chunks: (Chunk & { embedding: number[] })[];
}

export interface RetrievalResult {
  chunk: Chunk;
  score: number;
  bm25: number;
  semantic: number;
  titleMatch?: number;
}

export interface AnswerSource {
  title: string;
  id: string;
}

export interface Answer {
  text: string;
  sources: AnswerSource[];
  confidence: 'high' | 'medium' | 'low';
  kind: 'knowledge' | 'intent' | 'fallback';
  suggestions?: string[];
}
