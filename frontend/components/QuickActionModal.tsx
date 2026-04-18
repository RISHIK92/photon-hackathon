"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  FileCode,
  TerminalSquare,
  GitBranch,
  X,
  Loader2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export type QuickActionType = "trace" | "usages" | "explain" | "impact";

interface QuickActionModalProps {
  repoId: string;
  action: QuickActionType;
  onClose: () => void;
}

const ACTION_META: Record<
  QuickActionType,
  {
    icon: React.ReactNode;
    title: string;
    desc: string;
    inputLabel: string;
    placeholder: string;
    roman: string;
  }
> = {
  trace: {
    icon: <Search size={16} />,
    title: "Trace a Function",
    desc: "Find all callers and callees — the full call chain.",
    inputLabel: "Function name",
    placeholder: "e.g. parse_ast, handleRequest, getUserById",
    roman: "I",
  },
  usages: {
    icon: <FileCode size={16} />,
    title: "Find Usages",
    desc: "Locate every reference to a variable, class, or function.",
    inputLabel: "Symbol name",
    placeholder: "e.g. UserModel, API_BASE, getToken",
    roman: "II",
  },
  explain: {
    icon: <TerminalSquare size={16} />,
    title: "Explain a File",
    desc: "AI-generated summary of a file's purpose and structure.",
    inputLabel: "File path",
    placeholder: "e.g. app/core/graph/builder.py",
    roman: "III",
  },
  impact: {
    icon: <GitBranch size={16} />,
    title: "Run Impact Analysis",
    desc: "Simulate what breaks if you change or remove this symbol.",
    inputLabel: "Symbol or file name",
    placeholder: "e.g. Neo4jClient, embedder.py, create_access_token",
    roman: "IV",
  },
};

interface CitedChunk {
  path?: string;
  file_path?: string;
  start_line?: number;
  end_line?: number;
  symbol_name?: string;
}

export default function QuickActionModal({
  repoId,
  action,
  onClose,
}: QuickActionModalProps) {
  const router = useRouter();
  const meta = ACTION_META[action];
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<CitedChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll answer box
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [answer]);

  async function run() {
    if (!input.trim()) return;
    setStreaming(true);
    setAnswer("");
    setCitations([]);
    setError(null);
    setDone(false);

    try {
      let res: Response;
      if (action === "trace")
        res = await api.query.traceFunction(repoId, input.trim());
      else if (action === "usages")
        res = await api.query.findUsages(repoId, input.trim());
      else if (action === "explain")
        res = await api.query.explainFile(repoId, input.trim());
      else res = await api.query.impactAnalysis(repoId, input.trim());

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "meta" && evt.cited_chunks) {
              setCitations(evt.cited_chunks as CitedChunk[]);
            } else if (evt.type === "token") {
              setAnswer((prev) => prev + evt.text);
            } else if (evt.type === "done") {
              setDone(true);
            }
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStreaming(false);
      setDone(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !streaming) run();
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-warm-primary border border-warm-divider rounded-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-divider shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-serif text-burnt text-xl font-bold w-5 text-center">
              {meta.roman}
            </span>
            <div className="flex items-center gap-2 text-ink-primary">
              {meta.icon}
              <h2 className="font-serif text-lg font-semibold">{meta.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-6 py-5 overflow-y-auto flex-1">
          <p className="font-serif text-sm text-ink-muted">{meta.desc}</p>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <label className="section-label block mb-1.5">
                {meta.inputLabel.toUpperCase()}
              </label>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={meta.placeholder}
                disabled={streaming}
                className="w-full bg-warm-secondary border border-warm-divider rounded-sm font-mono text-sm text-ink-primary px-3 py-2 focus:border-burnt outline-none placeholder:text-ink-muted disabled:opacity-60"
              />
            </div>
            <button
              onClick={run}
              disabled={streaming || !input.trim()}
              className="self-end flex items-center gap-2 bg-burnt text-white font-sans text-sm px-4 py-2 rounded-sm hover:bg-burnt/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {streaming ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
              {streaming ? "Running…" : "Run"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 text-red-700 text-sm font-sans">
              {error}
            </div>
          )}

          {/* Streaming answer */}
          {(answer || streaming) && (
            <div>
              <h4 className="section-label mb-2">RESULT</h4>
              <div
                ref={answerRef}
                className="bg-warm-secondary border border-warm-divider rounded-sm p-4 font-serif text-sm text-ink-primary leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap"
              >
                {answer}
                {streaming && !done && (
                  <span className="inline-block w-1.5 h-4 bg-burnt ml-0.5 animate-pulse rounded-sm align-middle" />
                )}
              </div>
            </div>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <div>
              <h4 className="section-label mb-2">
                CITED FILES ({citations.length})
              </h4>
              <div className="flex flex-col gap-1.5">
                {citations.map((c, i) => {
                  const path = c.path ?? c.file_path ?? "";
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        router.push(`/repos/${repoId}/file/${path}`);
                        onClose();
                      }}
                      className="flex items-center gap-2 text-left bg-warm-secondary border border-warm-divider rounded-sm px-3 py-2 hover:border-burnt/50 transition-colors group"
                    >
                      <FileCode size={12} className="text-burnt shrink-0" />
                      <span className="font-mono text-[11px] text-ink-secondary group-hover:text-burnt transition-colors truncate flex-1">
                        {path}
                      </span>
                      {(c.start_line || c.symbol_name) && (
                        <span className="text-[10px] text-ink-muted shrink-0">
                          {c.symbol_name
                            ? `${c.symbol_name}`
                            : `L${c.start_line}–${c.end_line}`}
                        </span>
                      )}
                      <ChevronRight
                        size={11}
                        className="text-ink-muted group-hover:text-burnt shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done — deep link to full query */}
          {done && answer && (
            <button
              onClick={() => {
                router.push(
                  `/repos/${repoId}/query?q=${encodeURIComponent(input)}`,
                );
                onClose();
              }}
              className="self-start text-burnt font-sans text-xs font-medium hover:underline flex items-center gap-1"
            >
              Open in full Query panel <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
