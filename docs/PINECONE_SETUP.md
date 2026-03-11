# Pinecone RAG Setup for LegalMind

When configured, LegalMind uses **Pinecone** as the vector store and **OpenAI** for embeddings and chat so answers are grounded in your uploaded PDFs.

---

## Prerequisites

- **S3 uploads enabled** (see [AWS_S3_SETUP.md](./AWS_S3_SETUP.md)). Pinecone indexing runs only for documents uploaded to S3 (the backend fetches the PDF from S3, extracts text, chunks, embeds, and upserts to Pinecone).
- **OpenAI API key** for embeddings (`text-embedding-3-small`) and chat (`gpt-4o-mini`).
- **Pinecone API key** and an index.

---

## 1. Create a Pinecone index

1. Go to [pinecone.io](https://www.pinecone.io/) and sign up or log in.
2. Create an index:
   - **Name:** e.g. `legalmind`
   - **Dimension:** `1536` (for OpenAI `text-embedding-3-small`)
   - **Metric:** Cosine (default)
   - Use **Serverless** (free tier available).
3. Copy your **API key** from the Pinecone console.
4. Note the **index name** (e.g. `legalmind`). If you use a serverless index, the SDK will use the index name; for some setups you may need the index **host** from the console and set `PINECONE_INDEX_HOST` (see below).

---

## 2. Get an OpenAI API key (optional – see “Without OpenAI billing” below)

1. Go to [platform.openai.com](https://platform.openai.com/) → API keys.
2. Create a key and copy it. You will use it for:
   - Embeddings (indexing and query)
   - Chat completions (grounded answers)

### OpenAI billing enable karna (agar key hai lekin billing error aaye)

1. [platform.openai.com](https://platform.openai.com/) → **Settings** → **Billing** (ya **Organization** → **Billing**).
2. **Add payment method** pe click karein aur card add karein.
3. **Prepaid:** “Add to balance” se kam se kam $5 credits lein (API use inhi se charge hota hai).
4. Credits khatam hone par phir se “Add to balance” se credits add karein.

Billing set nahi hone tak API calls fail hoti hain; billing enable karke phir se try karein.

---

## 3. Backend environment variables

In the backend `.env`:

```env
# Required for RAG
PINECONE_API_KEY=your-pinecone-api-key
OPENAI_API_KEY=sk-...

# Optional; default index name is "legalmind"
PINECONE_INDEX=legalmind
```

If your Pinecone SDK or deployment requires the index host URL (e.g. for some serverless setups), add:

```env
PINECONE_INDEX_HOST=https://legalmind-xxxxx.svc.region.pinecone.io
```

(Check the Pinecone console for the exact host.)

---

## 4. Flow

1. **Upload (S3):** User uploads a PDF → file goes to S3 → client calls `POST /api/documents/:id/confirm-upload`.
2. **Indexing:** Backend fetches the PDF from S3, extracts text (pdf-parse), chunks it, gets embeddings (OpenAI), and upserts vectors into Pinecone (namespace `documents`). Document status goes from `indexing` to `ready` (or `failed` on error).
3. **Chat:** User asks a question → backend embeds the query, queries Pinecone for top-K chunks, then streams an answer from OpenAI with that context (system prompt + retrieved chunks + user question).

---

## 5. Cost notes

- **Pinecone:** Free tier usually includes one serverless index and limited usage; check [Pinecone pricing](https://www.pinecone.io/pricing/).
- **OpenAI:** You pay for embeddings and chat (e.g. `text-embedding-3-small`, `gpt-4o-mini`). Usage depends on document count and chat volume.

Without these env vars, the app still runs: uploads work (local or S3), and chat returns a stub message suggesting you configure Pinecone + OpenAI for RAG.

---

## 6. Bina OpenAI billing ke: Ollama (local, free)

Agar aap **OpenAI pe billing nahi karna chahte**, to **Ollama** use karke local (free) RAG chala sakte hain.

### Steps

1. **Ollama install karein** (same machine ya network par): [ollama.com](https://ollama.com) → download & install.
2. **Models pull karein:**
   ```bash
   ollama pull nomic-embed-text   # embeddings (768 dimensions)
   ollama pull llama3.2           # chat (ya llama3 / mistral)
   ```
3. **Pinecone index** alag banao **dimension 768** ke saath (Ollama embeddings ke liye):
   - Name: e.g. `legalmind-ollama`
   - Dimension: **768**
   - Metric: Cosine, Serverless.
4. **Backend `.env`** – OpenAI *na* daalein, sirf ye add karein:
   ```env
   PINECONE_API_KEY=...
   PINECONE_INDEX=legalmind-ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_EMBED_MODEL=nomic-embed-text
   OLLAMA_CHAT_MODEL=llama3.2
   ```
5. Backend restart karein. Ab indexing aur chat **Ollama** se chalenge, **OpenAI billing ki zaroorat nahi**.

**Note:** Ollama aapki machine par chal raha hona chahiye (e.g. `http://localhost:11434`). Agar backend kisi aur server par hai to `OLLAMA_BASE_URL` ko us server ka Ollama URL do.

---

## 7. OpenRouter se free model (bina OpenAI billing)

**OpenRouter** pe aap **free chat** use kar sakte hain. Embeddings ke liye OpenRouter par dedicated free option nahi; same Pinecone index (1536 dimension) chalega, embeddings ke liye koi supported model (e.g. `openai/text-embedding-3-small`) set karein.

### Latest OpenRouter models (nikal kar use karne ke liye)

**Chat (free) – koi bhi ek set karein:**

| Model ID | Context | Notes |
|----------|---------|--------|
| `openrouter/free` | auto | Router – automatically picks a free model (recommended). |
| `stepfun/step-3.5-flash:free` | 256K | Reasoning, fast. |
| `arcee-ai/trinity-large-preview:free` | 131K | Strong all-round, Legal use case friendly. |
| `meta-llama/llama-3.3-70b-instruct:free` | 128K | Multilingual chat. |
| `qwen/qwen3-next-80b-a3b-instruct:free` | 262K | Good for RAG, tool use. |
| `google/gemma-3-27b-it:free` | 131K | Vision + text. |

**Embeddings (1536 dim – free dedicated nahi, paid/credits):**

| Model ID | Dimension | Notes |
|----------|-----------|--------|
| `openai/text-embedding-3-small` | 1536 | Default; same index as OpenAI. |
| `openai/text-embedding-3-large` | 3072 | Alag index chahiye (3072 dim). |

Full list: [OpenRouter Models – Embeddings](https://openrouter.ai/models?output_modalities=embeddings).

### Steps

1. **OpenRouter account:** [openrouter.ai](https://openrouter.ai) → sign up → **Keys** se API key banao (free tier for chat).
2. **Pinecone index** dimension **1536** (e.g. name `legalmind`).
3. **Backend `.env`** – OpenAI *na* daalein, sirf ye add karein:
   ```env
   PINECONE_API_KEY=...
   PINECONE_INDEX=legalmind
   OPENROUTER_API_KEY=sk-or-v1-...
   OPENROUTER_CHAT_MODEL=openrouter/free
   OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
   ```
   Chat ke liye upar wale table se koi bhi free chat model ID daal sakte ho (`OPENROUTER_CHAT_MODEL`). Embed ke liye 1536-dim model use karein.
4. Backend restart karein.

**Summary:** OpenRouter API key + free chat model = free chat. Embeddings ke liye OpenRouter pe supported embed model (e.g. `openai/text-embedding-3-small`) set karein; dedicated free embed option OpenRouter pe abhi nahi hai.

---

## Vector status (SSE + webhook)

Jab document indexing **ready** ya **failed** ho jata hai, backend UI ko turant bata sakta hai (polling ki zaroorat kam).

- **SSE stream:** Frontend Documents page `GET /api/documents/status-stream` se connect karti hai. Jab koi document ready/failed hota hai, server `document_indexed` event bhejta hai; client document list invalidate karke refresh kar leta hai.
- **Optional webhook:** Agar `VECTOR_STATUS_WEBHOOK_URL` backend `.env` mein set hai, toh har ready/failed par backend us URL par **POST** karega (JSON: `{ documentId, status, at }`). Use apne dashboard ya logging ke liye kar sakte ho.
