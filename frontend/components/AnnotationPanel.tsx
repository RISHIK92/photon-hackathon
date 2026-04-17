"use client";

import { useState, useEffect } from "react";
import { Pin, Trash2, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { api, type Pin as PinType } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import React from "react";

interface AnnotationPanelProps {
  repoId: string;
  newPin?: PinType;
  onNavigate?: (path: string, line?: number) => void;
}

export default function AnnotationPanel({ repoId, newPin, onNavigate }: AnnotationPanelProps) {
  const [pins, setPins] = useState<PinType[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.pins.listForRepo(repoId)
      .then(setPins)
      .finally(() => setLoading(false));
  }, [repoId]);

  useEffect(() => {
    if (newPin) {
      setPins((prev) => [newPin, ...prev.filter((p) => p.id !== newPin.id)]);
      setExpanded((prev) => new Set([...prev, newPin.id]));
    }
  }, [newPin]);

  async function removePin(id: string) {
    await api.pins.delete(id);
    setPins((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="empty-state" style={{ padding: "1.5rem" }}>
        <p style={{ fontSize: "0.8rem" }}>Loading pins...</p>
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "1.5rem" }}>
        <Pin size={28} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: "0.82rem" }}>No pins yet</p>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Ask a question and click "Pin to graph" to save insights here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p
        style={{
          fontSize: "0.72rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          marginBottom: "0.25rem",
          paddingLeft: "0.25rem",
        }}
      >
        {pins.length} Pin{pins.length !== 1 ? "s" : ""}
      </p>

      {pins.map((pin) => (
        <div
          key={pin.id}
          className="card-elevated animate-fade-in"
          style={{ padding: "0.75rem 0.9rem" }}
        >
          {/* Pin header */}
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}
            onClick={() => toggleExpand(pin.id)}
          >
            {expanded.has(pin.id) ? (
              <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
            ) : (
              <ChevronRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {pin.question}
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                {relativeTime(pin.created_at)}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removePin(pin.id); }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 2,
                borderRadius: "var(--radius-sm)",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Expanded content */}
          {expanded.has(pin.id) && (
            <div style={{ marginTop: "0.6rem", paddingLeft: "1.4rem" }}>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "0.5rem",
                }}
              >
                {pin.answer.slice(0, 280)}{pin.answer.length > 280 ? "..." : ""}
              </p>

              {/* Citations */}
              {pin.cited_refs.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {pin.cited_refs.slice(0, 4).map((ref, i) => (
                    <button
                      key={i}
                      className="citation"
                      onClick={() =>
                        onNavigate?.(ref.path, ref.start_line)
                      }
                    >
                      <ExternalLink size={10} />
                      {ref.path.split("/").pop()}:{ref.start_line}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
