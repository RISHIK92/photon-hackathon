"use client";

import { useState, useEffect } from "react";
import { Loader, Code, Hash } from "lucide-react";
import { api } from "@/lib/api";
import React from "react";

interface CodeViewerProps {
  repoId: string;
  filePath: string;
  highlightLines?: [number, number];
}

export default function CodeViewer({ repoId, filePath, highlightLines }: CodeViewerProps) {
  const [content, setContent] = useState<string>("");
  const [language, setLanguage] = useState("text");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setError(null);
    api.files.get(repoId, filePath)
      .then(({ content: c, language: l }) => {
        setContent(c);
        setLanguage(l);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [repoId, filePath]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: "100%", gap: "0.5rem", color: "var(--text-muted)" }}>
        <Loader size={18} className="animate-spin" />
        Loading file...
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <p style={{ color: "var(--error)" }}>Error: {error}</p>
      </div>
    );
  }

  const lines = content.split("\n");
  const [hlStart, hlEnd] = highlightLines ?? [0, 0];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 1rem",
          borderBottom: "1px solid var(--bg-card-border)",
          background: "var(--bg-elevated)",
        }}
      >
        <Code size={14} style={{ color: "var(--yasml-primary)" }} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filePath}
        </span>
        <span
          className="badge badge-ingesting"
          style={{ textTransform: "lowercase", fontFamily: "'JetBrains Mono', monospace" }}
        >
          {language}
        </span>
      </div>

      {/* Code */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.78rem",
            lineHeight: 1.7,
          }}
        >
          <tbody>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const isHighlighted = hlStart > 0 && lineNum >= hlStart && lineNum <= hlEnd;
              return (
                <tr
                  key={i}
                  id={`L${lineNum}`}
                  style={{
                    background: isHighlighted
                      ? "rgba(99,102,241,0.12)"
                      : "transparent",
                    borderLeft: isHighlighted
                      ? "2px solid var(--yasml-primary)"
                      : "2px solid transparent",
                  }}
                >
                  <td
                    style={{
                      color: "var(--text-muted)",
                      userSelect: "none",
                      textAlign: "right",
                      padding: "0 0.75rem",
                      minWidth: 48,
                      opacity: 0.5,
                    }}
                  >
                    {lineNum}
                  </td>
                  <td style={{ padding: "0 1rem 0 0.5rem", color: "var(--text-primary)", whiteSpace: "pre" }}>
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
