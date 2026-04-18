"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { api, type FileTreeNode } from "@/lib/api";

// Map extensions → colour accents
const EXT_COLOR: Record<string, string> = {
  py: "#3B82F6",
  js: "#EAB308",
  ts: "#3B82F6",
  tsx: "#06B6D4",
  jsx: "#F97316",
  go: "#10B981",
  rs: "#EF4444",
  java: "#F59E0B",
  cpp: "#8B5CF6",
  c: "#8B5CF6",
  md: "#9E9488",
  json: "#6EE7B7",
  yaml: "#FCD34D",
  yml: "#FCD34D",
  toml: "#FB923C",
  html: "#F97316",
  css: "#38BDF8",
  sh: "#34D399",
};

function fileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}
function fileColor(name: string) {
  return EXT_COLOR[fileExt(name)] ?? "#9E9488";
}

interface TreeNodeProps {
  node: FileTreeNode;
  repoId: string;
  activePath: string;
  depth: number;
}

function TreeNode({ node, repoId, activePath, depth }: TreeNodeProps) {
  const router = useRouter();
  const [open, setOpen] = useState(depth === 0);

  const indent = depth * 14;

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center w-full gap-1.5 py-[3px] pr-2 rounded-sm hover:bg-warm-primary transition-colors group"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {open ? (
            <ChevronDown size={11} className="text-ink-muted shrink-0" />
          ) : (
            <ChevronRight size={11} className="text-ink-muted shrink-0" />
          )}
          {open ? (
            <FolderOpen size={13} className="text-burnt/70 shrink-0" />
          ) : (
            <Folder size={13} className="text-burnt/50 shrink-0" />
          )}
          <span className="font-sans text-[12px] text-ink-secondary group-hover:text-ink-primary truncate">
            {node.name}
          </span>
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                repoId={repoId}
                activePath={activePath}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activePath === node.path;
  const color = fileColor(node.name);

  return (
    <button
      onClick={() => router.push(`/repos/${repoId}/file/${node.path}`)}
      className={`flex items-center w-full gap-1.5 py-[3px] pr-2 rounded-sm transition-colors group
        ${
          isActive
            ? "bg-burnt/10 border-l-[2px] border-burnt"
            : "border-l-[2px] border-transparent hover:bg-warm-primary"
        }`}
      style={{ paddingLeft: `${indent + 8}px` }}
    >
      <FileCode size={12} className="shrink-0" style={{ color }} />
      <span
        className={`font-mono text-[11px] truncate ${
          isActive
            ? "text-burnt font-semibold"
            : "text-ink-muted group-hover:text-ink-primary"
        }`}
      >
        {node.name}
      </span>
    </button>
  );
}

interface FileExplorerProps {
  repoId: string;
  activePath?: string;
}

export default function FileExplorer({
  repoId,
  activePath = "",
}: FileExplorerProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    api.files
      .tree(repoId)
      .then((res) => setTree(res.tree))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [repoId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-ink-muted text-xs font-sans">
        <Loader2 size={13} className="animate-spin" /> Loading files…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-6 text-ink-muted text-xs font-sans">
        <AlertTriangle size={16} />
        <span>Could not load files</span>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <p className="px-4 py-6 text-ink-muted text-xs font-serif italic">
        No files found.
      </p>
    );
  }

  return (
    <div className="py-2 px-1">
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          repoId={repoId}
          activePath={activePath}
          depth={0}
        />
      ))}
    </div>
  );
}
