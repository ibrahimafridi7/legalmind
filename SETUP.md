# LegalMind — Full A-to-Z Setup (Case Study)

Yeh guide case study ke mutabiq **sab services** ka setup step-by-step batata hai: **Auth0**, **Railway** (backend), **Vercel** (frontend), **Vercel AI SDK**, aur related cheezen.

---

## 1. Pehle yeh accounts bana lo

| Service   | Purpose              | Sign up / URL                    |
|----------|----------------------|----------------------------------|
| **Auth0** | SSO / login          | [auth0.com](https://auth0.com)   |
| **Vercel**| Frontend hosting     | [vercel.com](https://vercel.com) |
| **Railway**| Backend Node hosting | [railway.app](https://railway.app) |
| **GitHub**| Code repo            | [github.com](https://github.com) |

Repo GitHub par push hona chahiye (e.g. `your-username/legalmind`).

---

## 2. Auth0 setup

1. **Auth0 Dashboard** → **Applications** → **Create Application**
   - Type: **Single Page Application**
   - Name: e.g. `LegalMind`

2. **Settings** pe jao, yeh note karo:
   - **Domain** → `xxxx.auth0.com`
   - **Client ID** → copy karo

3. **APIs** → **Create API**
   - Name: `LegalMind API`
   - **Identifier**: `https://api.legalmind.com` (ya koi unique URL) — yeh **Audience** hai
   - Create

4. Wapas **Applications** → apni SPA → **Settings**:
   - **Allowed Callback URLs**:  
     `http://localhost:5173, https://YOUR_VERCEL_APP.vercel.app`  
     (custom domain ho to woh bhi add karo)
   - **Allowed Logout URLs**: same URLs
   - **Allowed Web Origins**: same URLs (sirf origin, path mat daalo)
   - Save

5. (Optional) Role ke liye **Auth0 Rules** ya **Actions** se custom claim add kar sakte ho, e.g. `https://legalmind.app/role` = `admin` / `partner` / `associate`.

---

## 3. Railway — Backend deploy

1. [railway.app](https://railway.app) → **Login with GitHub** → **New Project**
2. **Deploy from GitHub repo** → `legalmind` (ya jo repo name hai) select karo
3. Service create hone ke baad **Settings**:
   - **Root Directory**: `backend` (zaroor set karo, poora repo nahi)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` ya `node dist/index.js`
4. **Variables** tab:
   - `AUTH0_DOMAIN` = `xxxx.auth0.com` (Auth0 Domain)
   - `AUTH0_AUDIENCE` = `https://api.legalmind.com` (API Identifier)
   - `PORT` = Railway khud set karta hai, optional override
5. **Settings** → **Networking** → **Generate Domain**  
   Jo URL mile (e.g. `https://legalmind-backend-production-xxxx.up.railway.app`) — yeh **backend URL** hai, copy karo.

**Agar 502 Bad Gateway aaye (Railway):**
- **Logs dekho**: Railway project → your service → **Deployments** → latest deploy → **View Logs**. Crash ya error message wahan dikhega.
- **Root Directory**: zaroor `backend` ho (Settings → Root Directory). Agar blank ho to build/start galat folder se chalenge.
- **Build / Start**: Build = `npm install && npm run build`, Start = `npm start`.
- **Health check**: Deploy ke baad pehle yeh try karo: `https://YOUR-RAILWAY-URL/` ya `https://YOUR-RAILWAY-URL/health` — dono `{"ok":true}` denge agar app chal rahi ho.

---

## 4. Vercel — Frontend deploy

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. GitHub repo `legalmind` import karo
3. **Configure**:
   - **Root Directory**: `frontend` (Override → `frontend` set karo)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** add karo:

   | Name                   | Value                                      |
   |------------------------|--------------------------------------------|
   | `VITE_API_BASE_URL`    | Railway backend URL (step 3 ka)            |
   | `VITE_AUTH0_DOMAIN`    | Auth0 Domain (e.g. `xxxx.auth0.com`)       |
   | `VITE_AUTH0_CLIENT_ID` | Auth0 SPA Client ID                        |
   | `VITE_AUTH0_AUDIENCE`  | Auth0 API Identifier (e.g. `https://api.legalmind.com`) |

5. **Deploy** karo. Jo URL mile (e.g. `https://legalmind-xxx.vercel.app`) — woh **frontend URL** hai.

6. **Auth0** mein yeh frontend URL **Allowed Callback / Logout / Web Origins** mein add karna mat bholna (step 2.4).

---

## 5. Env vars — ek jagah checklist

**Frontend (Vercel env vars)**

- `VITE_API_BASE_URL` = Railway backend URL
- `VITE_AUTH0_DOMAIN` = Auth0 domain
- `VITE_AUTH0_CLIENT_ID` = Auth0 SPA client ID
- `VITE_AUTH0_AUDIENCE` = Auth0 API identifier

**Backend (Railway env vars)**

- `AUTH0_DOMAIN` = same Auth0 domain
- `AUTH0_AUDIENCE` = same Auth0 API identifier  
(Optional: `DEV_ROLE` sirf local dev ke liye)

**Local dev ke liye**

- `frontend/.env`: same 4 `VITE_*` vars, `VITE_API_BASE_URL=http://localhost:8787`
- `backend/.env`: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` (ya Auth0 off rakho, to dev user use hoga)

---

## 6. Vercel AI SDK aur Chat streaming

- **Case study**: “Use the Vercel AI SDK to handle real-time chunk streaming.”
- **Is repo mein**:
  - Frontend: `ai` package install hai; chat **SSE** se stream hota hai (custom hook `/api/chat/stream` call karta hai). Agar aap **Vercel AI SDK** (`useChat` from `ai/react`) backend ke saath wire karna chahen to backend ko **same format** dena hoga jo AI SDK expect karta hai (e.g. OpenAI-compatible stream), ya frontend ko SDK ke `useChat` + backend route se connect karna hoga.
  - Backend: `/api/chat/stream` **SSE** se chunks bhejta hai — production mein isko OpenAI/Azure + RAG (Pinecone) se replace karna hai.

**Summary**: Setup ab bina Vercel AI SDK ke bhi kaam karega (SSE streaming). Agar aap SDK use karna chahen to backend response format ko SDK-compatible bana ke frontend mein `useChat` point karo.

---

## 7. Baaki case study services (optional / production)

| Service      | Case study use              | Abhi repo mein              | Production ke liye |
|-------------|-----------------------------|-----------------------------|---------------------|
| **Pinecone**| Vector DB (RAG)             | Nahi                        | Backend env: `PINECONE_*`, RAG pipeline |
| **OpenAI/Azure** | LLM answers            | Nahi                        | Backend: chat stream OpenAI/Azure se |
| **AWS S3**  | File storage + presigned URLs | Dev: local upload          | Backend: real presigned S3 URLs |
| **Auth0**   | SSO                         | ✅ Configure (step 2)       | Same                 |
| **Vercel**  | Frontend + streaming edge   | ✅ Deploy (step 4)          | Same                 |
| **Railway** | Backend Node                | ✅ Deploy (step 3)          | Same                 |

In sab ko setup karne ka order: pehle **Auth0 + Railway + Vercel** (steps 2–4), phir production ke liye S3, Pinecone, OpenAI add karo.

---

## 8. Test karo

1. Vercel frontend URL kholo → “Continue with SSO” → Auth0 login → redirect wapas app pe.
2. Chat: kuch type karo → streaming response aana chahiye (abhi stub; production mein RAG).
3. Documents: Admin/Partner role ho to upload dikhe; file upload → “Indexing…” / “Ready” (dev stub).
4. Audit Logs: sirf admin ko dikhe.

---

## 9. Short order of operations

1. Auth0: Application + API banao, URLs set karo  
2. Railway: repo se `backend` deploy, env vars, domain copy karo  
3. Vercel: repo se `frontend` deploy, env vars (backend URL + Auth0)  
4. Auth0 mein Vercel URL callback/logout/origins mein add karo  
5. Test: SSO → Chat → Documents → Audit

Is order se setup karo to case study ke hisaab se **Auth0, Railway, Vercel, aur chat streaming** sab set ho jayega; baaki (Vercel AI SDK exact wiring, Pinecone, S3) production RAG ke step pe add kar sakte ho.
