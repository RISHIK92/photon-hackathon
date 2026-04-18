"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  Network,
  Plus,
  Loader,
  ExternalLink,
  FolderSearch,
  X,
  FileCode,
} from "lucide-react";
import {
  api,
  type CitedChunk,
  type Pin as PinType,
  type GraphData,
  type GraphNode,
  type FileTreeNode,
} from "@/lib/api";
import { readSSE } from "@/lib/sse";
import React from "react";
import DependencyGraph from "@/components/DependencyGraph";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  text: string;
  intent?: string;
  chunks?: CitedChunk[];
  sessionId?: string;
}

interface QueryPanelProps {
  repoId: string;
}

const SUGGESTED_QUESTIONS = [
  "Explain the login flow",
  "Where is validate_user called?",
  "What does AuthService depend on?",
  "What breaks if I change db_query?",
];

const VISIBLE_COUNT = 3;

// ── Inline markdown renderer ──────────────────────────────────────────────────
// Handles: headings, bold, italic, inline-code, fenced code blocks,
// unordered/ordered lists, blockquotes, horizontal rules, paragraphs.

function renderInline(text: string): React.ReactNode[] {
  // Split by bold (**text**), italic (*text*), inline-code (`code`)
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

    // Fenced code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={i}
          className="bg-[#1C1714] rounded-md p-4 my-4 overflow-x-auto border border-warm-divider"
        >
          <code className="font-mono text-sm text-[#F5EDE3] leading-relaxed whitespace-pre">
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
      i++; // skip closing ```
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      nodes.push(
        <h3
          key={i}
          className="font-serif text-base font-semibold text-ink-primary mt-5 mb-1"
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
          className="font-serif text-xl font-semibold text-ink-primary mt-6 mb-2"
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
          className="font-serif text-2xl font-bold text-ink-primary mt-6 mb-3"
        >
          {renderInline(h1[1])}
        </h1>,
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<div key={i} className="divider-line my-4" />);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={i}
          className="border-l-4 border-burnt pl-4 my-3 font-serif italic text-ink-muted"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      );
      i++;
      continue;
    }

    // Unordered list — collect consecutive items
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ""));
        i++;
      }
      nodes.push(
        <ul key={i} className="mb-4 flex flex-col gap-1.5">
          {items.map((item, j) => (
            <li
              key={j}
              className="flex gap-2 items-start font-serif text-[16px] text-ink-primary leading-relaxed"
            >
              <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-burnt shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={i} className="mb-4 flex flex-col gap-1.5">
          {items.map((item, j) => (
            <li
              key={j}
              className="flex gap-2 items-start font-serif text-[16px] text-ink-primary leading-relaxed"
            >
              <span className="font-mono text-xs text-burnt mt-0.5 shrink-0 w-5 text-right">
                {j + 1}.
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Blank line — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    nodes.push(
      <p
        key={i}
        className="font-serif text-ink-primary text-[17px] leading-[1.85] mb-4"
      >
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="flex flex-col">{nodes}</div>;
}

// ── Query Graph Context ───────────────────────────────────────────────────────
// Fetches subgraph for each cited file and renders a live mini dependency graph.

function QueryGraphContext({
  repoId,
  chunks,
}: {
  repoId: string;
  chunks: CitedChunk[];
}) {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!chunks.length) return;

    // Deduplicate file paths from cited chunks
    const paths = Array.from(
      new Set(
        chunks.map((c) => c.path || c.file_path).filter(Boolean) as string[],
      ),
    ).slice(0, 5); // cap at 5 to avoid huge graphs

    if (!paths.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    // Fetch subgraphs for each cited file in parallel and merge
    Promise.all(
      paths.map((p) => {
        // node_id format: "{repo_id}::{path}"
        const nodeId = `${repoId}::${p}`;
        return api.graph.getSubgraph(repoId, nodeId).catch(() => null);
      }),
    )
      .then((results) => {
        // Merge all subgraphs into one deduped graph
        const nodeMap = new Map<string, GraphNode>();
        const edgeSet = new Set<string>();
        const edges: GraphData["edges"] = [];

        for (const res of results) {
          if (!res) continue;
          for (const n of res.nodes) nodeMap.set(n.id, n);
          for (const e of res.edges) {
            const key = `${e.source}→${e.target}`;
            if (!edgeSet.has(key)) {
              edgeSet.add(key);
              edges.push(e);
            }
          }
        }

        if (nodeMap.size === 0) {
          setLoading(false);
          setError(true);
          return;
        }

        // Assign simple grid layout positions
        const nodes = Array.from(nodeMap.values()).map((n, i) => ({
          ...n,
          x: (i % 4) * 180 - 270,
          y: Math.floor(i / 4) * 120 - 60,
        }));

        setGraphData({ repo_id: repoId, nodes, edges });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId, chunks.map((c) => c.path || c.file_path).join(",")]);

  // Highlight node ids matching cited chunks
  const citedNodeIds = new Set(
    chunks.map((c) => `${repoId}::${c.path || c.file_path}`).filter(Boolean),
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Mini graph */}
      <div
        className="relative border border-warm-divider rounded-md overflow-hidden"
        style={{ height: 220 }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F0EBE1] z-10">
            <Loader size={20} className="animate-spin text-burnt" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F0EBE1] z-10 gap-2">
            <Network
              size={28}
              strokeWidth={1}
              className="text-burnt opacity-40"
            />
            <span className="font-sans text-xs text-ink-muted">
              No graph data for these files
            </span>
          </div>
        )}
        {graphData && !loading && (
          <DependencyGraph
            data={graphData}
            selectedNodeId={selectedNode?.id ?? [...citedNodeIds][0]}
            onNodeClick={setSelectedNode}
          />
        )}
      </div>

      {/* Selected node detail + open link */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {selectedNode ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-burnt truncate">
                {selectedNode.label || selectedNode.path.split("/").pop()}
              </span>
              <span className="font-sans text-[10px] text-ink-muted truncate">
                {selectedNode.path}
              </span>
            </div>
          ) : (
            <span className="font-sans text-[11px] text-ink-muted italic">
              Click a node to inspect
            </span>
          )}
        </div>
        <button
          onClick={() => router.push(`/repos/${repoId}/graph`)}
          className="flex items-center gap-1.5 font-sans text-xs text-burnt hover:text-burnt-hover transition-colors shrink-0"
        >
          <ExternalLink size={11} />
          Full graph
        </button>
      </div>
    </div>
  );
}

// ── File Context Picker ───────────────────────────────────────────────────────
// A search-as-you-type file selector that scopes the AI answer to one file.

function FileContextPicker({
  repoId,
  value,
  onChange,
}: {
  repoId: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaded) return;
    api.files
      .tree(repoId)
      .then(({ tree }) => {
        const flat: string[] = [];
        function walk(nodes: FileTreeNode[], prefix = "") {
          for (const n of nodes) {
            const p = prefix ? `${prefix}/${n.name}` : n.name;
            if (n.type === "file") flat.push(p);
            else if (n.children) walk(n.children, p);
          }
        }
        walk(tree);
        setAllFiles(flat);
        setLoaded(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleInput(v: string) {
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
  }

  function select(path: string) {
    setQuery(path);
    onChange(path);
    setFiltered([]);
    setOpen(false);
  }

  function clear() {
    setQuery("");
    onChange("");
    setFiltered([]);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="flex items-center gap-2 bg-warm-secondary border border-warm-divider rounded-sm px-3 py-1.5 focus-within:border-burnt transition-colors">
        <FolderSearch size={13} className="text-burnt shrink-0" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.trim() && filtered.length > 0 && setOpen(true)}
          placeholder="Scope to a file… (optional)"
          className="flex-1 bg-transparent font-mono text-xs text-ink-primary placeholder:text-ink-muted outline-none min-w-0"
        />
        {query && (
          <button
            onClick={clear}
            className="text-ink-muted hover:text-ink-primary shrink-0"
          >
            <X size={11} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-warm-primary border border-warm-divider rounded-sm shadow-lg z-50 max-h-48 overflow-y-auto">
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

function FlowTrace({ chunks }: { chunks: CitedChunk[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? chunks : chunks.slice(0, VISIBLE_COUNT);
  const hidden = chunks.length - VISIBLE_COUNT;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {visible.map((chunk, ci) => {
        const label =
          chunk.symbol_name ||
          (chunk.path || chunk.file_path || "").split("/").pop() ||
          "File";
        const filePath = chunk.path || chunk.file_path || "";
        const filename = filePath.split("/").pop() || filePath;
        return (
          <div
            key={ci}
            title={filePath}
            className="flex items-center gap-1.5 bg-warm-secondary border border-warm-divider rounded-full px-3 py-1 max-w-[220px] hover:border-burnt/50 transition-colors group cursor-default"
          >
            <span className="w-4 h-4 rounded-full bg-burnt/10 border border-burnt/30 flex items-center justify-center font-sans text-[9px] text-burnt shrink-0">
              {ci + 1}
            </span>
            <span className="font-mono text-xs text-burnt truncate group-hover:text-burnt leading-none">
              {label !== filename ? label : filename}
            </span>
            {label !== filename && (
              <span className="font-sans text-[10px] text-ink-muted truncate leading-none">
                {filename}
              </span>
            )}
          </div>
        );
      })}

      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 bg-warm-secondary border border-warm-divider rounded-full px-3 py-1 font-sans text-xs text-ink-muted hover:text-burnt hover:border-burnt/50 transition-colors"
        >
          <Plus size={11} />
          {hidden} more
        </button>
      )}

      {expanded && chunks.length > VISIBLE_COUNT && (
        <button
          onClick={() => setExpanded(false)}
          className="font-sans text-[11px] text-ink-muted hover:text-burnt transition-colors underline underline-offset-2"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export default function QueryPanel({ repoId }: QueryPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [fileContextPath, setFileContextPath] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (messages.length > 0) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || streaming) return;
      setInput("");

      const userMsg: Message = {
        role: "user",
        text: fileContextPath
          ? `[File: ${fileContextPath}]\n${question}`
          : question,
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantMsg: Message = { role: "assistant", text: "", chunks: [] };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreaming(true);

      try {
        const sessionId =
          messages.find((m) => m.sessionId)?.sessionId ?? undefined;
        const res = await api.query.stream({
          repo_id: repoId,
          question,
          session_id: sessionId,
          file_context_path: fileContextPath || undefined,
        });

        for await (const event of readSSE(res)) {
          if (event.type === "meta") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.intent = event.intent as string;
              last.chunks = (event.cited_chunks ?? []) as CitedChunk[];
              last.sessionId = event.session_id as string;
              updated[updated.length - 1] = last;
              return updated;
            });
          } else if (event.type === "token") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.text += event.text as string;
              updated[updated.length - 1] = last;
              return updated;
            });
          } else if (event.type === "done") {
            break;
          }
        }
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: "Failed to get a response. Check that the backend is running.",
          };
          return updated;
        });
      } finally {
        setStreaming(false);
      }
    },
    [repoId, messages, streaming],
  );

  return (
    <div className="flex flex-col gap-12" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="animate-fade-in text-center flex flex-col items-center">
          <p className="section-label mb-6">QUERY</p>
          <h1 className="text-4xl md:text-5xl font-serif text-ink-primary font-medium mb-4">
            <span className="italic text-burnt">Ask</span> anything about your
            codebase.
          </h1>
          <p className="font-serif text-lg text-ink-muted mb-10">
            Trace flows, find usages, understand dependencies — in plain
            language.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12 max-w-2xl">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendQuestion(q)}
                className="bg-warm-secondary border border-warm-divider rounded-full px-5 py-2 font-serif italic text-ink-muted hover:text-ink-primary hover:border-burnt transition-colors text-sm"
              >
                "{q}"
              </button>
            ))}
          </div>

          <div className="w-full relative shadow-sm rounded-md">
            <textarea
              className="w-full bg-warm-primary border border-warm-divider rounded-md focus:border-burnt focus:ring-1 focus:ring-burnt outline-none p-5 pb-16 font-serif text-ink-primary text-lg resize-none placeholder:text-ink-muted/50 transition-colors"
              placeholder="How are payments verified?"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendQuestion(input);
                }
              }}
            />
            <button
              onClick={() => sendQuestion(input)}
              disabled={!input.trim() || streaming}
              className="absolute bottom-4 right-4 bg-burnt text-warm-primary px-5 py-2 rounded-sm font-serif font-medium hover:bg-burnt-hover disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              Ask &rarr;
            </button>
          </div>

          {/* File context scoping */}
          <div className="flex items-center gap-2 w-full mt-1">
            <span className="font-sans text-[10px] uppercase tracking-wider text-ink-muted shrink-0">
              Scope to file
            </span>
            <FileContextPicker
              repoId={repoId}
              value={fileContextPath}
              onChange={setFileContextPath}
            />
            {fileContextPath && (
              <span className="flex items-center gap-1.5 bg-burnt/10 border border-burnt/30 rounded-full px-2.5 py-0.5 font-mono text-[10px] text-burnt shrink-0">
                <FileCode size={10} />
                {fileContextPath.split("/").pop()}
              </span>
            )}
          </div>

          <div className="flex w-full items-center justify-start gap-4 mt-1">
            {["Include code snippets", "Deep trace", "Show graph"].map(
              (toggle) => (
                <label
                  key={toggle}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="accent-burnt rounded-sm"
                    defaultChecked={toggle === "Include code snippets"}
                  />
                  <span className="font-sans text-[11px] uppercase tracking-wider text-ink-muted">
                    {toggle}
                  </span>
                </label>
              ),
            )}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-16 pb-24 animate-fade-in">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div
                  key={i}
                  className="bg-warm-secondary border-l-4 border-burnt p-6 rounded-r-md"
                >
                  <p className="font-serif italic text-ink-primary text-xl">
                    "{msg.text}"
                  </p>
                </div>
              );
            }

            // Assistant message
            return (
              <div key={i} className="flex flex-col gap-10">
                {/* FLOW TRACE */}
                {msg.chunks && msg.chunks.length > 0 && (
                  <div>
                    <h4 className="section-label mb-4">FLOW TRACE</h4>
                    <FlowTrace chunks={msg.chunks} />
                  </div>
                )}

                {/* GRAPH CONTEXT */}
                {msg.chunks && msg.chunks.length > 0 && (
                  <div>
                    <h4 className="section-label mb-4">GRAPH CONTEXT</h4>
                    <QueryGraphContext repoId={repoId} chunks={msg.chunks} />
                  </div>
                )}

                {/* EXPLANATION */}
                <div>
                  <h4 className="section-label mb-4">EXPLANATION</h4>
                  {msg.text ? (
                    <MarkdownResponse text={msg.text} />
                  ) : streaming && i === messages.length - 1 ? (
                    <p className="font-serif text-ink-muted text-lg animate-pulse">
                      Thinking…
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Fixed bottom input for followups */}
          <div className="fixed bottom-0 left-[260px] right-0 bg-warm-primary border-t border-warm-divider p-4 z-20 shadow-[0_-10px_40px_rgba(245,240,232,0.8)]">
            <div className="max-w-[760px] mx-auto flex flex-col gap-2">
              {/* File context row */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-[10px] uppercase tracking-wider text-ink-muted shrink-0">
                  Scope
                </span>
                <FileContextPicker
                  repoId={repoId}
                  value={fileContextPath}
                  onChange={setFileContextPath}
                />
                {fileContextPath && (
                  <span className="flex items-center gap-1.5 bg-burnt/10 border border-burnt/30 rounded-full px-2.5 py-0.5 font-mono text-[10px] text-burnt shrink-0">
                    <FileCode size={10} />
                    {fileContextPath.split("/").pop()}
                  </span>
                )}
              </div>
              {/* Input row */}
              <div className="relative flex items-center">
                <input
                  className="w-full bg-warm-secondary border border-warm-divider rounded-full focus:border-burnt outline-none px-6 py-3 font-serif text-ink-primary pr-32 placeholder:text-ink-muted transition-colors"
                  placeholder="Ask a follow-up question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendQuestion(input);
                    }
                  }}
                />
                <button
                  onClick={() => sendQuestion(input)}
                  disabled={!input.trim() || streaming}
                  className="absolute right-2 top-1.5 bottom-1.5 bg-burnt text-warm-primary px-4 rounded-full font-serif font-medium hover:bg-burnt-hover disabled:opacity-50 transition-colors flex items-center"
                >
                  <Send size={14} className="mr-2" /> Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
