# Class Subtitle RAG — Implementation Plan

---

## 1. Tech stack (finalized)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Vector DB | Qdrant Cloud (free tier) |
| LLM + embedding calls | Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`) |
| Provider flexibility | Env-var driven factory — swap OpenAI/Gemini per model call |
| Document loading/chunking (ingestion only) | LangChain (`SRTLoader`, `DirectoryLoader`, `RecursiveCharacterTextSplitter`) |
| Vector upsert/search | Raw `@qdrant/js-client-rest` (not LangChain's vectorstore wrapper) |
| Validation (guardrails) | Zod schemas via AI SDK's `generateObject` |
| Frontend components | shadcn/ui |
| Auth | Clerk — frontend/later, not part of this build pass |

### Why raw Qdrant client instead of `@langchain/qdrant`
LangChain's vectorstore wrapper assumes one embeddings instance baked in at construction
time. Since embeddings can come from either OpenAI or Gemini depending on env config,
it's cleaner to embed via the AI SDK's `embed()` directly and upsert/search with the raw
Qdrant REST client. LangChain is still used narrowly for loading and splitting `.srt`
files during ingestion — that part doesn't care about providers.

---

## 2. Provider abstraction

Two independent env-driven switches:

- `LLM_PROVIDER` — controls guardrail model, query-rewriter model, and main answer
  model. Freely swappable, no data implications.
- `EMBEDDING_PROVIDER` — controls the embedding model for ingestion AND query time.
  **Not freely swappable** — OpenAI and Gemini embeddings live in different vector
  spaces. Changing this requires re-ingesting into a differently named collection.

```env
# .env.local
LLM_PROVIDER=openai              # or "gemini"
EMBEDDING_PROVIDER=openai        # keep fixed unless re-ingesting

OPENAI_API_KEY=
OPENAI_MAIN_MODEL=gpt-4o-mini
OPENAI_SMALL_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_MAIN_MODEL=gemini-1.5-flash
GEMINI_SMALL_MODEL=gemini-1.5-flash-8b
GEMINI_EMBEDDING_MODEL=text-embedding-004

QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=class-subtitles-openai   # name includes embedding provider
```

`lib/ai/provider.ts` exposes:
- `getChatModel(tier: "small" | "main")` → AI SDK `LanguageModel` from whichever
  provider `LLM_PROVIDER` points to. "small" = guardrails + rewriting (cheap, fast).
  "main" = final answer.
- `getEmbeddingModel()` → AI SDK embedding model from `EMBEDDING_PROVIDER`.

Every other file calls these two functions instead of importing `@ai-sdk/openai` or
`@ai-sdk/google` directly.

---

## 3. Request pipeline (`/api/chat`)

Receive { question } from client
INPUT GUARDRAIL (small model, generateObject + zod)
→ classify: on-topic / safe / not a prompt-injection attempt
→ if rejected: return polite refusal immediately, skip everything below
QUERY REWRITE / STEP-BACK (small model, generateObject + zod)
→ rewrite raw question into a decontextualized, retrieval-friendly query
EMBED rewritten query (embedding model per EMBEDDING_PROVIDER)
RETRIEVE top-k chunks from Qdrant (raw client, vector search)
BUILD final prompt: system instructions (grounding rules) + retrieved chunks +
original question
GENERATE answer (main model, streamText) → stream to client
Render citations client-side from each chunk's payload.source, deduped

Output guardrail: not a blocking step in v1 — a blocking check means buffering the full
answer before streaming, which kills token-by-token UX. Grounding is enforced via the
system prompt instead ("only answer from context, say you don't know otherwise"). A
non-blocking logging-only check is a documented v2 item.

---

## 4. Folder structure

cohort-buddy/
├── data/
│ └── subtitles/ # cleaned .srt files, committed to repo
├── scripts/
│ └── ingest.ts # one-off script, run manually via npx tsx
├── lib/
│ ├── ai/
│ │ └── provider.ts # getChatModel(), getEmbeddingModel()
│ ├── guardrails/
│ │ ├── inputGuardrail.ts # zod schema + generateObject
│ │ └── queryRewriter.ts # step-back / rewrite, zod schema + generateObject
│ ├── qdrant.ts # raw client setup, upsert + search helpers
│ └── retriever.ts # embed query -> qdrant search -> chunks
├── app/
│ ├── api/chat/route.ts # orchestrates the pipeline above
│ └── page.tsx # shadcn-based chat UI
├── components/ui/ # shadcn components after npx shadcn init
├── .env.local
├── .env.example
└── package.json

---

## 5. Install commands

```bash
npm install ai @ai-sdk/openai @ai-sdk/google zod
npm install langchain @langchain/core @langchain/community
npm install @qdrant/js-client-rest
npm install -D tsx

npx shadcn@latest init
npx shadcn@latest add button input card scroll-area
```

(Clerk deferred — add `@clerk/nextjs` when you get to auth.)

---

## 6. Status

### Done
- [x] Subtitles cleaned (no `.vtt` duplicates, no macOS metadata)
- [x] Next.js project initialized

### Not done (build now)
- [ ] `lib/ai/provider.ts`
- [ ] `lib/qdrant.ts`
- [ ] `lib/guardrails/inputGuardrail.ts`
- [ ] `lib/guardrails/queryRewriter.ts`
- [ ] `scripts/ingest.ts`
- [ ] `lib/retriever.ts`
- [ ] `app/api/chat/route.ts`
- [ ] `app/page.tsx`
- [ ] Deploy to Vercel, set env vars

### Deferred (v2)
- [ ] Upload UI + ZIP extraction inside the app
- [ ] Clerk auth
- [ ] Blocking output guardrail
- [ ] Qdrant free-tier inactivity/reconnect handling
- [ ] Multi-collection support for switching `EMBEDDING_PROVIDER`
- [ ] Rate limiting on `/api/chat`

---

## 7. Open decisions to revisit

- chunkSize/chunkOverlap: 750/75, untuned
- top-k retrieval: k=4, untuned
- output guardrail: logging-only vs. fully blocking — deferred to v2
- step-back prompting: start with one rewritten query, add a second "general" version
  only if recall looks weak in testing