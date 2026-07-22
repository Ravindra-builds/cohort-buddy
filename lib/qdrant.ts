import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBEDDING_DIMENSIONS } from "./ai/embeddings";

export const COLLECTION_NAME =
  process.env.QDRANT_COLLECTION_NAME ?? "class-subtitles";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY,
});

export async function ensureCollection() {
  const { collections } = await qdrant.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: EMBEDDING_DIMENSIONS, distance: "Cosine" },
    });
    console.log(`Created collection "${COLLECTION_NAME}"`);
  } else {
    console.log(`Collection "${COLLECTION_NAME}" already exists — reusing it`);
  }
}

export type ChunkPayload = {
  text: string;
  source: string;
  startTime: string;
  endTime: string;
};

export async function upsertChunks(
  points: { id: string; vector: number[]; payload: ChunkPayload }[]
) {
  await qdrant.upsert(COLLECTION_NAME, { wait: true, points });
}

export async function searchChunks(vector: number[], topK = 4) {
  return qdrant.search(COLLECTION_NAME, {
    vector,
    limit: topK,
    with_payload: true,
  });
}