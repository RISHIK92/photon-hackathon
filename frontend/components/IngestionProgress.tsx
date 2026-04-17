"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { subscribeJobStream, type SSEEvent } from "@/lib/sse";
import { api } from "@/lib/api";
import React from "react";

interface IngestionProgressProps {
  jobId: string;
  repoId: string;
  onComplete: () => void;
  onError: (msg: string) => void;
}

const PHASES: { key: string; label: string }[] = [
  { key: "starting",   label: "Initializing" },
  { key: "cloning",    label: "Fetching Repository" },
  { key: "scanning",   label: "Building Manifest" },
  { key: "parsing",    label: "Parsing ASTs" },
  { key: "graphing",   label: "Building Dependency Graph" },
  { key: "embedding",  label: "Generating Embeddings" },
  { key: "finalizing", label: "Finalizing" },
  { key: "done",       label: "Complete" },
];

function phaseIndex(phase: string): number {
  return PHASES.findIndex((p) => p.key === phase);
}

export default function IngestionProgress({
  jobId,
  repoId,
  onComplete,
  onError,
}: IngestionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("starting");
  const [message, setMessage] = useState("Connecting to ingestion worker...");
  const [failed, setFailed] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const streamUrl = api.jobs.streamUrl(jobId);

    abortRef.current = subscribeJobStream(streamUrl, (event: SSEEvent) => {
      const { phase: p, progress: prog, message: msg } = event as unknown as {
        phase: string;
        progress: number;
        message: string;
      };

      if (p) setPhase(p);
      if (typeof prog === "number") setProgress(prog);
      if (msg) {
        setMessage(msg);
        setLogs((prev) => [...prev.slice(-49), `[${p ?? "?"}] ${msg}`]);
      }

      if (p === "done") {
        setTimeout(onComplete, 800);
      } else if (p === "failed") {
        setFailed(true);
        onError(msg ?? "Ingestion failed");
      }
    });

    return () => abortRef.current?.abort();
  }, [jobId, onComplete, onError]);

  // auto-scroll logs
  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  const currentPhaseIdx = phaseIndex(phase);

  return (
    <div className="card animate-fade-in" style={{ maxWidth: 580, width: "100%", padding: "2rem" }}>
      {/* Title */}
      <div className="flex-gap-2" style={{ marginBottom: "1.5rem" }}>
        {failed ? (
          <XCircle size={22} style={{ color: "var(--error)" }} />
        ) : progress === 100 ? (
          <CheckCircle size={22} style={{ color: "var(--success)" }} />
        ) : (
          <Loader size={22} className="animate-spin" style={{ color: "var(--yasml-primary)" }} />
        )}
        <div>
          <h3 style={{ marginBottom: "2px" }}>
            {failed ? "Ingestion Failed" : progress === 100 ? "Ingestion Complete!" : "Ingesting Repository"}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Job ID: {jobId.slice(0, 8)}...</p>
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="flex-between" style={{ marginBottom: "6px" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{message}</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {progress}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
              background: failed
                ? "var(--error)"
                : progress === 100
                ? "var(--success)"
                : undefined,
            }}
          />
        </div>
      </div>

      {/* Phase stepper */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1.25rem" }}>
        {PHASES.filter((p) => p.key !== "starting").map((p, i) => {
          const idx = phaseIndex(p.key);
          const done = currentPhaseIdx > idx;
          const active = currentPhaseIdx === idx;
          return (
            <div key={p.key} className="flex-gap-2" style={{ fontSize: "0.82rem" }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${done ? "var(--success)" : active ? "var(--yasml-primary)" : "rgba(255,255,255,0.1)"}`,
                  background: done ? "var(--success)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.3s",
                }}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {active && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--yasml-primary)" }} />
                )}
              </div>
              <span
                style={{
                  color: done
                    ? "var(--text-muted)"
                    : active
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Log tail */}
      {logs.length > 0 && (
        <div
          ref={logsRef}
          style={{
            background: "var(--bg-base)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--bg-card-border)",
            padding: "0.75rem 1rem",
            maxHeight: 120,
            overflowY: "auto",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.73rem",
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          {logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
