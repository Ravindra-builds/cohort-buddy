import fs from "node:fs";
import path from "node:path";

export type LoadedSubtitle = {
  text: string;
  source: string; // relative path, used for citations
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

/** Strips index numbers and timestamp lines, joins the spoken text. */
function parseSrt(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (/^\d+$/.test(trimmed)) continue; // block index
    if (/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(trimmed)) continue; // timestamp
    textLines.push(trimmed);
  }

  return textLines.join(" ");
}

export function loadSubtitles(subtitlesDir: string): LoadedSubtitle[] {
  const files = walkSrtFiles(subtitlesDir);

  return files.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf-8");
    return {
      text: parseSrt(raw),
      source: path.relative(subtitlesDir, filePath),
    };
  });
}