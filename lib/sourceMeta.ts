export type SourceMeta = {
  module: string;
  title: string;
};

export function parseSourcePath(relativePath: string): SourceMeta {
  const parts = relativePath.split(/[\\/]/).filter(Boolean);

  const moduleSegment = parts[0] ?? "";
  const moduleMatch = moduleSegment.match(/module\s*(\d+)/i);
  const module = moduleMatch ? `Module ${moduleMatch[1]}` : moduleSegment || "Unknown module";

  const rawTitle = parts.length > 1 ? parts[parts.length - 2] : (parts[0] ?? relativePath);

  const title = rawTitle
    .replace(/\.srt$/i, "")
    .replace(/_epm$/i, "")
    .replace(/^\d+[.\-]\s*/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { module, title: title || rawTitle };
}