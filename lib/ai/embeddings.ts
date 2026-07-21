import { openai } from "@ai-sdk/openai";

// Fixed on purpose: embedding vectors from different providers are not
// compatible with each other. Do not make this configurable.
export const EMBEDDING_MODEL_NAME =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export const embeddingModel = openai.embedding(EMBEDDING_MODEL_NAME);