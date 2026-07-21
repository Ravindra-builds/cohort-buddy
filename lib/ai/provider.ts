import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export type ModelTier = "small" | "main";

function currentProvider() {
  return (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
}

/** Used for input guardrail, query rewriting, and the final answer.
 *  Swap providers at any time via LLM_PROVIDER env var — no data implications. */
export function getChatModel(tier: ModelTier = "main"): LanguageModel {
  const p = currentProvider();

  if (p === "gemini" || p === "google") {
    const model =
      tier === "small"
        ? process.env.GEMINI_SMALL_MODEL ?? "gemini-1.5-flash-8b"
        : process.env.GEMINI_MAIN_MODEL ?? "gemini-1.5-flash";
    return google(model);
  }

  const model =
    tier === "small"
      ? process.env.OPENAI_SMALL_MODEL ?? "gpt-4o-mini"
      : process.env.OPENAI_MAIN_MODEL ?? "gpt-4o-mini";
  return openai(model);
}