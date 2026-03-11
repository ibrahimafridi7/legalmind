/**
 * PostgreSQL for chat message history (no pgvector).
 * pgvector can be added later for semantic search over chat.
 */

import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL
export const useDb = Boolean(DATABASE_URL?.trim())

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    if (!DATABASE_URL?.trim()) throw new Error('DATABASE_URL is not set')
    pool = new Pool({ connectionString: DATABASE_URL })
  }
  return pool
}

const INIT_SQL = `
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_session_id on chat_messages(session_id);
`

let initDone = false
async function ensureTable() {
  if (initDone || !useDb) return
  const p = getPool()
  await p.query(INIT_SQL)
  initDone = true
}

export interface ChatMessageRow {
  id: string
  session_id: string
  role: string
  content: string
  citations: unknown
  created_at: string
}

export async function getChatMessages(sessionId: string): Promise<ChatMessageRow[]> {
  if (!useDb) return []
  await ensureTable()
  const { rows } = await getPool().query<ChatMessageRow>(
    'select id, session_id, role, content, citations, created_at from chat_messages where session_id = $1 order by created_at asc',
    [sessionId]
  )
  return rows
}

export async function insertChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  citations?: unknown
): Promise<string> {
  if (!useDb) return ''
  await ensureTable()
  const { rows } = await getPool().query<{ id: string }>(
    'insert into chat_messages (session_id, role, content, citations) values ($1, $2, $3, $4) returning id',
    [sessionId, role, content, citations != null ? JSON.stringify(citations) : null]
  )
  return rows[0]?.id ?? ''
}
