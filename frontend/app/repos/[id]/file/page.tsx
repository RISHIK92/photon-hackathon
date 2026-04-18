"use client";

import React from "react";
import { useParams } from "next/navigation";
import FileExplorer from "@/components/FileExplorer";
import { FolderTree, FileCode } from "lucide-react";

export default function FileIndexPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-full w-full bg-[#F0EBE1] overflow-hidden">
      {/* Left explorer */}
      <div className="w-[260px] shrink-0 bg-warm-secondary border-r border-warm-divider flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-warm-divider shrink-0">
          <FolderTree size={13} className="text-burnt" />
          <span className="section-label">FILES</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileExplorer repoId={id} activePath="" />
        </div>
      </div>

      {/* Right empty state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-ink-muted">
        <FileCode size={40} className="opacity-20" />
        <p className="font-serif italic text-lg">
          Select a file to view its contents
        </p>
        <p className="font-sans text-xs opacity-60">
          Click any file in the explorer on the left
        </p>
      </div>
    </div>
  );
}
