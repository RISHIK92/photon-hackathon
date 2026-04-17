"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ArrowDownToLine, ArrowUpToLine, GitBranch } from "lucide-react";
import type { GraphNode } from "@/lib/api";
import { api } from "@/lib/api";
import { formatBytes, langColor } from "@/lib/utils";
import React from "react";

interface GraphContextPanelProps {
  repoId: string;
  node: GraphNode | null;
  onNavigate?: (path: string) => void;
}

export default function GraphContextPanel({ repoId, node, onNavigate }: GraphContextPanelProps) {
  const [importers, setImporters] = useState<GraphNode[]>([]);
  const [importees, setImportees] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!node) return;
    setLoading(true);
    // Fetch subgraph to get neighbors
    api.graph.getSubgraph(repoId, node.id).then((data) => {
      const others = data.nodes.filter((n) => n.id !== node.id);
      const edgeTargets = new Set(data.edges.filter((e) => e.source === node.id).map((e) => e.target));
      const edgeSources = new Set(data.edges.filter((e) => e.target === node.id).map((e) => e.source));
      setImportees(others.filter((n) => edgeTargets.has(n.id)));
      setImporters(others.filter((n) => edgeSources.has(n.id)));
    }).finally(() => setLoading(false));
  }, [node, repoId]);

  if (!node) {
    return (
      <div className="empty-state" style={{ padding: "2rem" }}>
        <GitBranch size={28} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: "0.82rem" }}>Click a node to inspect it</p>
      </div>
    );
  }

  const color = langColor(node.language);

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Node header */}
      <div>
        <div className="flex-gap-2" style={{ marginBottom: "0.5rem" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              color: "var(--text-primary)",
              fontWeight: 600,
            }}
          >
            {node.label}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            wordBreak: "break-all",
          }}
        >
          {node.path}
        </p>
      </div>

      {/* Stats */}
      <div className="grid-2" style={{ gap: "0.5rem" }}>
        <div className="stat-card" style={{ padding: "0.75rem" }}>
          <div className="stat-value" style={{ fontSize: "1.25rem" }}>
            {node.language}
          </div>
          <div className="stat-label">Language</div>
        </div>
        <div className="stat-card" style={{ padding: "0.75rem" }}>
          <div className="stat-value" style={{ fontSize: "1.25rem" }}>
            {formatBytes(node.size_bytes)}
          </div>
          <div className="stat-label">File size</div>
        </div>
      </div>

      {/* Open file */}
      <button
        className="btn btn-ghost"
        style={{ justifyContent: "center" }}
        onClick={() => onNavigate?.(node.path)}
      >
        <ExternalLink size={14} /> View File
      </button>

      <div className="divider" />

      {/* Importers */}
      <div>
        <div
          className="flex-gap-2"
          style={{ marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          <ArrowDownToLine size={12} /> Imported by ({importers.length})
        </div>
        {loading ? (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading...</p>
        ) : importers.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No importers found</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {importers.map((n) => (
              <button
                key={n.id}
                onClick={() => onNavigate?.(n.path)}
                style={{
                  textAlign: "left",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--bg-card-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "color 0.15s",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {n.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Importees */}
      <div>
        <div
          className="flex-gap-2"
          style={{ marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          <ArrowUpToLine size={12} /> Imports ({importees.length})
        </div>
        {loading ? (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading...</p>
        ) : importees.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No imports found</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {importees.map((n) => (
              <button
                key={n.id}
                onClick={() => onNavigate?.(n.path)}
                style={{
                  textAlign: "left",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--bg-card-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "color 0.15s",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {n.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
