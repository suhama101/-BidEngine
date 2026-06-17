# BidEngine AI — Agentic RFP Intelligence

### Neural-Accelerated Proposal Engineering & Compliance Guardrails

BidEngine AI is a premium hackathon-grade platform designed to automate the lifecycle of Request for Proposal (RFP) responses. It leverages a robust RAG (Retrieval Augmented Generation) pipeline and multi-agent coordination to transform raw procurement documents into evidence-backed, high-probability winning bids.

---

## 🚀 Features

| Feature | Status | Implementation |
| :--- | :--- | :--- |
| **Neural Extraction** | ✅ Working | [api/rfp/analyze.js](api/rfp/analyze.js) |
| **Semantic Matching** | ✅ Working | [bid-engine/lib/ragEngine.js](bid-engine/lib/ragEngine.js) |
| **Compliance Audit** | ✅ Working | [api/rfp/match.js](api/rfp/match.js) |
| **Draft Synthesis** | ✅ Working | [api/rfp/draft.js](api/rfp/draft.js) |
| **Win Prediction** | ✅ Working | [api/rfp/score.js](api/rfp/score.js) |
| **Multi-Agent Portal**| ✅ Working | [gradio_app.py](gradio_app.py) |

---

## 🧠 AI Architecture

### LLM Hierarchy
The system implements a primary-fallback architecture:
- **Primary:** OpenAI `gpt-4o-mini` (High reasoning, valid JSON).
- **Fallback:** Groq `llama-3.1-8b-instant` (Latency-optimized performance).

### Intelligence Modules
1. **Extraction:** High-specificity regex and LLM-guided parsing identify 60+ requirement categories.
2. **Scoring:** A proprietary engine weighs sector win rates, budget alignment, and capability match from `bid_history`.
3. **Reviewer:** A Red-Team agent evaluates drafts for hallucinations and unsupported claims.

---

## 📚 RAG Architecture (The "Real RAG")

Unlike simple vector lookups, BidEngine AI uses a **Retriever-Reranker** architecture:

1. **Vector DB:** Supabase PostgreSQL with `pgvector` enabled.
2. **Embeddings:** OpenAI `text-embedding-3-small` (1536 dims).
3. **Process:**
   - **Ingestion:** `RecursiveCharacterTextSplitter` (chunk=900, overlap=120).
   - **Retrieval:** Semantic search via `match_evidence_documents` SQL function.
   - **Reranking:** An AI Auditor (`rerankEvidence`) validates candidates, rejecting weak semantic matches.

```javascript
// Reference: bid-engine/lib/ragEngine.js
const retrievalChain = RunnableSequence.from([
  (input) => retriever.invoke(input.query),
  (docs) => rerankEvidence({ requirementText, candidates: docs })
]);
```

---

## 🤖 Multi-Agent Architecture

The project features two distinct agentic implementations:

### 1. Sequential Coordination (Web App)
Built in pure JavaScript for Vercel deployment:
- **Analyst:** Breaks requirements into atomic components.
- **Strategist:** Maps requirements to the best historical evidence.
- **Writer:** Synthesizes the draft section-by-section.

### 2. CrewAI Pipeline (Experimental)
A Python-based agent swarm available via `crewBridge.js` or the standalone **Gradio Portal**:
- **Requirement Extraction Agent:** Normalizes procurement data.
- **Compliance Agent:** Strict auditor for evidence validation.
- **Bid Strategy Agent:** Performs GO/NO-GO simulations.

---

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js (Vercel Serverless Functions).
- **Database:** Supabase (PostgreSQL), pgvector.
- **AI/LLM:** OpenAI, Groq, LangChain.
- **Local Dev:** concurrently, Gradio.

---

## 📊 Database Schema

| Table | Purpose |
| :--- | :--- |
| `rfp_workspaces` | Core project metadata and raw RFP text. |
| `rfp_requirements` | Extracted and classified requirement records. |
| `evidence_documents` | (Vector) Chunked capability library for RAG. |
| `bid_history` | Performance data for the Win Score engine. |
| `proposal_drafts` | Versioned AI-generated proposal content. |

---

## 🚦 Environment Variables

```bash
# Required
OPENAI_API_KEY=          # Embeddings and Primary Logic
GROQ_API_KEY=            # Fallback and Multi-agent swarm
NEXT_PUBLIC_SUPABASE_URL= 
SUPABASE_SERVICE_ROLE_KEY=
# Optional
CREWAI_MODEL=llama-3.3-70b-versatile
```

---

## 🏗 Local Setup

1. **Clone & Install:**
   ```bash
   npm install
   ```

2. **Environment:**
   Copy `.env.example` to `.env` and fill in your keys.

3. **Run All Services:**
   ```bash
   npm run dev:all
   ```
   *Frontend: http://localhost:3000*
   *API Server: http://localhost:3001*

---

## 🚧 Known Limitations

- **CrewAI Dependency:** The Python CrewAI swarm requires a local Python environment; it does not yet run natively in Vercel serverless functions.
- **Export Gaps:** While the UI has "Export" buttons, the PDF/DOCX generation backend is not implemented.
- **Text Extraction:** PDF parsing is currently dependent on a simple PDF-to-Text bridge.
- **Hallucination Risk:** While rerankers are in place, the system may still invent connections if the Capability Library is empty.

---

## ⚖️ Judge Notes: What is "Technically Real"?

- **REAL:** The Supabase Vector Store and OpenAI Embedding pipeline. This is a production-ready RAG implementation.
- **REAL:** The sanitization logic. The system aggressively cleans data to prevent DB crashes—a common real-world problem.
- **NOT REAL:** The claim of "Seamless DOCX Export". The buttons are high-fidelity placeholders.
- **NOT REAL:** "Autonomous CrewAI on Vercel". The CrewAI logic is currently a separate local process.
