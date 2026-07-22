import path from "node:path";
import { randomUUID } from "node:crypto";
import { embedMany } from "ai";
import { embeddingModel } from "../lib/ai/embeddings";
import { ensureCollection, upsertChunks, type ChunkPayload } from "../lib/qdrant";
import { loadSubtitleFiles } from "../lib/srt";
import { groupBlocksIntoChunks } from "../lib/chunker";

const SUBTITLES_DIR = path.join(process.cwd(), "data", "subtitles");
const BATCH_SIZE = 50;

async function main() {
  console.log("Loading .srt files from", SUBTITLES_DIR);
  const files = loadSubtitleFiles(SUBTITLES_DIR);
  console.log(`Loaded ${files.length} files`);

  const chunks: (ChunkPayload)[] = [];

  for (const file of files) {
    for (const tc of groupBlocksIntoChunks(file.blocks)) {
      chunks.push({
        text: tc.text,
        source: file.source,
        startTime: tc.startTime,
        endTime: tc.endTime,
      });
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
      payload: c,
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