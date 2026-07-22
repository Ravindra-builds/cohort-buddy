# Cohort Buddy 🎓🤖

A Retrieval-Augmented Generation (RAG) chatbot that answers student questions **strictly from your class lecture transcripts**. Built on Next.js App Router, it ingests `.srt` subtitle files from your course, embeds them into a vector database, and answers questions with grounded citations (module + lecture title + timestamp) — refusing to hallucinate or answer from outside knowledge.

---

## ✨ Features

- **Grounded Q&A** — Answers are generated only from retrieved lecture transcript chunks. If it's not covered in the lectures, the bot says so instead of guessing.
- **Timestamped citations** — Every answer links back to the exact module, lecture title, and time range it came from.
- **Input guardrails** — A lightweight LLM-based filter blocks off-topic questions, prompt-injection attempts, and harmful requests before any retrieval happens.
- **Query rewriting** — Raw user questions are rewritten into decontextualized, retrieval-friendly search queries before embedding.
- **Provider-agnostic LLM layer** — Swap between OpenAI and Gemini for chat completions via a single environment variable, with independent "small" (guardrail/rewrite) and "main" (answer) model tiers.
- **Vector search via Qdrant** — Fast, cloud-hosted semantic search over chunked lecture subtitles.
- **Streaming chat UI** — Built with `ai-sdk/react`, `streamdown`, and shadcn/ui components for a polished, real-time chat experience with source citations.
- **Auth-ready** — Clerk middleware wired in to protect routes (sign-in/sign-up flows included).
- **Simple ingestion pipeline** — A single script parses, chunks, embeds, and upserts all `.srt` files into your vector collection.

---

## 🧱 Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Vector DB | Qdrant Cloud (or self-hosted) |
| LLM + Embeddings | Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`) |
| Guardrails / Rewriting | Zod-validated structured output (`generateObject`) |
| Frontend | shadcn/ui, Tailwind CSS, Streamdown (markdown/code/math rendering) |
| Auth | Clerk |
| Package manager | npm / bun (both supported) |

---

## 🏗️ Architecture / Request Pipeline

```text
User
  │
  ▼
POST /api/chat
  │
  ▼
Input Guardrail
(Small Model + Zod)
  │
  ├── ❌ Reject → Polite Refusal
  │
  └── ✅ Approve
         │
         ▼
Query Rewrite
(Small Model)
         │
         ▼
Embedding Model
         │
         ▼
Qdrant Vector Search
(Top-K Retrieval)
         │
         ▼
Prompt Builder
├─ System Instructions
├─ Retrieved Chunks
└─ Chat History
         │
         ▼
Main LLM (streamText)
         │
         ▼
Streaming Response
         │
         ▼
Client
├─ Render Answer
└─ Deduplicate Citations
```

The **output is not blocked/re-checked** post-generation (streaming would otherwise have to buffer). Grounding is enforced entirely through the system prompt instructing the model to answer only from provided context.

---

## 📁 Project Structure

```text

cohort-buddy/
├── app/
│ ├── api/chat/route.ts # Orchestrates the full RAG pipeline
│ ├── sign-in/[...sign-in]/ # Clerk sign-in page
│ ├── sign-up/[...sign-up]/ # Clerk sign-up page
│ ├── layout.tsx # Root layout (Clerk provider, theme provider)
│ ├── page.tsx # Main chat UI
│ └── globals.css
├── components/
│ ├── ai-elements/ # Chat UI primitives (conversation, message, sources, prompt input)
│ ├── providers/ # Theme provider
│ ├── ui/ # shadcn/ui components
│ └── mode-toggle.tsx # Dark/light mode switch
├── data/
│ └── subtitles/ # Cleaned .srt lecture transcript files (organized by module)
├── lib/
│ ├── ai/
│ │ ├── provider.ts # getChatModel() — provider-agnostic model factory
│ │ └── embeddings.ts # Embedding model config
│ ├── guardrails/
│ │ ├── inputGuardrail.ts # On-topic / safety classifier
│ │ └── queryRewriter.ts # Standalone query rewriting
│ ├── chunker.ts # Groups subtitle blocks into ~800-char chunks
│ ├── formatTimestamp.ts # SRT timestamp → mm:ss formatting
│ ├── qdrant.ts # Raw Qdrant client, collection + upsert/search helpers
│ ├── retriever.ts # Embed query → Qdrant search → ranked chunks
│ ├── sourceMeta.ts # Parses module/lecture title from file paths
│ ├── srt.ts # .srt file loader/parser
│ └── utils.ts
├── scripts/
│ └── ingest.ts # One-off ingestion: parse → chunk → embed → upsert
├── proxy.ts # Clerk middleware (route protection)
├── .sample.env # Environment variable template
└── package.json
```
---

## ⚙️ Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/Ravindra-builds/cohort-buddy
cd cohort-buddy
npm install
# or
bun install
```

### 2. Configure environment variables

Copy the sample env file and fill in your keys:

```bash
cp .sample.env .env.local
```

```env
LLM_PROVIDER=openai              # or "gemini"
EMBEDDING_PROVIDER=openai        # keep fixed unless you plan to re-ingest

OPENAI_API_KEY=sk-....
OPENAI_MAIN_MODEL=gpt-4o-mini
OPENAI_SMALL_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

GOOGLE_GENERATIVE_AI_API_KEY=AQ......
GEMINI_MAIN_MODEL=gemini-1.5-flash
GEMINI_SMALL_MODEL=gemini-1.5-flash-8b

QDRANT_URL=https://your-cluster-url.qdrant.io
QDRANT_API_KEY=....
QDRANT_COLLECTION_NAME=cohort-subtitles

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

> ⚠️ **Important:** `EMBEDDING_PROVIDER` is **not** freely swappable at runtime. OpenAI and Gemini embeddings live in different vector spaces — changing this after ingestion requires re-ingesting into a new collection (rename `QDRANT_COLLECTION_NAME` accordingly).

### 3. Add your lecture subtitles

Drop your `.srt` transcript files into `data/subtitles/`, organized by module folder (e.g. `data/subtitles/module 1/lecture-name/lecture-name.srt`). The ingestion script recursively parses paths to infer module numbers and lecture titles.

### 4. Ingest subtitles into Qdrant

```bash
npm run ingest
```

This will:
1. Recursively load all `.srt` files from `data/subtitles/`
2. Parse timed subtitle blocks and merge them into ~800-character chunks
3. Embed each chunk via your configured embedding provider
4. Create (or reuse) the Qdrant collection and upsert all chunks with metadata (`text`, `source`, `startTime`, `endTime`)

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start asking questions about your course.

---

## 🔌 Provider Abstraction

`lib/ai/provider.ts` exposes a single factory function:

```ts
getChatModel(tier: "small" | "main")
```

- **`"small"`** — used for the input guardrail and query rewriter (cheap, fast, structured-output calls)
- **`"main"`** — used for the final streamed answer

Both tiers resolve to either OpenAI or Google Gemini models depending on `LLM_PROVIDER`, so you can switch providers globally with a single env var change — no code edits required.

---

## 🛡️ Guardrails

- **Input guardrail** (`lib/guardrails/inputGuardrail.ts`): classifies whether a question is safe and on-topic before any retrieval work happens. Off-topic, harmful, or prompt-injection attempts get a polite refusal instead of being processed further.
- **Query rewriter** (`lib/guardrails/queryRewriter.ts`): rewrites the user's raw question into a clearer, standalone search query — resolving pronouns, expanding context — before it's embedded and searched against the vector store.

Both use `generateObject` with Zod schemas for reliable, typed structured outputs.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run ingest` | Parse, chunk, embed, and upsert all subtitle files into Qdrant |
| `npm run lint` | Run ESLint |

---
