"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  FileCode,
  TerminalSquare,
  GitBranch,
  X,
  Loader2,
  ArrowRight,
  ChevronRight,
  FolderSearch,
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

// ── Inline markdown renderer (mirrors QueryPanel) ──────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold text-ink-primary">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("*") && part.endsWith("*"))
      return (
        <em key={i} className="italic text-ink-secondary">
          {part.slice(1, -1)}
        </em>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="font-mono text-sm bg-warm-secondary border border-warm-divider rounded px-1.5 py-0.5 text-burnt"
        >
          {part.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function MarkdownResponse({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={i}
          className="bg-[#1C1714] rounded-md p-3 my-3 overflow-x-auto border border-warm-divider"
        >
          <code className="font-mono text-xs text-[#F5EDE3] leading-relaxed whitespace-pre">
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
      i++;
      continue;
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      nodes.push(
        <h3
          key={i}
          className="font-serif text-sm font-semibold text-ink-primary mt-4 mb-1"
        >
          {renderInline(h3[1])}
        </h3>,
      );
      i++;
      continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      nodes.push(
        <h2
          key={i}
          className="font-serif text-base font-semibold text-ink-primary mt-5 mb-1"
        >
          {renderInline(h2[1])}
        </h2>,
      );
      i++;
      continue;
    }
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      nodes.push(
        <h1
          key={i}
          className="font-serif text-lg font-bold text-ink-primary mt-5 mb-2"
        >
          {renderInline(h1[1])}
        </h1>,
      );
      i++;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={i} className="border-warm-divider my-3" />);
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={i}
          className="border-l-4 border-burnt pl-3 my-2 font-serif italic text-ink-muted text-sm"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      );
      i++;
      continue;
    }
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ""));
        i++;
      }
      nodes.push(
        <ul key={i} className="mb-3 flex flex-col gap-1">
          {items.map((item, j) => (
            <li
              key={j}
              className="flex gap-2 items-start font-serif text-sm text-ink-primary leading-relaxed"
            >
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-burnt shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={i} className="mb-3 flex flex-col gap-1">
          {items.map((item, j) => (
            <li
              key={j}
              className="flex gap-2 items-start font-serif text-sm text-ink-primary leading-relaxed"
            >
              <span className="font-mono text-xs text-burnt mt-0.5 shrink-0 w-4 text-right">
                {j + 1}.
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    nodes.push(
      <p
        key={i}
        className="font-serif text-ink-primary text-sm leading-relaxed mb-3"
      >
        {renderInline(line)}
      </p>,
    );
    i++;
  }
  return <div className="flex flex-col">{nodes}</div>;
}

// ── File search picker ─────────────────────────────────────────────────────
function FileSearchPicker({
  repoId,
  value,
  onChange,
  placeholder,
}: {
  repoId: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Load tree once
  useEffect(() => {
    setLoading(true);
    api.files
      .tree(repoId)
      .then(({ tree }) => {
        const flat: string[] = [];
        function walk(nodes: import("@/lib/api").FileTreeNode[], prefix = "") {
          for (const n of nodes) {
            const p = prefix ? `${prefix}/${n.name}` : n.name;
            if (n.type === "file") flat.push(p);
            else if (n.children) walk(n.children, p);
          }
        }
        walk(tree);
        setAllFiles(flat);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = useCallback(
    (v: string) => {
      setQuery(v);
      onChange(v);
      if (!v.trim()) {
        setFiltered([]);
        setOpen(false);
        return;
      }
      const q = v.toLowerCase();
      setFiltered(
        allFiles.filter((f) => f.toLowerCase().includes(q)).slice(0, 12),
      );
      setOpen(true);
    },
    [allFiles, onChange],
  );

  function select(path: string) {
    setQuery(path);
    onChange(path);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 bg-warm-secondary border border-warm-divider rounded-sm px-3 py-2 focus-within:border-burnt transition-colors">
        <FolderSearch size={13} className="text-burnt shrink-0" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.trim() && filtered.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "Search for a file…"}
          className="flex-1 bg-transparent font-mono text-sm text-ink-primary placeholder:text-ink-muted outline-none"
        />
        {loading && (
          <Loader2 size={12} className="animate-spin text-ink-muted shrink-0" />
        )}
        {query && (
          <button
            onClick={() => {
              setQuery("");
              onChange("");
              setFiltered([]);
              setOpen(false);
            }}
            className="text-ink-muted hover:text-ink-primary shrink-0"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-warm-primary border border-warm-divider rounded-sm shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map((f) => (
            <button
              key={f}
              onClick={() => select(f)}
              className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] text-ink-secondary hover:bg-warm-secondary hover:text-burnt text-left transition-colors"
            >
              <FileCode size={11} className="shrink-0 text-burnt/60" />
              <span className="truncate">{f}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

  // For "explain" action: allow file search picker
  const useFilePicker = action === "explain" || action === "impact";

  useEffect(() => {
    if (!useFilePicker) inputRef.current?.focus();
  }, [useFilePicker]);

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
            <div className="flex-1">
              <label className="section-label block mb-1.5">
                {meta.inputLabel.toUpperCase()}
              </label>
              {useFilePicker ? (
                <FileSearchPicker
                  repoId={repoId}
                  value={input}
                  onChange={setInput}
                  placeholder={meta.placeholder}
                />
              ) : (
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={meta.placeholder}
                  disabled={streaming}
                  className="w-full bg-warm-secondary border border-warm-divider rounded-sm font-mono text-sm text-ink-primary px-3 py-2 focus:border-burnt outline-none placeholder:text-ink-muted disabled:opacity-60"
                />
              )}
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
                className="bg-warm-secondary border border-warm-divider rounded-sm p-4 max-h-72 overflow-y-auto"
              >
                {answer ? <MarkdownResponse text={answer} /> : null}
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
