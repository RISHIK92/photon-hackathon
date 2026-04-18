/**
 * api.ts — Typed REST API client for YASML backend.
 * All requests are routed through the NEXT_PUBLIC_API_URL env var.
 */

import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function headers(extra?: Record<string, string>): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RepoSourceType = "github" | "zip" | "local";
export type RepoStatus = "PENDING" | "INGESTING" | "READY" | "FAILED";
export type JobStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

export interface Repo {
  id: string;
  name: string;
  source_type: RepoSourceType;
  source_url: string | null;
  status: RepoStatus;
  local_path: string | null;
  file_count: number;
  function_count: number;
  language_breakdown: Record<string, number>;
  top_modules: string[];
  cluster_count: number;
  most_imported: string[];
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  repo_id: string;
  status: JobStatus;
  progress: number;
  phase: string;
  message: string;
  created_at: string;
  finished_at: string | null;
}

export interface GraphNode {
  id: string;
  path: string;
  label: string;
  language: string;
  size_bytes: number;
  repo_id: string;
  community?: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  repo_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ImpactNode {
  id: string;
  path: string;
  depth?: number;
}

export interface ImpactAnalysis {
  node_id: string;
  impact_score: number;
  percentile: number;
  total_modules_in_repo: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  risk_emoji: string;
  metrics: {
    affected_count: number;
    upstream_count: number;
    max_depth: number;
    fan_out: number;
    fan_in: number;
  };
  affected_nodes: ImpactNode[];
  upstream_nodes: ImpactNode[];
  explanation: string;
}

export interface CitedChunk {
  id?: string;
  path?: string;
  file_path?: string;
  start_line: number;
  end_line: number;
  score?: number;
  text?: string;
  symbol_name?: string;
  language?: string;
  chunk_id?: string;
}

export interface Pin {
  id: string;
  repo_id: string;
  module_node_id: string;
  question: string;
  answer: string;
  cited_refs: CitedChunk[];
  is_stale: boolean;
  created_at: string;
}

export interface EntryPoint {
  id: string;
  path: string;
  language: string;
  sym_count: number;
  top_symbols: string[];
  fan_out: number;
}

// ─── Repos ────────────────────────────────────────────────────────────────────

export const api = {
  repos: {
    async list(): Promise<Repo[]> {
      const res = await fetch(`${BASE}/api/repos`, { headers: headers() });
      return handleResponse<Repo[]>(res);
    },

    async get(id: string): Promise<Repo> {
      const res = await fetch(`${BASE}/api/repos/${id}`, {
        headers: headers(),
      });
      return handleResponse<Repo>(res);
    },

    async create(payload: {
      name: string;
      source_type: RepoSourceType;
      source_url?: string;
    }): Promise<Repo> {
      const res = await fetch(`${BASE}/api/repos`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      return handleResponse<Repo>(res);
    },

    async uploadZip(name: string, file: File): Promise<Repo> {
      const form = new FormData();
      form.append("name", name);
      form.append("file", file);
      const token = getToken();
      const res = await fetch(`${BASE}/api/repos/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      return handleResponse<Repo>(res);
    },

    async delete(id: string): Promise<void> {
      await fetch(`${BASE}/api/repos/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
    },
  },

  jobs: {
    async get(id: string): Promise<Job> {
      const res = await fetch(`${BASE}/api/jobs/${id}`, { headers: headers() });
      return handleResponse<Job>(res);
    },

    async listForRepo(repoId: string): Promise<Job[]> {
      const res = await fetch(`${BASE}/api/jobs/repo/${repoId}`, {
        headers: headers(),
      });
      return handleResponse<Job[]>(res);
    },

    streamUrl(jobId: string): string {
      return `${BASE}/api/jobs/${jobId}/stream`;
    },
  },

  graph: {
    async get(repoId: string, depth = 2): Promise<GraphData> {
      const res = await fetch(`${BASE}/api/graph/${repoId}?depth=${depth}`, {
        headers: headers(),
      });
      return handleResponse<GraphData>(res);
    },

    async getSubgraph(repoId: string, nodeId: string): Promise<GraphData> {
      const res = await fetch(
        `${BASE}/api/graph/${repoId}/subgraph/${encodeURIComponent(nodeId)}`,
        { headers: headers() },
      );
      return handleResponse<GraphData>(res);
    },

    async getImpact(repoId: string, nodeId: string): Promise<ImpactAnalysis> {
      const res = await fetch(
        `${BASE}/api/graph/${repoId}/impact/${encodeURIComponent(nodeId)}`,
        { headers: headers() },
      );
      return handleResponse<ImpactAnalysis>(res);
    },

    async getEntryPoints(repoId: string, limit = 8): Promise<EntryPoint[]> {
      const res = await fetch(
        `${BASE}/api/graph/${repoId}/entry-points?limit=${limit}`,
        { headers: headers() },
      );
      return handleResponse<EntryPoint[]>(res);
    },
  },

  files: {
    async get(
      repoId: string,
      filePath: string,
    ): Promise<{ content: string; language: string }> {
      const encoded = encodeURIComponent(filePath);
      const res = await fetch(`${BASE}/api/files/${repoId}/${encoded}`, {
        headers: headers(),
      });
      return handleResponse<{ content: string; language: string }>(res);
    },
  },

  pins: {
    async create(payload: {
      repo_id: string;
      module_node_id: string;
      question: string;
      answer: string;
      cited_refs?: CitedChunk[];
    }): Promise<Pin> {
      const res = await fetch(`${BASE}/api/annotations`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      return handleResponse<Pin>(res);
    },

    async listForRepo(repoId: string): Promise<Pin[]> {
      const res = await fetch(`${BASE}/api/annotations/repo/${repoId}`, {
        headers: headers(),
      });
      return handleResponse<Pin[]>(res);
    },

    async delete(pinId: string): Promise<void> {
      await fetch(`${BASE}/api/annotations/${pinId}`, {
        method: "DELETE",
        headers: headers(),
      });
    },
  },

  query: {
    /** Returns the raw fetch Response so callers can stream SSE. */
    stream(payload: {
      repo_id: string;
      question: string;
      session_id?: string;
    }): Promise<Response> {
      return fetch(`${BASE}/api/query`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
    },
  },

  export: {
    url(repoId: string): string {
      return `${BASE}/api/annotations/repo/${repoId}/export`;
    },
  },

  auth: {
    async signup(
      email: string,
      password: string,
    ): Promise<{ id: string; email: string }> {
      const res = await fetch(`${BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },

    async login(
      email: string,
      password: string,
    ): Promise<{
      access_token: string;
      token_type: string;
      user: { id: string; email: string };
    }> {
      // OAuth2PasswordRequestForm expects form-encoded body
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      return handleResponse(res);
    },
  },
};
