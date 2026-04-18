"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  ArrowDownToLine,
  ArrowUpToLine,
  GitBranch,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import type { GraphNode, ImpactAnalysis } from "@/lib/api";
import { api } from "@/lib/api";
import { langColor } from "@/lib/utils";
import React from "react";

interface GraphContextPanelProps {
  repoId: string;
  node: GraphNode | null;
  onNavigate?: (path: string) => void;
}

const RISK_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  LOW: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/30",
  },
  MEDIUM: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/30",
  },
  HIGH: {
    bg: "bg-red-500/10",
    text: "text-red-600",
    border: "border-red-500/30",
  },
};
const RISK_BAR: Record<string, string> = {
  LOW: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-red-500",
};

function ImpactPanel({ repoId, nodeId }: { repoId: string; nodeId: string }) {
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAffected, setShowAffected] = useState(false);
  const [showUpstream, setShowUpstream] = useState(false);

  useEffect(() => {
    setLoading(true);
    setImpact(null);
    api.graph
      .getImpact(repoId, nodeId)
      .then(setImpact)
      .catch(() => setImpact(null))
      .finally(() => setLoading(false));
  }, [repoId, nodeId]);

  if (loading)
    return (
      <div className="flex items-center gap-2 text-ink-muted text-sm font-sans py-2">
        <Loader2 size={13} className="animate-spin" /> Analysing impact…
      </div>
    );
  if (!impact)
    return (
      <p className="text-ink-muted text-sm font-serif italic">
        No impact data available.
      </p>
    );

  const risk = RISK_COLORS[impact.risk_level] ?? RISK_COLORS.MEDIUM;
  const bar = RISK_BAR[impact.risk_level] ?? RISK_BAR.MEDIUM;

  return (
    <div className="flex flex-col gap-4">
      {/* Score bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="section-label">REPO PERCENTILE</span>
          <span className={`text-base font-bold ${risk.text}`}>
            {impact.impact_score}
            <span className="text-[10px] opacity-70">th</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-warm-divider overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${bar}`}
            style={{ width: `${impact.impact_score}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-muted mt-1">
          More critical than {impact.impact_score}% of{" "}
          {impact.total_modules_in_repo} modules
        </p>
      </div>

      {/* Risk badge */}
      <span
        className={`inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-bold border ${risk.bg} ${risk.text} ${risk.border}`}
      >
        {impact.risk_emoji} {impact.risk_level} RISK
      </span>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Affected", value: impact.metrics.affected_count },
          { label: "Dependents", value: impact.metrics.upstream_count },
          { label: "Max Depth", value: impact.metrics.max_depth },
          { label: "Fan-Out", value: impact.metrics.fan_out },
          { label: "Fan-In", value: impact.metrics.fan_in },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-warm-primary border border-warm-divider rounded-sm p-2.5"
          >
            <div className="text-lg font-bold text-ink-primary">{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-muted">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <p className="text-xs text-ink-secondary font-serif leading-relaxed">
        {impact.explanation}
      </p>

      {/* Downstream */}
      {impact.affected_nodes.length > 0 && (
        <div>
          <button
            onClick={() => setShowAffected((v) => !v)}
            className="flex items-center gap-1.5 section-label text-ink-muted hover:text-ink-primary"
          >
            <ArrowDownToLine size={11} /> Downstream (
            {impact.affected_nodes.length})
            {showAffected ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showAffected && (
            <div className="flex flex-col gap-1 mt-2">
              {impact.affected_nodes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-sm px-2 py-1"
                >
                  <span className="font-mono text-[11px] text-red-600 truncate">
                    {n.path.split("/").pop()}
                  </span>
                  <span className="text-[10px] text-ink-muted shrink-0 ml-2">
                    depth {n.depth}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upstream */}
      {impact.upstream_nodes.length > 0 && (
        <div>
          <button
            onClick={() => setShowUpstream((v) => !v)}
            className="flex items-center gap-1.5 section-label text-ink-muted hover:text-ink-primary"
          >
            <ArrowUpToLine size={11} /> Dependents (
            {impact.upstream_nodes.length})
            {showUpstream ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showUpstream && (
            <div className="flex flex-col gap-1 mt-2">
              {impact.upstream_nodes.map((n) => (
                <div
                  key={n.id}
                  className="bg-amber-500/5 border border-amber-500/20 rounded-sm px-2 py-1 font-mono text-[11px] text-amber-600 truncate"
                >
                  {n.path.split("/").pop()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GraphContextPanel({
  repoId,
  node,
  onNavigate,
}: GraphContextPanelProps) {
  const [importers, setImporters] = useState<GraphNode[]>([]);
  const [importees, setImportees] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"deps" | "impact">("deps");

  useEffect(() => {
    if (!node) return;
    setTab("deps");
    setLoading(true);
    api.graph
      .getSubgraph(repoId, node.id)
      .then((data) => {
        const edgeTargets = new Set(
          data.edges.filter((e) => e.source === node.id).map((e) => e.target),
        );
        const edgeSources = new Set(
          data.edges.filter((e) => e.target === node.id).map((e) => e.source),
        );
        const others = data.nodes.filter((n) => n.id !== node.id);
        setImportees(others.filter((n) => edgeTargets.has(n.id)));
        setImporters(others.filter((n) => edgeSources.has(n.id)));
      })
      .catch(() => {
        setImporters([]);
        setImportees([]);
      })
      .finally(() => setLoading(false));
  }, [node, repoId]);

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 text-ink-muted">
        <GitBranch size={28} className="opacity-30" />
        <p className="text-sm font-serif italic">Click a node to inspect it</p>
      </div>
    );
  }

  const color = langColor(node.language);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Node header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span className="font-mono text-sm text-ink-primary font-semibold truncate">
            {node.label || node.path.split("/").pop()}
          </span>
        </div>
        <p className="font-mono text-[11px] text-ink-muted break-all leading-relaxed">
          {node.path}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-warm-primary border border-warm-divider rounded-sm p-2.5">
          <div className="text-sm font-bold text-ink-primary">
            {node.language || "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">
            Language
          </div>
        </div>
        <div className="bg-warm-primary border border-warm-divider rounded-sm p-2.5">
          <div className="text-sm font-bold text-ink-primary">
            {node.size_bytes
              ? `${(node.size_bytes / 1024).toFixed(1)} KB`
              : "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">
            File size
          </div>
        </div>
      </div>

      {/* Open file button */}
      <button
        className="flex items-center justify-center gap-2 w-full border border-warm-divider rounded-sm py-1.5 text-xs font-sans text-ink-muted hover:text-burnt hover:border-burnt transition-colors"
        onClick={() => onNavigate?.(node.path)}
      >
        <ExternalLink size={12} /> View File
      </button>

      {/* Tab switcher */}
      <div className="flex rounded-sm overflow-hidden border border-warm-divider">
        {(["deps", "impact"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors
              ${
                tab === t
                  ? "bg-burnt text-warm-primary"
                  : "bg-warm-primary text-ink-muted hover:text-ink-primary"
              }`}
          >
            {t === "deps" ? <GitBranch size={11} /> : <Zap size={11} />}
            {t === "deps" ? "Deps" : "Impact"}
          </button>
        ))}
      </div>

      {tab === "deps" && (
        <>
          <div className="divider-line" />

          {/* Imported By */}
          <div>
            <div className="flex items-center gap-1.5 section-label mb-3">
              <ArrowDownToLine size={12} /> IMPORTED BY ({importers.length})
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-ink-muted text-xs font-sans">
                <Loader2 size={12} className="animate-spin" /> Loading…
              </div>
            ) : importers.length === 0 ? (
              <p className="font-serif italic text-ink-muted text-xs">
                — Not actively imported —
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {importers.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onNavigate?.(n.path)}
                    className="text-left bg-warm-primary border border-warm-divider rounded-sm px-3 py-1.5 font-mono text-[11px] text-ink-secondary hover:text-burnt hover:border-burnt/40 transition-colors truncate"
                  >
                    {n.label || n.path.split("/").pop()}
                    <span className="text-ink-muted text-[10px] ml-1 font-sans">
                      {n.path.includes("/")
                        ? n.path.split("/").slice(0, -1).join("/") + "/"
                        : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="divider-line" />

          {/* Imports */}
          <div>
            <div className="flex items-center gap-1.5 section-label mb-3">
              <ArrowUpToLine size={12} /> IMPORTS ({importees.length})
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-ink-muted text-xs font-sans">
                <Loader2 size={12} className="animate-spin" /> Loading…
              </div>
            ) : importees.length === 0 ? (
              <p className="font-serif italic text-ink-muted text-xs">
                — No outgoing imports —
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {importees.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onNavigate?.(n.path)}
                    className="text-left bg-warm-primary border border-warm-divider rounded-sm px-3 py-1.5 font-mono text-[11px] text-ink-secondary hover:text-burnt hover:border-burnt/40 transition-colors truncate"
                  >
                    {n.label || n.path.split("/").pop()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "impact" && (
        <>
          <div className="divider-line" />
          <ImpactPanel repoId={repoId} nodeId={node.id} />
        </>
      )}
    </div>
  );
}
