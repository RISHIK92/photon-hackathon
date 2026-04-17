"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Pin as PinIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import BreadcrumbTrail from "@/components/BreadcrumbTrail";
import QueryPanel from "@/components/QueryPanel";
import AnnotationPanel from "@/components/AnnotationPanel";
import CodeViewer from "@/components/CodeViewer";
import { type CitedChunk, type Pin } from "@/lib/api";
import React from "react";

export default function QueryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [newPin, setNewPin] = useState<Pin | undefined>(undefined);
  const [openFile, setOpenFile] = useState<{ path: string; lines?: [number, number] } | null>(null);
  const [activeTab, setActiveTab] = useState<"query" | "pins">("query");

  function handleCitationClick(chunk: CitedChunk) {
    setOpenFile({ path: chunk.path, lines: [chunk.start_line, chunk.end_line] });
  }

  function handleNavigate(path: string, line?: number) {
    if (line) {
      setOpenFile({ path, lines: [line, line] });
    } else {
      router.push(`/repos/${id}/file/${encodeURIComponent(path)}`);
    }
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
            flexShrink: 0,
          }}
        >
          <BreadcrumbTrail
            crumbs={[
              { label: id.slice(0, 8) + "...", href: `/repos/${id}` },
              { label: "Query" },
            ]}
          />
        </div>

        {/* 3-column layout */}
        <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
          {/* Left: Pins sidebar */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: "1px solid var(--bg-card-border)",
              overflowY: "auto",
              background: "var(--bg-card)",
            }}
          >
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--bg-card-border)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
              }}
            >
              <PinIcon size={12} /> Saved Pins
            </div>
            <AnnotationPanel
              repoId={id}
              newPin={newPin}
              onNavigate={handleNavigate}
            />
          </div>

          {/* Center: Query */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              background: "var(--bg-base)",
            }}
          >
            <QueryPanel
              repoId={id}
              onCitationClick={handleCitationClick}
              onPin={setNewPin}
            />
          </div>

          {/* Right: Code preview */}
          {openFile && (
            <div
              style={{
                width: 480,
                flexShrink: 0,
                borderLeft: "1px solid var(--bg-card-border)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--bg-card-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}
              >
                Code Preview
                <button
                  onClick={() => setOpenFile(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <CodeViewer
                  repoId={id}
                  filePath={openFile.path}
                  highlightLines={openFile.lines}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
