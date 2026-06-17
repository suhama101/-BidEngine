# BidEngine AI

**AI-Powered Bid & Proposal Response Engine**

BidEngine AI automates the most time-intensive parts of bid preparation — parsing RFP documents, extracting individual requirements, matching them against a capability library, drafting compliant proposal responses, and scoring win probability with a GO/NO-GO decision. Built for procurement, sourcing, and contract management teams.

> Live deployment: [bid-engine-swart.vercel.app](https://bid-engine-swart.vercel.app)

---

## What it does

| Step | Feature | Description |
|------|---------|-------------|
| 1 | **Upload RFP** | Upload PDF or DOCX — PDF parsed in browser (pdfjs-dist), DOCX parsed on server (mammoth) |
| 2 | **Extract Requirements** | Groq LLM (llama-3.3-70b/3.1-8b) extracts individual requirements — one item per row, max 150 chars each |
| 3 | **Semantic RAG** | Requirements matched via **Dense Vector Search** (Cosine Similarity) + **LLM Cross-Encoder Reranking** |
| 4 | **Agentic Drafting** | A multi-agent swarm (Analyst, Strategist, Writer) generates coordinated proposal response sections |
| 5 | **Score Win Probability** | GO/NO-GO decision based on compliance score, capability match, and historical bid patterns |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + Tailwind CSS v4 |
| AI Engine | Groq Cloud API — `llama-3.3-70b` & `llama-3.1-8b-instant` |
| **RAG Pipeline** | **Dense Vector Embeddings (768-dim) + Cosine Similarity Search** |
| **Agent Swarm** | Coordinator, Analyst, Strategist, Writer, Auditor, Reranker, Consultant |
| PDF Parsing | `pdfjs-dist` v5 (browser-side), `mammoth` v1 (server-side DOCX) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Serverless API | Vercel Functions (`/api/**`) |
| Dataset | 120 historical bids + 50 capability records (TEKROWE hackathon dataset) |

---

## Project Structure

```
bidengine-ai/
├── src/
│   └── App.tsx                  # Main React SPA — all screens (landing, login, dashboard)
├── api/                         # Vercel serverless functions
│   ├── _lib/
│   │   ├── requestAuth.js       # JWT auth middleware
│   │   └── supabase.js          # Supabase client factory
│   ├── auth/
│   │   ├── login.js             # POST /api/auth/login
│   │   ├── logout.js            # POST /api/auth/logout
│   │   ├── me.js                # GET  /api/auth/me
│   │   └── signup.js            # POST /api/auth/signup
│   ├── rfp/
│   │   ├── analyze.js           # POST /api/rfp/analyze  — Groq extraction + heuristic fallback
│   │   ├── draft.js             # POST /api/rfp/draft    — Groq proposal drafting
│   │   ├── match.js             # POST /api/rfp/match    — capability matching
│   │   ├── score.js             # POST /api/rfp/score    — win probability scoring
│   │   └── upload.js            # POST /api/rfp/upload   — file upload + workspace creation
│   └── workspaces.js            # GET/POST /api/workspaces
├── bid-engine/                  # Core Intelligence Layer
│   ├── components/              # Modern React UI Components
│   ├── lib/
│   │   ├── agents/              # 🤖 Agent Swarm (Analyst, Writer, Reranker, etc.)
│   │   ├── groqClient.js        # Groq Llama-3 API client
│   │   ├── vectorStore.js       # 📂 In-memory Vector Database (Cosine Similarity)
│   │   ├── embeddingService.js  # 🧠 768-dim Dense Vector Embedding generator
│   │   ├── semanticRetriever.js # 🛰️ Semantic RAG Retrieval Pipeline
│   │   └── datasetAnalysis.js   # Heuristics and Win Scoring logic
├── public/
│   └── sample-rfps/             # Sample TXT RFPs (IT Services, Construction, Logistics, Cybersecurity)
├── assets/
│   └── Problem#1_Sample_Datasets (TEKROWE).xlsx  # 120 bid history + 50 capability records
├── package.json                 # Root — Vite + React app
├── vite.config.ts               # Vite config with pdfjs-dist optimisation
└── supabase-schema.sql          # Full database schema
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq Cloud](https://console.groq.com) API key (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/suhama101/-BidEngine.git
cd BidEngine
npm install
```

### 2. Environment variables

Create a `.env` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq
GROQ_API_KEY=your-groq-api-key
```

### 3. Database setup

Run `supabase-schema.sql` in your Supabase SQL Editor. It creates:

| Table | Purpose |
|-------|---------|
| `rfp_workspaces` | One workspace per uploaded RFP |
| `rfp_requirements` | Extracted individual requirements |
| `proposal_drafts` | AI-generated response sections |
| `win_scores` | Stored win probability scores |
| `capability_library` | 50 company past projects |
| `bid_history` | 120 historical bid outcomes |
| `evaluation_criteria_taxonomy` | 15+ RFP evaluation criteria by sector |

### 4. Run locally

```bash
npm run dev
```

Opens at `http://localhost:3000`

---

## API Reference

All endpoints require `Authorization: Bearer <token>` header.

### Upload RFP
```
POST /api/rfp/upload
Content-Type: multipart/form-data   (for DOCX)
Content-Type: application/json      (for pre-extracted text from PDF)

Body (JSON): { rawText, fileName, title }
Body (form): file (DOCX), title

Response: { workspaceId, workspace, rawText, characterCount }
```

### Analyze RFP
```
POST /api/rfp/analyze
Body: { rawText, workspaceId?, bidTitle? }

Response: { workspaceId, requirements[], count }
```
Uses Groq `llama-3.3-70b-versatile` to extract individual requirements.
Falls back to regex heuristics if Groq is unavailable.
Each requirement: max 200 chars, capped at 30 items total.

### Match Capabilities
```
POST /api/rfp/match
Body: { workspaceId }

Response: { matches[], requirements[], capability_count }
```
Ratio-based keyword matching. `matchRatio >= 0.4 → pass`, `>= 0.15 → partial`, else `fail`.

### Generate Draft
```
POST /api/rfp/draft
Body: { workspaceId, requirementId?, tone?, capabilityInfo? }

Response: { drafts[], count }
```

### Score Win Probability
```
POST /api/rfp/score
Body: { workspaceId, rawText? }

Response: { scores, record, decision: "GO"|"NO-GO" }
```
GO/NO-GO threshold: `compliance_score >= 70 → GO`.

### Export Proposal
```
GET /api/rfp/export?workspaceId=<uuid>

Response: DOCX file download
```

---

## Key Design Decisions

**Native Agentic RAG (Not a Wrapper)**
Instead of relying on heavy frameworks like LangChain, BidEngine.AI uses a custom-built **Semantic RAG Pipeline**. It generates dense 768-dimensional embeddings, performs high-speed cosine similarity search in a local vector index, and uses an **LLM Cross-Encoder Reranker** (Llama-3) to ensure 10/10 retrieval precision.

**Multi-Agent Coordination**
Work is distributed across a specialized swarm: The **Analyst** breaks down requirements, the **Strategist** picks evidence, the **Writer** drafts the prose, and the **Auditor** verifies compliance. The **Coordinator** orchestrates the entire flow.

**Real win scoring**
`calculateWinScore()` uses 120 rows of historical bid data from the TEKROWE dataset. GO/NO-GO is driven by `compliance_score` (pass_count / total_mandatory × 100), combining technical model fit with strategic consultant feedback.

---

## Environment Variables Reference

| Variable | Required | Used in |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All API routes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Auth client |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin DB operations |
| `GROQ_API_KEY` | Yes | `/api/rfp/analyze`, `/api/rfp/draft` |

---

## Sample Data

The `assets/` folder contains the TEKROWE hackathon dataset:

- **Bid History** — 120 historical bids with outcome (Win/Loss), score %, compliance %, response time, sector
- **Capability Library** — 50 past projects with domain, certification, contract value, client type, year

Sample RFPs are available in `public/sample-rfps/` for testing without uploading a real document:
- `rfp-it-services.txt`
- `rfp-construction.txt`
- `rfp-logistics.txt`
- `rfp-cybersecurity-deployment.txt`

---

## Deployment

The app is deployed on Vercel. Push to `main` triggers automatic redeploy.

```bash
git add .
git commit -m "your changes"
git push origin main
```

Set all environment variables in Vercel dashboard → Project Settings → Environment Variables.

---

## License

MIT
