"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CodeViewer from "@/components/CodeViewer";
import { api, type GraphData } from "@/lib/api";
import { Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function FileViewerPage() {
  const params = useParams<{ id: string; path: string[] }>();
  const router = useRouter();
  const repoId = params.id;

  const filePath = Array.isArray(params.path)
    ? params.path.map(decodeURIComponent).join("/")
    : decodeURIComponent(params.path ?? "");

  const [selectedFunc, setSelectedFunc] = useState<string | null>(null);
  const [subgraph, setSubgraph] = useState<GraphData | null>(null);
  const [sgLoading, setSgLoading] = useState(false);

  // Fetch subgraph for this file to get real deps/imports
  useEffect(() => {
    if (!repoId || !filePath) return;
    setSgLoading(true);
    api.graph
      .getSubgraph(repoId, filePath)
      .then(setSubgraph)
      .catch(() => setSubgraph(null))
      .finally(() => setSgLoading(false));
  }, [repoId, filePath]);

  // Derive IMPORTS (edges where this file is the source) and IMPORTED BY (edges where this file is the target)
  const thisNodeId = subgraph?.nodes.find(
    (n) => n.path === filePath || n.id === filePath,
  )?.id;

  const importsEdges =
    subgraph?.edges.filter((e) => e.source === thisNodeId) ?? [];
  const importedByEdges =
    subgraph?.edges.filter((e) => e.target === thisNodeId) ?? [];

  function nodeLabel(id: string) {
    const n = subgraph?.nodes.find((n) => n.id === id);
    if (!n) return id.split("/").pop() ?? id;
    return n.path.split("/").pop() ?? n.path;
  }

  function nodePath(id: string) {
    return subgraph?.nodes.find((n) => n.id === id)?.path ?? "";
  }
  return (
    <div className="flex h-full w-full bg-[#F0EBE1]">
      {/* Center Code Area */}
      <div className="flex-1 overflow-hidden border-r border-warm-divider bg-[#F0EBE1]">
        <CodeViewer
          repoId={repoId}
          filePath={filePath}
          onFunctionClick={(funcName) => setSelectedFunc(funcName)}
          activeFunction={selectedFunc}
        />
      </div>

      {/* Right Sidebar — real deps from Neo4j */}
      <div className="w-[320px] shrink-0 bg-warm-secondary flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-warm-divider">
          <h4 className="section-label">FILE DEPENDENCIES</h4>
          <p className="font-mono text-[10px] text-ink-muted mt-1 truncate">
            {filePath}
          </p>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-6">
          {sgLoading ? (
            <div className="flex items-center gap-2 text-ink-muted text-sm font-sans">
              <Loader2 size={14} className="animate-spin" /> Loading deps…
            </div>
          ) : (
            <>
              {/* IMPORTS — files this file depends on */}
              <div>
                <h4 className="section-label mb-3">
                  IMPORTS ({importsEdges.length})
                </h4>
                {importsEdges.length === 0 ? (
                  <p className="font-serif italic text-ink-muted text-xs">
                    — No outgoing imports —
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {importsEdges.map((e) => (
                      <li key={e.target}>
                        <button
                          onClick={() =>
                            router.push(
                              `/repos/${repoId}/file/${nodePath(e.target)}`,
                            )
                          }
                          className="flex items-start gap-2 group w-full text-left"
                        >
                          <ArrowRight
                            size={12}
                            className="text-burnt mt-0.5 shrink-0 opacity-70 group-hover:opacity-100"
                          />
                          <span className="font-mono text-[11px] text-ink-primary group-hover:text-burnt transition-colors truncate">
                            {nodeLabel(e.target)}
                          </span>
                        </button>
                        <p className="font-sans text-[10px] text-ink-muted pl-5 truncate mt-0.5">
                          {nodePath(e.target)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="divider-line" />

              {/* IMPORTED BY — files that depend on this file */}
              <div>
                <h4 className="section-label mb-3">
                  IMPORTED BY ({importedByEdges.length})
                </h4>
                {importedByEdges.length === 0 ? (
                  <p className="font-serif italic text-ink-muted text-xs">
                    — Not actively imported —
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {importedByEdges.map((e) => (
                      <li key={e.source}>
                        <button
                          onClick={() =>
                            router.push(
                              `/repos/${repoId}/file/${nodePath(e.source)}`,
                            )
                          }
                          className="flex items-start gap-2 group w-full text-left"
                        >
                          <ArrowRight
                            size={12}
                            className="text-burnt mt-0.5 shrink-0 opacity-70 group-hover:opacity-100"
                          />
                          <span className="font-mono text-[11px] text-ink-primary group-hover:text-burnt transition-colors truncate">
                            {nodeLabel(e.source)}
                          </span>
                        </button>
                        <p className="font-sans text-[10px] text-ink-muted pl-5 truncate mt-0.5">
                          {nodePath(e.source)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Neighbourhood */}
              {subgraph && subgraph.nodes.length > 1 && (
                <>
                  <div className="divider-line" />
                  <div>
                    <h4 className="section-label mb-3">
                      NEIGHBOURHOOD (
                      {subgraph.nodes.filter((n) => n.id !== thisNodeId).length}
                      )
                    </h4>
                    <ul className="flex flex-col gap-1">
                      {subgraph.nodes
                        .filter((n) => n.id !== thisNodeId)
                        .slice(0, 12)
                        .map((n) => (
                          <li key={n.id}>
                            <button
                              onClick={() =>
                                router.push(`/repos/${repoId}/file/${n.path}`)
                              }
                              className="font-mono text-[11px] text-ink-muted hover:text-burnt transition-colors truncate w-full text-left"
                            >
                              {n.path.split("/").pop()}
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
