import { embed } from "ai";
import { embeddingModel } from "./ai/embeddings";
import { searchChunks, type ChunkPayload } from "./qdrant";

export type RetrievedChunk = ChunkPayload & { score: number };

export async function retrieveContext(query: string, topK = 4): Promise<RetrievedChunk[]> {
  const { embedding } = await embed({ model: embeddingModel, value: query });
  const results = await searchChunks(embedding, topK);

  return results.map((r) => ({
    ...(r.payload as ChunkPayload),
    score: r.score,
  }));
}