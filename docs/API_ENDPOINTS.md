# Backend API Endpoints

Saare endpoints yahi hain. Koi change nahi — sirf reference.

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info `{ ok, service: 'legalmind-api' }` |
| GET | `/health` | Health check `{ ok: true }` |

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user (Bearer token). Returns `{ id, name, email, role }`. |

---

## Documents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/documents` | List all documents (audit: document.list). |
| GET | `/api/documents/status-stream` | SSE stream for document indexed (ready/failed). |
| POST | `/api/documents/presign` | Get upload URL + documentId (body: filename, contentType, sizeBytes?). Audit: document.presign. |
| POST | `/api/documents/:documentId/confirm-upload` | Confirm S3 upload; starts indexing. Audit: document.uploaded.s3. |
| GET | `/api/documents/:documentId` | Get one document metadata. Audit: document.view. |
| GET | `/api/documents/:documentId/pdf-url` | Get presigned PDF URL (S3). Audit: document.pdf_url. |

---

## Uploads (dev / local)

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/uploads/:documentId` | Upload full file (raw body). |
| PUT | `/api/uploads/:documentId/chunk` | Upload one chunk. Query: `chunkIndex`, `totalChunks`. |

---

## Audit logs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/audit-logs` | List audit entries. Query: `?limit=100` (max 500). |

---

## Chat

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chat/stream` | Legacy SSE chat (query: `q`). |
| POST | `/api/chat` | Chat stream (body: `{ messages }`). First line JSON `{ citations }`, then plain text. |

---

## Webhooks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/webhooks/vector-status` | Info message (endpoint for POST from backend). |
| POST | `/webhooks/vector-status` | Inbound webhook (body: documentId, status, at). |
