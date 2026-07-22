import type { SrtBlock } from "./srt";

export type TimedChunk = {
  text: string;
  startTime: string;
  endTime: string;
};

const MAX_CHUNK_CHARS = 800;

export function groupBlocksIntoChunks(blocks: SrtBlock[]): TimedChunk[] {
  const chunks: TimedChunk[] = [];
  let current: SrtBlock[] = [];
  let currentLength = 0;

  for (const block of blocks) {
    if (currentLength + block.text.length > MAX_CHUNK_CHARS && current.length > 0) {
      chunks.push(finalizeChunk(current));
      current = [];
      currentLength = 0;
    }
    current.push(block);
    currentLength += block.text.length + 1;
  }

  if (current.length > 0) {
    chunks.push(finalizeChunk(current));
  }

  return chunks;
}

function finalizeChunk(blocks: SrtBlock[]): TimedChunk {
  return {
    text: blocks.map((b) => b.text).join(" "),
    startTime: blocks[0].start,
    endTime: blocks[blocks.length - 1].end,
  };
}