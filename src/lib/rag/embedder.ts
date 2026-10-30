// Lazy singleton embedder for Xenova/all-MiniLM-L6-v2

type PipelineType = (
  text: string,
  options?: { pooling: string; normalize: boolean }
) => Promise<{ data: Float32Array | number[] }>;

let extractorPromise: Promise<PipelineType> | null = null;

async function getExtractor(): Promise<PipelineType> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      try {
        const { pipeline, env } = await import('@xenova/transformers');
        env.allowLocalModels = false;

        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          quantized: true,
        });

        return extractor as unknown as PipelineType;
      } catch (err) {
        extractorPromise = null;
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to load Xenova/all-MiniLM-L6-v2 model: ${msg}`);
      }
    })();
  }
  return extractorPromise;
}

/**
 * Preload the embedding model in background without blocking execution.
 */
export async function preload(): Promise<void> {
  await getExtractor();
}

/**
 * Embed query string using mean pooling and L2 normalization.
 * Returns 384-dimensional embedding vector.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}

