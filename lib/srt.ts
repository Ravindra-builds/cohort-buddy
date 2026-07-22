import fs from "node:fs";
import path from "node:path";

export type SrtBlock = {
  start: string;
  end: string;
  text: string;
};

export type SubtitleFile = {
  source: string;
  blocks: SrtBlock[];
};

function walkSrtFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkSrtFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".srt")) {
      files.push(fullPath);
    }
  }
  return files;
}

const TIMESTAMP_RE = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;

function parseSrtBlocks(raw: string): SrtBlock[] {
  const rawBlocks = raw.replace(/\r/g, "").split(/\n\n+/);
  const blocks: SrtBlock[] = [];

  for (const rawBlock of rawBlocks) {
    const lines = rawBlock.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;

    const tsLineIndex = lines.findIndex((l) => TIMESTAMP_RE.test(l));
    if (tsLineIndex === -1) continue;

    const match = lines[tsLineIndex].match(TIMESTAMP_RE);
    if (!match) continue;

    const text = lines.slice(tsLineIndex + 1).join(" ").trim();
    if (!text) continue;

    blocks.push({
      start: match[1].replace(",", "."),
      end: match[2].replace(",", "."),
      text,
    });
  }

  return blocks;
}

export function loadSubtitleFiles(subtitlesDir: string): SubtitleFile[] {
  const files = walkSrtFiles(subtitlesDir);
  return files.map((filePath) => ({
    source: path.relative(subtitlesDir, filePath),
    blocks: parseSrtBlocks(fs.readFileSync(filePath, "utf-8")),
  }));
}