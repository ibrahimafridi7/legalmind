/**
 * Pinecone RAG: index PDF chunks and query for grounded chat.
 * Supports: OpenAI (paid), Ollama (local, free), or OpenRouter (free chat via openrouter/free).
 */

import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import type { S3Client } from '@aws-sdk/client-s3'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL?.replace(/\/$/, '') ?? ''
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text'
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
// Chat: openrouter/free (auto free) or e.g. stepfun/step-3.5-flash:free, meta-llama/llama-3.3-70b-instruct:free
const OPENROUTER_CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL ?? 'openrouter/free'
// Embed: 1536 dim. OpenRouter has no dedicated free embed; use openai/text-embedding-3-small or another from openrouter.ai/models?output_modalities=embeddings
const OPENROUTER_EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL ?? 'openai/text-embedding-3-small'
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const PINECONE_API_KEY = process.env.PINECONE_API_KEY
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX ?? 'legalmind'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100
const TOP_K = 5
const NAMESPACE = 'documents'

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null
const pinecone =
  PINECONE_API_KEY ?
    new Pinecone({ apiKey: PINECONE_API_KEY })
  : null

const useOllama = Boolean(OLLAMA_BASE_URL)
const useOpenRouter = Boolean(OPENROUTER_API_KEY)
export const usePinecone = Boolean(
  PINECONE_API_KEY &&
    pinecone &&
    (OPENAI_API_KEY || useOllama || useOpenRouter)
)

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return chunks
  while (start < cleaned.length) {
    let end = Math.min(start + CHUNK_SIZE, cleaned.length)
    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(' ', end)
      if (lastSpace > start) end = lastSpace
    }
    chunks.push(cleaned.slice(start, end).trim())
    start = end - (end - start > CHUNK_OVERLAP ? CHUNK_OVERLAP : 0)
    if (start >= cleaned.length) break
  }
  return chunks.filter(Boolean)
}

async function embedOllama(texts: string[]): Promise<number[][]> {
  if (!OLLAMA_BASE_URL || texts.length === 0) return []
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: texts })
  })
  if (!res.ok) throw new Error(`Ollama embed: ${res.status}`)
  const data = (await res.json()) as { embeddings?: number[][] }
  return data.embeddings ?? []
}

async function embedOpenRouter(texts: string[]): Promise<number[][]> {
  if (!OPENROUTER_API_KEY || texts.length === 0) return []
  const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({ model: OPENROUTER_EMBED_MODEL, input: texts })
  })
  const body = (await res.json()) as {
    data?: Array<{ embedding?: number[] }>
    error?: { message?: string }
    message?: string
  }
  if (!res.ok) {
    const msg = (body?.error?.message ?? (typeof body?.message === 'string' ? body.message : undefined)) ?? res.statusText
    throw new Error(`OpenRouter embed: ${res.status} ${msg}`.trim())
  }
  const list = body.data ?? []
  return list.map((d) => {
    const emb = d.embedding
    if (!Array.isArray(emb)) throw new Error(`OpenRouter embed: unexpected shape for model ${OPENROUTER_EMBED_MODEL}`)
    return emb
  })
}

async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  if (openai) {
    const { data } = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts
    })
    return data
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
      .map((d: { embedding: number[] }) => d.embedding)
  }
  if (useOpenRouter) return embedOpenRouter(texts)
  if (useOllama) return embedOllama(texts)
  return []
}

export async function indexDocumentFromS3(
  documentId: string,
  docName: string,
  s3Key: string,
  s3Client: S3Client,
  bucket: string,
  onStatus?: (status: 'indexing' | 'ready' | 'failed', errorMessage?: string) => void
): Promise<void> {
  if (!pinecone || (!openai && !useOllama && !useOpenRouter)) {
    onStatus?.('ready')
    return
  }
  try {
    const { Body } = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: s3Key })
    )
    if (!Body) throw new Error('Empty S3 body')
    const buffer = await streamToBuffer(Body as NodeJS.ReadableStream)

    const pdfParse = (await import('pdf-parse')).default
    const pages: string[] = []
    let result: { text: string; numpages?: number }
    try {
      result = await pdfParse(buffer, {
        pagerender: (pageData: { getTextContent: (opts?: unknown) => Promise<{ items: Array<{ str?: string }> }> }) => {
          return pageData.getTextContent().then((content) => {
            const text = (content.items ?? []).map((item) => item.str ?? '').join(' ')
            pages.push(text)
            return text
          })
        }
      })
    } catch {
      result = await pdfParse(buffer)
    }
    const numpages = result.numpages ?? Math.max(1, pages.length)
    if (pages.length === 0 && result.text?.trim()) {
      pages.push(result.text)
    }
    if (pages.length === 0 || !pages.some((p) => p?.trim())) {
      onStatus?.('ready')
      return
    }

    type ChunkWithMeta = { text: string; pageNumber: number; paragraphIndex: number }
    const chunksWithMeta: ChunkWithMeta[] = []
    for (let p = 0; p < pages.length; p++) {
      const pageChunks = chunkText(pages[p]!)
      pageChunks.forEach((text, j) => {
        chunksWithMeta.push({ text, pageNumber: p + 1, paragraphIndex: j })
      })
    }
    if (chunksWithMeta.length === 0) {
      onStatus?.('ready')
      return
    }

    const texts = chunksWithMeta.map((c) => c.text)
    const vectors = await embed(texts)
    const createdAt = new Date().toISOString()
    const index = pinecone.index(PINECONE_INDEX_NAME)
    const ns = index.namespace(NAMESPACE)
    await ns.upsert(
      vectors.map((values, i) => {
        const c = chunksWithMeta[i]!
        return {
          id: `${documentId}_${i}`,
          values,
          metadata: {
            documentId,
            docName: docName.slice(0, 500),
            s3Key: s3Key.slice(0, 1024),
            chunkIndex: i,
            pageNumber: c.pageNumber,
            paragraphIndex: c.paragraphIndex,
            text: c.text.slice(0, 1000),
            createdAt
          }
        }
      })
    )
    onStatus?.('ready')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[pinecone] index error:', documentId, msg, err)
    onStatus?.('failed', msg)
  }
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

export type RetrievedChunk = {
  documentId: string
  docName: string
  text: string
  score?: number
  pageNumber?: number
  paragraphIndex?: number
  createdAt?: string
}

export async function queryPinecone(query: string): Promise<RetrievedChunk[]> {
  if (!pinecone || (!openai && !useOllama && !useOpenRouter)) return []
  const [embedding] = await embed([query])
  if (!embedding?.length) return []
  const index = pinecone.index(PINECONE_INDEX_NAME)
  const ns = index.namespace(NAMESPACE)
  const result = await ns.query({
    vector: embedding,
    topK: TOP_K,
    includeMetadata: true
  })
  type Match = {
    metadata?: {
      text?: unknown
      documentId?: unknown
      docName?: unknown
      s3Key?: unknown
      pageNumber?: unknown
      paragraphIndex?: unknown
      createdAt?: unknown
    }
    score?: number
  }
  const matches = (result.matches ?? []) as Match[]
  return matches
    .filter((m: Match) => m.metadata?.text && m.metadata?.documentId)
    .map((m: Match) => {
      const meta = m.metadata!
      return {
        documentId: String(meta.documentId),
        docName: String(meta.docName ?? ''),
        text: String(meta.text),
        score: m.score,
        pageNumber: typeof meta.pageNumber === 'number' ? meta.pageNumber : undefined,
        paragraphIndex: typeof meta.paragraphIndex === 'number' ? meta.paragraphIndex : undefined,
        createdAt: typeof meta.createdAt === 'string' ? meta.createdAt : undefined
      }
    })
}

/** Fetch document metadata from Pinecone (docName, s3Key) for pdf-url when not in app memory. */
export async function getDocumentMetadata(
  documentId: string
): Promise<{ docName: string; s3Key?: string } | null> {
  if (!pinecone || (!openai && !useOllama && !useOpenRouter)) return null
  const [embedding] = await embed([''])
  if (!embedding?.length) return null
  const index = pinecone.index(PINECONE_INDEX_NAME)
  const ns = index.namespace(NAMESPACE)
  const result = await ns.query({
    vector: embedding,
    topK: 1,
    includeMetadata: true,
    filter: { documentId: { $eq: documentId } }
  })
  const match = result.matches?.[0] as
    | { metadata?: { docName?: unknown; s3Key?: unknown } }
    | undefined
  const meta = match?.metadata
  if (!meta) return null
  const docName = typeof meta.docName === 'string' ? meta.docName : ''
  const s3Key = typeof meta.s3Key === 'string' && meta.s3Key ? meta.s3Key : undefined
  return { docName, s3Key }
}

export async function streamGroundedAnswer(
  query: string,
  onChunk: (text: string) => void,
  onCitations?: (chunks: RetrievedChunk[]) => void
): Promise<void> {
  const chunks = await queryPinecone(query)
  onCitations?.(chunks)
  const context =
    chunks.length > 0
      ? chunks.map((c) => `[${c.docName}]\n${c.text}`).join('\n\n---\n\n')
      : 'No relevant documents found.'

  const systemPrompt = `You are a legal research assistant. Answer the user's question using ONLY the following context from their uploaded documents. If the context does not contain enough information, say so. Cite the document name when relevant.\n\nContext:\n${context}`

  if (useOpenRouter) {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENROUTER_CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        stream: true
      })
    })
    if (!res.ok) throw new Error(`OpenRouter chat: ${res.status}`)
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No body')
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const json = line.slice(6).trim()
        if (json === '[DONE]') continue
        try {
          const o = JSON.parse(json) as { choices?: Array<{ delta?: { content?: string } }> }
          const delta = o.choices?.[0]?.delta?.content
          if (delta) onChunk(delta)
        } catch {
          // skip
        }
      }
    }
    return
  }

  if (useOllama && !openai) {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        stream: true
      })
    })
    if (!res.ok) throw new Error(`Ollama chat: ${res.status}`)
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No body')
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const json = line.slice(6).trim()
        if (json === '[DONE]') continue
        try {
          const o = JSON.parse(json) as { message?: { content?: string } }
          if (o.message?.content) onChunk(o.message.content)
        } catch {
          // skip
        }
      }
    }
    return
  }

  if (!openai) {
    const stub = `Based on your documents:\n\n${context.slice(0, 500)}…\n\n(Set OPENAI_API_KEY, OPENROUTER_API_KEY, or OLLAMA_BASE_URL for full RAG.)`
    for (const t of stub.split(/(?<= )/)) onChunk(t)
    return
  }

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ],
    stream: true
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) onChunk(delta)
  }
}
