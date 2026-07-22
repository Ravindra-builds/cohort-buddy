import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "../ai/provider";

const rewriteSchema = z.object({
  rewrittenQuery: z.string(),
});

const SYSTEM_PROMPT = `You rewrite user questions into standalone, retrieval-friendly search queries for a vector search over class lecture subtitles.

Rules:
- Resolve pronouns and vague references.
- Expand obvious abbreviations.
- Keep it concise and keyword-rich, focused on the core concept.
- Do not answer the question — only rewrite it as a search query.`;

export async function rewriteQuery(question: string): Promise<string> {
  const { object } = await generateObject({
    model: getChatModel("small"),
    schema: rewriteSchema,
    system: SYSTEM_PROMPT,
    prompt: question,
  });

  return object.rewrittenQuery;
}