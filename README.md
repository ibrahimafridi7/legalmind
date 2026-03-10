# LegalMind AI

Full-stack legal research and document assistant: React + Vite frontend, Node.js backend, RAG over legal PDFs.

**Full A-to-Z setup (Auth0, Railway, Vercel, Vercel AI SDK, etc.)** → **[SETUP.md](./SETUP.md)**

## Structure

- **frontend/** — React (TanStack Query, Zustand), Tailwind, Shadcn-style UI, SSE chat, chunked uploads, RBAC, ErrorBoundary, toasts.
- **backend/** — Express: `/api/auth/me`, `/api/documents`, presign, chunk uploads, `/api/chat/stream` (SSE), `/api/audit-logs`. In-memory for dev.
- **e2e/** — Playwright: `login.spec.ts`, `upload.spec.ts`, `chat.spec.ts`.

## Run

1. **Backend** (required for auth + chat + documents):
   ```bash
   cd backend && npm install && npm run dev
   ```
   Listens on `http://localhost:8787`.

2. **Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   ```
   Open `http://localhost:5173`. Set `VITE_API_BASE_URL=http://localhost:8787` if backend is on another host.

3. **Unit tests** (frontend):
   ```bash
   cd frontend && npm run test:run
   ```

4. **E2E** (start backend + frontend first, then):
   ```bash
   cd e2e && npm install && npx playwright install chromium && npm test
   ```

## Auth0 SSO

To use Auth0 instead of dev-mode login:

1. **Auth0 Dashboard**: Create an Application (SPA) and an API. Note:
   - **Domain** (e.g. `your-tenant.auth0.com`)
   - **Client ID**
   - **API Identifier** (audience, e.g. `https://api.legalmind.com`)

2. **Frontend**: Copy `frontend/.env.example` to `frontend/.env` and set:
   - `VITE_AUTH0_DOMAIN`
   - `VITE_AUTH0_CLIENT_ID`
   - `VITE_AUTH0_AUDIENCE` (same as API identifier)

3. **Backend**: Copy `backend/.env.example` to `backend/.env` and set:
   - `AUTH0_DOMAIN`
   - `AUTH0_AUDIENCE` (same value as frontend)

4. **Auth0 Application**: Set *Allowed Callback URLs* to `http://localhost:5173` (and your production URL). Set *Allowed Logout URLs* and *Allowed Web Origins* as needed.

5. Restart frontend and backend. “Continue with SSO” will redirect to Auth0; after login, the backend validates the JWT and returns the user (role from custom claim `https://legalmind.app/role` or Auth0 rule, else `associate`).

