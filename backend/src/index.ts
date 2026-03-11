import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  usePinecone,
  indexDocumentFromS3,
  streamGroundedAnswer,
  type RetrievedChunk
} from './pinecone.js'

type Role = 'admin' | 'partner' | 'associate' | 'paralegal' | 'guest'

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE
const useAuth0 = Boolean(AUTH0_DOMAIN && AUTH0_AUDIENCE)

const USE_S3 =
  process.env.USE_S3 === 'true' &&
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET
const s3Client = USE_S3
  ? new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
  : null
const S3_BUCKET = process.env.S3_BUCKET ?? ''

const jwks = useAuth0
  ? jwksClient({ jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`, cache: true })
  : null

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!header.kid || !jwks) return reject(new Error('no kid or jwks'))
    jwks.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err)
      resolve((key?.getPublicKey?.() ?? (key as { publicKey: string }).publicKey) as string)
    })
  })
}

async function validateAuth0Token(token: string): Promise<{ sub: string; email?: string; name?: string; role?: string }> {
  const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(
      token,
      (header, cb) => getSigningKey(header).then((key) => cb(null, key), cb),
      { audience: AUTH0_AUDIENCE, issuer: `https://${AUTH0_DOMAIN}/` },
      (err, decoded) => (err ? reject(err) : resolve(decoded as jwt.JwtPayload))
    )
  })
  const role = (decoded['https://legalmind.app/role'] ?? decoded.role ?? 'associate') as string
  return {
    sub: decoded.sub!,
    email: decoded.email ?? decoded['https://legalmind.app/email'],
    name: decoded.name ?? decoded['https://legalmind.app/name'],
    role: ['admin', 'partner', 'associate', 'paralegal', 'guest'].includes(role) ? role : 'associate'
  }
}

type DocumentRecord = {
  id: string
  name: string
  uploadedAt: string
  status: 'pending' | 'indexing' | 'ready' | 'failed'
  sizeBytes?: number
  /** Set when presigning for S3; used for Pinecone indexing */
  s3Key?: string
}

type AuditLog = {
  id: string
  at: string
  actorEmail: string
  action: string
  metadata?: Record<string, unknown>
}

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

// Health check (for Railway / load balancers)
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'legalmind-api' })
})
app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// --- Dev in-memory "DB" ---
const documents = new Map<string, DocumentRecord>()
const auditLogs: AuditLog[] = []
const uploadChunks = new Map<
  string,
  {
    totalChunks: number
    received: Map<number, Buffer>
    receivedBytes: number
  }
>()

// --- Vector status: notify UI (SSE) and optional outbound webhook ---
const statusStreamClients = new Set<express.Response>()
const VECTOR_STATUS_WEBHOOK_URL = process.env.VECTOR_STATUS_WEBHOOK_URL?.trim() || null

function broadcastDocumentStatus(documentId: string, status: 'ready' | 'failed') {
  const payload = { documentId, status, at: new Date().toISOString() }
  const sse = `event: document_indexed\ndata: ${JSON.stringify(payload)}\n\n`
  statusStreamClients.forEach((res) => {
    try {
      res.write(sse)
    } catch {
      statusStreamClients.delete(res)
    }
  })
  if (VECTOR_STATUS_WEBHOOK_URL) {
    fetch(VECTOR_STATUS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch((err) => console.warn('[webhook] vector status:', err?.message))
  }
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

function pushAudit(action: string, actorEmail = 'dev@legalmind.local', metadata?: Record<string, unknown>) {
  auditLogs.unshift({ id: id('audit'), at: new Date().toISOString(), actorEmail, action, metadata })
  if (auditLogs.length > 5000) auditLogs.length = 5000
}

// --- Auth ---
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (useAuth0 && token) {
    try {
      const claims = await validateAuth0Token(token)
      return res.json({
        id: claims.sub,
        name: claims.name ?? claims.email ?? 'User',
        email: claims.email ?? `${claims.sub}@auth0`,
        role: claims.role as Role
      })
    } catch (err) {
      console.warn('[auth/me] Token validation failed:', err instanceof Error ? err.message : err)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }

  if (useAuth0 && !token) {
    return res.status(401).json({ error: 'Authorization required' })
  }

  // Dev stub when Auth0 is not configured
  res.json({
    id: 'user_dev',
    name: 'Dev User',
    email: 'dev@legalmind.local',
    role: (process.env.DEV_ROLE as Role) ?? 'admin'
  })
})

// --- Documents ---
app.get('/api/documents', (_req, res) => {
  res.json(Array.from(documents.values()).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)))
})

// SSE stream for document indexing status (ready/failed). Clients subscribe to avoid polling.
app.get('/api/documents/status-stream', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
  statusStreamClients.add(res)
  res.on('close', () => statusStreamClients.delete(res))
  res.on('finish', () => statusStreamClients.delete(res))
})

app.post('/api/documents/presign', async (req, res) => {
  const schema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().positive().optional()
  })
  const body = schema.parse(req.body)

  const docId = id('doc')
  const record: DocumentRecord = {
    id: docId,
    name: body.filename,
    uploadedAt: new Date().toISOString(),
    status: 'pending',
    sizeBytes: body.sizeBytes
  }
  documents.set(docId, record)
  pushAudit('document.presign', undefined, { docId, filename: body.filename })

  if (s3Client && S3_BUCKET) {
    const key = `uploads/${docId}/${body.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    record.s3Key = key
    documents.set(docId, record)
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: body.contentType
    })
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 })
    return res.json({
      documentId: docId,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': body.contentType },
      uploadCompleteEndpoint: `/api/documents/${docId}/confirm-upload`
    })
  }

  res.json({
    documentId: docId,
    uploadUrl: `http://localhost:${process.env.PORT ?? 8787}/api/uploads/${docId}`,
    method: 'PUT' as const,
    headers: { 'Content-Type': body.contentType }
  })
})

app.post('/api/documents/:documentId/confirm-upload', (req, res) => {
  const { documentId } = req.params
  const doc = documents.get(documentId)
  if (!doc) return res.status(404).json({ error: 'document not found' })

  doc.status = 'indexing'
  documents.set(documentId, doc)
  pushAudit('document.uploaded.s3', undefined, { documentId })

  if (usePinecone && s3Client && S3_BUCKET && doc.s3Key) {
    indexDocumentFromS3(
      documentId,
      doc.name,
      doc.s3Key,
      s3Client,
      S3_BUCKET,
      (status, errorMessage) => {
        const current = documents.get(documentId)
        if (!current) return
        current.status = status
        documents.set(documentId, current)
        pushAudit('document.indexed', undefined, { documentId, status, ...(errorMessage && { error: errorMessage }) })
        if (status === 'ready' || status === 'failed') broadcastDocumentStatus(documentId, status)
      }
    )
  } else {
    setTimeout(() => {
      const current = documents.get(documentId)
      if (!current) return
      current.status = 'ready'
      documents.set(documentId, current)
      pushAudit('document.indexed', undefined, { documentId })
      broadcastDocumentStatus(documentId, 'ready')
    }, 2500)
  }

  res.status(200).json({ ok: true, status: 'indexing' })
})

// Local dev upload target for "presigned" URL. Accepts raw bytes.
app.put(
  '/api/uploads/:documentId',
  express.raw({ type: '*/*', limit: '250mb' }),
  (req, res) => {
    const { documentId } = req.params
    const doc = documents.get(documentId)
    if (!doc) return res.status(404).json({ error: 'document not found' })

    doc.status = 'indexing'
    documents.set(documentId, doc)
    pushAudit('document.uploaded', undefined, { documentId, bytes: (req.body as Buffer).byteLength })

    setTimeout(() => {
      const current = documents.get(documentId)
      if (!current) return
      current.status = 'ready'
      documents.set(documentId, current)
      pushAudit('document.indexed', undefined, { documentId })
      broadcastDocumentStatus(documentId, 'ready')
    }, 2500)

    res.status(200).end()
  }
)

// Chunk upload target for large files (dev). Accepts raw bytes per chunk.
// Client sends: ?chunkIndex=0&totalChunks=10
app.put(
  '/api/uploads/:documentId/chunk',
  express.raw({ type: '*/*', limit: '25mb' }),
  (req, res) => {
    const { documentId } = req.params
    const doc = documents.get(documentId)
    if (!doc) return res.status(404).json({ error: 'document not found' })

    const chunkIndex = Number(req.query.chunkIndex)
    const totalChunks = Number(req.query.totalChunks)
    if (!Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || totalChunks <= 0) {
      return res.status(400).json({ error: 'invalid chunkIndex/totalChunks' })
    }

    const buf = req.body as Buffer
    const state =
      uploadChunks.get(documentId) ??
      (() => {
        const s = { totalChunks, received: new Map<number, Buffer>(), receivedBytes: 0 }
        uploadChunks.set(documentId, s)
        return s
      })()

    if (state.totalChunks !== totalChunks) {
      return res.status(409).json({ error: 'totalChunks mismatch' })
    }

    if (!state.received.has(chunkIndex)) {
      state.received.set(chunkIndex, buf)
      state.receivedBytes += buf.byteLength
    }

    const receivedCount = state.received.size
    const done = receivedCount === totalChunks

    if (done) {
      uploadChunks.delete(documentId)
      doc.status = 'indexing'
      documents.set(documentId, doc)
      pushAudit('document.uploaded.chunked', undefined, { documentId, totalChunks, bytes: state.receivedBytes })

      setTimeout(() => {
        const current = documents.get(documentId)
        if (!current) return
        current.status = 'ready'
        documents.set(documentId, current)
        pushAudit('document.indexed', undefined, { documentId })
        broadcastDocumentStatus(documentId, 'ready')
      }, 2500)
    }

    res.json({
      documentId,
      receivedCount,
      totalChunks,
      done
    })
  }
)

app.get('/api/documents/:documentId', (req, res) => {
  const doc = documents.get(req.params.documentId)
  if (!doc) return res.status(404).json({ error: 'document not found' })
  res.json(doc)
})

app.get('/api/documents/:documentId/pdf-url', async (req, res) => {
  const doc = documents.get(req.params.documentId)
  if (!doc) return res.status(404).json({ error: 'document not found' })
  if (!s3Client || !S3_BUCKET || !doc.s3Key) {
    return res.status(404).json({ error: 'PDF not available (uploaded locally or no S3)' })
  }
  try {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: doc.s3Key })
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    res.json({ url })
  } catch (err) {
    console.warn('[pdf-url]', err)
    res.status(500).json({ error: 'Failed to generate PDF URL' })
  }
})

// --- Audit logs ---
app.get('/api/audit-logs', (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500)
  res.json(auditLogs.slice(0, limit))
})

// --- Vector status webhook (inbound: for testing or when webhook URL points at this server) ---
app.get('/webhooks/vector-status', (_req, res) => {
  res.json({
    ok: true,
    message: 'Vector status webhook endpoint. Backend POSTs here when a document becomes ready/failed (body: documentId, status, at).'
  })
})
app.post('/webhooks/vector-status', express.json(), (req, res) => {
  const { documentId, status, at } = req.body ?? {}
  console.log('[webhook] vector-status received:', { documentId, status, at })
  res.status(200).json({ ok: true })
})

// --- Chat streaming (SSE) - legacy GET for custom client ---
app.get('/api/chat/stream', (req, res) => {
  const q = String(req.query.q ?? '').trim()
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  pushAudit('chat.stream.start', undefined, { qLen: q.length })

  const content =
    q.length === 0
      ? 'Ask a legal question to start streaming. (This is a dev stub.)'
      : `Draft answer (dev stub) for: "${q}".\n\nThis will later be grounded using Pinecone + your uploaded documents.\n\nKey point: SSE is simpler than websockets for one-way streaming.`

  const tokens = content.split(/(\s+)/)
  let i = 0

  const interval = setInterval(() => {
    if (i >= tokens.length) {
      res.write(`event: done\ndata: {}\n\n`)
      clearInterval(interval)
      res.end()
      pushAudit('chat.stream.done')
      return
    }
    const delta = tokens[i++]
    res.write(`event: delta\ndata: ${JSON.stringify({ delta })}\n\n`)
  }, 40)

  req.on('close', () => {
    clearInterval(interval)
  })
})

// --- Chat streaming (Vercel AI SDK text stream protocol) ---
app.post('/api/chat', async (req, res) => {
  const body = req.body as { messages?: Array<{ role: string; content: string }> }
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const lastUser = messages.filter((m) => m.role === 'user').pop()
  const q = (lastUser?.content ?? '').trim()

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.flushHeaders?.()

  pushAudit('chat.stream.start', undefined, { qLen: q.length, protocol: 'text' })

  if (q.length === 0) {
    res.write('Ask a legal question to start streaming.')
    res.end()
    pushAudit('chat.stream.done')
    return
  }

  if (usePinecone) {
    try {
      const citationsPayload = (chunks: RetrievedChunk[]) => {
        const citations = chunks.map((c, i) => ({
          id: `${c.documentId}_${i}`,
          documentId: c.documentId,
          docName: c.docName,
          page: 1,
          snippet: c.text.slice(0, 400)
        }))
        res.write(JSON.stringify({ citations }) + '\n')
      }
      await streamGroundedAnswer(q, (chunk) => res.write(chunk), citationsPayload)
    } catch (err) {
      console.warn('[chat] Pinecone/OpenAI error:', err)
      res.write('Sorry, I could not generate an answer right now. Please try again.')
    }
    res.end()
    pushAudit('chat.stream.done')
    return
  }

  const content = `Draft answer (dev stub) for: "${q}".\n\nUpload documents and set PINECONE_API_KEY + OPENAI_API_KEY for RAG-grounded answers.`
  const tokens = content.split(/(\s+)/)
  let i = 0
  const interval = setInterval(() => {
    if (i >= tokens.length) {
      clearInterval(interval)
      res.end()
      pushAudit('chat.stream.done')
      return
    }
    res.write(tokens[i++])
  }, 40)
  req.on('close', () => clearInterval(interval))
})

const PORT = Number(process.env.PORT ?? 8787)
const HOST = process.env.HOST ?? '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`LegalMind backend listening on http://${HOST}:${PORT}`)
})

