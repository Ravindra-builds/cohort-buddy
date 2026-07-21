import path from "node:path";
import { randomUUID } from "node:crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedMany } from "ai";
import { embeddingModel } from "../lib/ai/embeddings";
import { ensureCollection, upsertChunks, type ChunkPayload } from "../lib/qdrant";
import { loadSubtitles } from "../lib/srt";

const SUBTITLES_DIR = path.join(process.cwd(), "data", "subtitles");
const BATCH_SIZE = 50;

async function main() {
  console.log("Loading .srt files from", SUBTITLES_DIR);
  const subtitles = loadSubtitles(SUBTITLES_DIR);
  console.log(`Loaded ${subtitles.length} files`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 750,
    chunkOverlap: 75,
  });

  type Chunk = { text: string; source: string };
  const chunks: Chunk[] = [];

  for (const sub of subtitles) {
    const pieces = await splitter.splitText(sub.text);
    for (const piece of pieces) {
      chunks.push({ text: piece, source: sub.source });
    }
  }

  console.log(`Split into ${chunks.length} chunks`);
  await ensureCollection();

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch.map((c) => c.text),
    });

    const points = batch.map((c, idx) => ({
      id: randomUUID(),
      vector: embeddings[idx],
      payload: { text: c.text, source: c.source } satisfies ChunkPayload,
    }));

    await upsertChunks(points);
    console.log(`Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${points.length} chunks)`);
  }

  console.log("Ingestion complete.");
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});