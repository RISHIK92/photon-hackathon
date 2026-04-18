"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphData, GraphNode } from "@/lib/api";
import React from "react";

function inferNodeType(label: string): "function" | "class" | "file" {
  if (label.includes("()")) return "function";
  if (/[A-Z]/.test(label[0]) && !label.includes(".")) return "class";
  return "file";
}

export interface DependencyGraphHandle {
  resetView: () => void;
  exportPng: () => void;
}

interface DependencyGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string;
  searchQuery?: string;
  activeFilters?: Set<string>;
  onReady?: (handle: DependencyGraphHandle) => void;
}

// Inner component — has access to useReactFlow
function GraphInner({
  data,
  onNodeClick,
  selectedNodeId,
  searchQuery = "",
  activeFilters,
  onReady,
}: DependencyGraphProps) {
  const { fitView, getViewport } = useReactFlow();
  const handleRef = useRef<DependencyGraphHandle | null>(null);

  // Expose handle once
  useEffect(() => {
    const handle: DependencyGraphHandle = {
      resetView: () => fitView({ padding: 0.2, duration: 400 }),
      exportPng: () => {
        const svgEl = document.querySelector(
          ".react-flow__renderer svg",
        ) as SVGSVGElement | null;
        if (!svgEl) return;
        const serializer = new XMLSerializer();
        const src =
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(serializer.serializeToString(svgEl));
        const a = document.createElement("a");
        a.href = src;
        a.download = "dependency-graph.svg";
        a.click();
      },
    };
    handleRef.current = handle;
    onReady?.(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const sq = searchQuery.toLowerCase().trim();

    const connectedEdges = data.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId,
    );
    const connectedNodeIds = new Set<string>();
    if (selectedNodeId) {
      connectedNodeIds.add(selectedNodeId);
      connectedEdges.forEach((e) => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
      });
    }

    const n: Node[] = data.nodes
      .filter((gn) => {
        const type = inferNodeType(gn.label || gn.path);
        if (activeFilters && activeFilters.size > 0 && !activeFilters.has(type))
          return false;
        return true;
      })
      .map((gn) => {
        const isSelected = selectedNodeId === gn.id;
        const isConnected = selectedNodeId ? connectedNodeIds.has(gn.id) : true;
        const label = gn.label || gn.path.split("/").pop() || gn.id;
        const matchesSearch =
          !sq ||
          label.toLowerCase().includes(sq) ||
          gn.path.toLowerCase().includes(sq);

        const type = inferNodeType(label);

        // High-contrast colour scheme
        let background: string;
        let border: string;
        let color: string;
        let borderRadius: string;

        if (isSelected) {
          background = "#C4621D";
          border = "2.5px solid #8B4513";
          color = "#FFFFFF";
          borderRadius = type === "file" ? "8px" : "50%";
        } else if (type === "function") {
          background = "#7A4F3A";
          border = "2px solid #C4621D";
          color = "#F5EDE3";
          borderRadius = "50%";
        } else if (type === "class") {
          background = "#2C2826";
          border = "2.5px solid #C4621D";
          color = "#F5EDE3";
          borderRadius = "6px";
        } else {
          // file
          background = "#C5B49A";
          border = "1.5px solid #7A6A58";
          color = "#FFFFFF";
          borderRadius = "8px";
        }

        // Dim non-connected nodes; hide non-matching search
        let opacity = isConnected ? 1 : 0.15;
        if (sq && !matchesSearch) opacity = Math.min(opacity, 0.08);
        if (sq && matchesSearch) opacity = 1;

        return {
          id: gn.id,
          type: "default",
          position: { x: (gn.x ?? 0) * 3, y: (gn.y ?? 0) * 3 },
          data: { label, node: gn },
          style: {
            background,
            border,
            borderRadius,
            color,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontWeight: isSelected ? 700 : 600,
            padding: "10px 16px",
            textAlign: "center" as const,
            opacity,
            transition: "all 0.15s ease",
            width: "auto",
            height: "auto",
            whiteSpace: "nowrap" as const,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1.4,
            boxShadow: isSelected
              ? "0 0 0 4px rgba(196,98,29,0.4), 0 6px 16px rgba(0,0,0,0.3)"
              : "0 3px 8px rgba(0,0,0,0.22)",
          },
        };
      });

    const visibleNodeIds = new Set(n.map((nd) => nd.id));

    const e: Edge[] = data.edges
      .filter(
        (edge) =>
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
      )
      .map((edge, i) => {
        const isConnected = selectedNodeId
          ? edge.source === selectedNodeId || edge.target === selectedNodeId
          : true;
        const opacity = isConnected ? 1 : 0.12;

        let stroke = "#C4621D";
        let strokeWidth = isConnected ? 3 : 1.5;
        let strokeDasharray = "none";

        if (edge.type === "imports" || edge.type === "IMPORTS") {
          stroke = "#5A4E44";
          strokeWidth = isConnected ? 2.5 : 1;
          strokeDasharray = "6 4";
        } else if (edge.type === "defines" || edge.type === "DEFINES") {
          stroke = "#8B6914";
          strokeWidth = isConnected ? 2 : 1;
          strokeDasharray = "3 4";
        }

        return {
          id: `e-${i}-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: isConnected ? edge.type : "",
          labelStyle: {
            fontSize: 10,
            fill: "#3A2E26",
            fontFamily: "monospace",
            fontWeight: 700,
          },
          labelBgStyle: { fill: "#F0EBE1", fillOpacity: 0.9 },
          style: {
            stroke,
            strokeWidth,
            strokeDasharray,
            opacity,
            transition: "opacity 0.15s ease",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
            width: 20,
            height: 20,
          },
          animated: false,
        };
      });

    return { initialNodes: n, initialEdges: e };
  }, [data, selectedNodeId, searchQuery, activeFilters]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.data.node as GraphNode);
    },
    [onNodeClick],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.05}
      maxZoom={4}
    >
      <Background color="#D9CFBF" gap={28} size={1.5} />
      <Controls
        showInteractive={false}
        className="bg-warm-secondary border border-warm-divider shadow-sm rounded-sm"
      />
    </ReactFlow>
  );
}

export default function DependencyGraph(props: DependencyGraphProps) {
  return (
    <div className="w-full h-full rounded-md overflow-hidden bg-[#F0EBE1]">
      <ReactFlowProvider>
        <GraphInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
