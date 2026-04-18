"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader,
  AlertTriangle,
  Search,
  Settings2,
  Download,
  RotateCcw,
} from "lucide-react";
import DependencyGraph, {
  type DependencyGraphHandle,
} from "@/components/DependencyGraph";
import GraphContextPanel from "@/components/GraphContextPanel";
import { api, type GraphData, type GraphNode } from "@/lib/api";
import React from "react";

const FILTER_TYPES = ["function", "class", "file"] as const;
type FilterType = (typeof FILTER_TYPES)[number];

export default function GraphPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(
    new Set(),
  );
  const graphRef = useRef<DependencyGraphHandle | null>(null);

  useEffect(() => {
    setLoading(true);
    api.graph
      .get(id)
      .then(setGraphData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex h-full w-full relative bg-[#F0EBE1]">
      {/* Main Graph Area */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted">
            <Loader size={20} className="animate-spin mr-2" /> Building graph...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-muted">
            <AlertTriangle size={32} className="text-error mb-2" />
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && graphData && (
          <DependencyGraph
            data={graphData}
            onNodeClick={setSelectedNode}
            selectedNodeId={selectedNode?.id}
            searchQuery={searchQuery}
            activeFilters={activeFilters.size > 0 ? activeFilters : undefined}
            onReady={(h) => {
              graphRef.current = h;
            }}
          />
        )}
      </div>

      {/* Floating Control Panel (Top-Left) */}
      <div className="absolute top-4 left-4 w-64 bg-warm-primary/95 backdrop-blur border border-warm-divider shadow-md rounded-md p-4 z-10">
        <h4 className="section-label mb-3">CONTROLS</h4>
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes…"
              className="w-full bg-warm-secondary border border-warm-divider rounded-sm text-ink-primary font-mono text-xs pl-8 pr-3 py-1.5 focus:border-burnt outline-none placeholder:text-ink-muted"
            />
          </div>

          {/* Filter pills */}
          <div>
            <span className="section-label block mb-1.5">SHOW</span>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TYPES.map((f) => {
                const active = activeFilters.has(f);
                return (
                  <button
                    key={f}
                    onClick={() => {
                      setActiveFilters((prev) => {
                        const next = new Set(prev);
                        active ? next.delete(f) : next.add(f);
                        return next;
                      });
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border transition-colors capitalize
                      ${
                        active
                          ? "bg-burnt text-warm-primary border-burnt"
                          : "border-warm-divider text-ink-muted hover:border-burnt hover:text-burnt"
                      }`}
                  >
                    {f}s
                  </button>
                );
              })}
              {activeFilters.size > 0 && (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="px-2 py-0.5 rounded-full text-[11px] font-sans text-ink-muted hover:text-burnt"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          <div className="divider-line" />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => graphRef.current?.resetView()}
              className="flex items-center gap-1.5 text-xs font-sans text-ink-muted hover:text-burnt transition-colors"
            >
              <RotateCcw size={11} /> Reset View
            </button>
            <button
              onClick={() => graphRef.current?.exportPng()}
              className="flex items-center gap-1.5 text-xs font-sans text-ink-muted hover:text-burnt transition-colors"
            >
              <Download size={11} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Slide-in Detail Panel */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-[340px] bg-warm-secondary border-l border-warm-divider flex flex-col z-20 shadow-xl shadow-black/5">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-warm-divider shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-burnt/10 text-burnt px-2 py-0.5 rounded-sm font-sans tracking-wider uppercase text-[10px] border border-burnt/20 shrink-0">
                {selectedNode.label?.includes("()") ? "FUNCTION" : "FILE"}
              </span>
              <span className="font-mono text-xs text-ink-muted truncate">
                {selectedNode.path.split("/").pop()}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-ink-muted hover:text-ink-primary text-xl leading-none ml-2 shrink-0"
            >
              &times;
            </button>
          </div>

          {/* Scrollable body — real deps + impact from GraphContextPanel */}
          <div className="flex-1 overflow-y-auto">
            <GraphContextPanel
              repoId={id}
              node={selectedNode}
              onNavigate={(path) => router.push(`/repos/${id}/file/${path}`)}
            />
          </div>

          {/* Footer CTA */}
          <div className="px-5 py-3 border-t border-warm-divider shrink-0">
            <button
              className="text-burnt font-sans text-sm font-medium hover:underline flex items-center gap-1"
              onClick={() =>
                router.push(`/repos/${id}/query?node=${selectedNode.id}`)
              }
            >
              Ask AI about this &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
