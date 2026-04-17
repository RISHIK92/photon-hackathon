"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BreadcrumbTrail from "@/components/BreadcrumbTrail";
import CodeViewer from "@/components/CodeViewer";
import React from "react";

export default function FileViewerPage() {
  const params = useParams<{ id: string; path: string[] }>();
  const repoId = params.id;
  // Next.js catch-all routes give path as string[]
  const filePath = Array.isArray(params.path)
    ? params.path.map(decodeURIComponent).join("/")
    : decodeURIComponent(params.path ?? "");

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
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
              { label: repoId.slice(0, 8) + "...", href: `/repos/${repoId}` },
              { label: "Files" },
              { label: filePath },
            ]}
          />
        </div>

        {/* Code viewer fills remaining height */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <CodeViewer repoId={repoId} filePath={filePath} />
        </div>
      </div>
    </div>
  );
}
