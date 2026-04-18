"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphData, GraphNode } from "@/lib/api";

function inferNodeType(label: string): "function" | "class" | "file" {
  if (label.includes("()")) return "function";
  if (/[A-Z]/.test(label[0]) && !label.includes(".")) return "class";
  return "file";
}

interface DependencyGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string;
}

export default function DependencyGraph({
  data,
  onNodeClick,
  selectedNodeId,
}: DependencyGraphProps) {
  // Memoize build to accept selectedNodeId for opacity tracking
  const { initialNodes, initialEdges } = useMemo(() => {
    // Determine connected nodes if a node relies on selection
    const connectedEdges = data.edges.filter(e => e.source === selectedNodeId || e.target === selectedNodeId);
    const connectedNodeIds = new Set<string>();
    if (selectedNodeId) {
      connectedNodeIds.add(selectedNodeId);
      connectedEdges.forEach(e => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
      });
    }

    const n: Node[] = data.nodes.map((gn) => {
      const isSelected = selectedNodeId === gn.id;
      const isConnected = selectedNodeId ? connectedNodeIds.has(gn.id) : true;
      const opacity = isConnected ? 1 : 0.2;
      
      const type = inferNodeType(gn.label || gn.path);
      let background = type === "file" ? "#E6DFD3" : "#EDE8DE";
      let border = type === "file" ? "1px solid #9E9488" : "1.5px solid #C4621D";
      let borderRadius = type === "file" ? "8px" : "50%";
      let color = "#2C2826";
      
      if (type === "class") {
        border = "3px double #C4621D";
      }

      if (isSelected) {
        background = "rgba(196,98,29,0.15)";
      }

      return {
        id: gn.id,
        type: "default",
        position: { x: (gn.x ?? 0) * 3, y: (gn.y ?? 0) * 3 },
        data: { label: gn.label || gn.path.split("/").pop(), node: gn },
        style: {
          background,
          border,
          borderRadius,
          color,
          fontSize: 10,
          fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
          padding: type === "file" ? "6px 12px" : "10px 10px",
          textAlign: "center",
          opacity,
          transition: "all 0.2s ease",
          minWidth: type === "function" || type === "class" ? 50 : 80,
          aspectRatio: type !== "file" ? "1/1" : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
      };
    });

    const e: Edge[] = data.edges.map((edge, i) => {
      const isConnected = selectedNodeId ? (edge.source === selectedNodeId || edge.target === selectedNodeId) : true;
      const opacity = isConnected ? 1 : 0.1;
      
      let strokeDasharray = "none";
      let stroke = "#C4621D"; // default CALLS
      
      if (edge.type === "imports" || edge.type === "IMPORTS") {
        stroke = "#9E9488";
        strokeDasharray = "4 4";
      } else if (edge.type === "defines" || edge.type === "DEFINES") {
        strokeDasharray = "2 4";
        opacity === 1 ? 0.6 : 0.1;
      }

      return {
        id: `e-${i}-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: isConnected ? edge.type : "",
        labelStyle: { fontSize: 8, fill: "#7A7066", fontFamily: 'sans-serif' },
        style: { stroke, strokeWidth: isConnected ? 1.5 : 1, strokeDasharray, opacity, transition: "opacity 0.2s ease" },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        animated: false,
      };
    });

    return { initialNodes: n, initialEdges: e };
  }, [data, selectedNodeId]);

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
    <div className="w-full h-full rounded-md overflow-hidden bg-[#F0EBE1]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={3}
      >
        <Background color="#E6DFD3" gap={32} size={1} />
        <Controls showInteractive={false} className="bg-warm-secondary border border-warm-divider shadow-sm rounded-sm" />
      </ReactFlow>
    </div>
  );
}
