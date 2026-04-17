"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader, AlertTriangle, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import BreadcrumbTrail from "@/components/BreadcrumbTrail";
import DependencyGraph from "@/components/DependencyGraph";
import GraphContextPanel from "@/components/GraphContextPanel";
import { api, type GraphData, type GraphNode } from "@/lib/api";
import React from "react";

export default function GraphPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  async function fetchGraph() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.graph.get(id);
      setGraphData(data);
      setNodeCount(data.nodes.length);
      setEdgeCount(data.edges.length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGraph(); }, [id]);

  function handleNodeClick(node: GraphNode) {
    setSelectedNode(node);
  }

  function handleNavigate(path: string) {
    router.push(`/repos/${id}/file/${encodeURIComponent(path)}`);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div
          style={{
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--bg-card-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <BreadcrumbTrail
            crumbs={[
              { label: id.slice(0, 8) + "...", href: `/repos/${id}` },
              { label: "Dependency Graph" },
            ]}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {!loading && (
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {nodeCount} nodes · {edgeCount} edges
              </span>
            )}
            <button className="btn btn-ghost" onClick={fetchGraph} style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
          {/* Graph canvas */}
          <div style={{ flex: 1, position: "relative" }}>
            {loading && (
              <div className="flex-center" style={{ height: "100%", gap: "0.5rem", color: "var(--text-muted)" }}>
                <Loader size={20} className="animate-spin" /> Building graph...
              </div>
            )}
            {error && (
              <div className="empty-state" style={{ height: "100%" }}>
                <AlertTriangle size={32} style={{ color: "var(--error)" }} />
                <p style={{ color: "var(--error)" }}>{error}</p>
                <button className="btn btn-ghost" onClick={fetchGraph}>Retry</button>
              </div>
            )}
            {!loading && !error && graphData && (
              <DependencyGraph data={graphData} onNodeClick={handleNodeClick} />
            )}
          </div>

          {/* Side panel */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              borderLeft: "1px solid var(--bg-card-border)",
              overflowY: "auto",
              background: "var(--bg-card)",
            }}
          >
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--bg-card-border)",
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
              }}
            >
              Node Inspector
            </div>
            <GraphContextPanel
              repoId={id}
              node={selectedNode}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
