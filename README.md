# YASML — Codebase Intelligence Platform

> Ingest any repository, build a structural knowledge graph, and explore your codebase with natural language — without reading every file manually.

## Quick Start

### Prerequisites
- Docker & Docker Compose v2
- A Gemini API key (`https://aistudio.google.com/app/apikey`)

### 1. Configure environment
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Start all services
```bash
docker compose up -d
```

This boots: PostgreSQL · Redis · Neo4j · Qdrant · FastAPI · Celery worker · Next.js frontend

### 3. Open the UI
```
http://localhost:3000
```

---

## Development (local, no Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt

# Start infrastructure services
docker compose up -d postgres redis neo4j qdrant

# Run API
uvicorn app.main:app --reload --port 8000

# Run Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## Architecture

```
Landing Page → RepoConnectForm → IngestionProgress (SSE)
  └→ /repos/[id]          Repo overview + stats
  └→ /repos/[id]/graph    Interactive dependency graph (React Flow)
  └→ /repos/[id]/query    NL query chat with streaming answers
  └→ /repos/[id]/file/... Syntax-highlighted file viewer
```

### Storage Layer
| Store | Purpose |
|---|---|
| PostgreSQL | Repo metadata, jobs, pins |
| Neo4j | Module dependency graph |
| Qdrant | Code chunk embeddings |
| Redis | Celery queue + SSE pub/sub |

### API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/repos` | Connect repo (GitHub/local) |
| POST | `/api/repos/upload` | Upload ZIP |
| GET | `/api/repos/{id}` | Get repo metadata |
| GET | `/api/jobs/{id}/stream` | SSE job progress |
| GET | `/api/graph/{repo_id}` | Node-link graph JSON |
| POST | `/api/query` | NL query (SSE streaming) |
| POST | `/api/annotations` | Create pin |
| GET | `/api/annotations/repo/{id}` | List pins |

Full Swagger docs at `http://localhost:8000/docs`

---

## Supported Languages
Python · JavaScript · TypeScript · Go · Rust · Java

---

## Environment Variables
See `.env.example` for all variables. Key ones:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Required — Gemini 2.0 Flash + text-embedding-004 |
| `API_KEY` | Bearer token for protected endpoints (default: `yasml-dev-key`) |
| `GRAPH_BACKEND` | `neo4j` (default) |
| `REPOS_STORAGE_PATH` | Where cloned repos are stored |
