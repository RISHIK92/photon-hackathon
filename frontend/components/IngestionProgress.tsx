"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeJobStream, type SSEEvent } from "@/lib/sse";
import { api } from "@/lib/api";
import React from "react";

interface IngestionProgressProps {
  jobId: string;
  repoId: string;
  onComplete: () => void;
  onError: (msg: string) => void;
}

const PHASES: { key: string; label: string; roman: string; desc: string }[] = [
  {
    key: "cloning",
    roman: "I",
    label: "Fetch",
    desc: "Cloning repository source",
  },
  {
    key: "scanning",
    roman: "II",
    label: "Scan",
    desc: "Building file manifest",
  },
  {
    key: "parsing",
    roman: "III",
    label: "Parse",
    desc: "Extracting AST symbols",
  },
  {
    key: "graphing",
    roman: "IV",
    label: "Graph",
    desc: "Linking dependency edges",
  },
  {
    key: "embedding",
    roman: "V",
    label: "Embed",
    desc: "Generating vector embeddings",
  },
  {
    key: "finalizing",
    roman: "VI",
    label: "Index",
    desc: "Finalizing knowledge base",
  },
  { key: "done", roman: "✓", label: "Ready", desc: "Repository indexed" },
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
  const [phase, setPhase] = useState("cloning");
  const [message, setMessage] = useState("Connecting to ingestion worker...");
  const [failed, setFailed] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    const streamUrl = api.jobs.streamUrl(jobId);
    abortRef.current = subscribeJobStream(streamUrl, (event: SSEEvent) => {
      const {
        phase: p,
        progress: prog,
        message: msg,
      } = event as unknown as {
        phase: string;
        progress: number;
        message: string;
      };
      if (p) setPhase(p);
      if (typeof prog === "number") setProgress(prog);
      if (msg) {
        setMessage(msg);
        setLogs((prev) => [...prev.slice(-79), msg]);
      }
      if (p === "done") setTimeout(onComplete, 900);
      else if (p === "failed") {
        setFailed(true);
        onError(msg ?? "Ingestion failed");
      }
    });
    return () => abortRef.current?.abort();
  }, [jobId, onComplete, onError]);

  useEffect(() => {
    logsRef.current?.scrollTo({
      top: logsRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [logs]);

  const currentIdx = phaseIndex(phase);
  const isDone = phase === "done";
  const isFailed = failed;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="section-label mb-2">INDEXING IN PROGRESS</p>
          <h2 className="font-serif text-4xl text-ink-primary leading-tight">
            {isFailed ? (
              <>
                <span className="italic text-red-600">Failed</span> — something
                went wrong
              </>
            ) : isDone ? (
              <>
                <span className="italic text-burnt">Complete</span> — ready to
                explore
              </>
            ) : (
              <>
                Building your
                <br />
                <span className="italic text-burnt">knowledge graph</span>
              </>
            )}
          </h2>
        </div>

        {/* Circular progress dial */}
        <div className="relative shrink-0 ml-8">
          <svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            className="-rotate-90"
          >
            {/* Track */}
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="rgba(154,144,132,0.2)"
              strokeWidth="4"
            />
            {/* Progress arc */}
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke={isFailed ? "#dc2626" : "#C4621D"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-2xl font-medium text-ink-primary leading-none">
              {progress}
            </span>
            <span className="font-sans text-[10px] text-ink-label tracking-widest uppercase">
              pct
            </span>
          </div>
        </div>
      </div>

      <div className="divider-line mb-8" />

      {/* ── Phase Steps ── */}
      <div className="relative mb-10">
        {/* Vertical spine line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-warm-divider" />

        <div className="flex flex-col gap-0">
          {PHASES.map((p, i) => {
            const done = currentIdx > i;
            const active = currentIdx === i && !isFailed;
            const future = currentIdx < i;

            return (
              <div
                key={p.key}
                className="flex items-start gap-5 relative py-3"
                style={{
                  opacity: future ? 0.35 : 1,
                  transition: "opacity 0.4s ease",
                }}
              >
                {/* Node dot */}
                <div
                  className="relative z-10 shrink-0 flex items-center justify-center rounded-full border transition-all duration-500"
                  style={{
                    width: 46,
                    height: 46,
                    borderColor: done
                      ? "#C4621D"
                      : active
                        ? "#C4621D"
                        : "rgba(154,144,132,0.3)",
                    background: done
                      ? "#C4621D"
                      : active
                        ? "rgba(196,98,29,0.08)"
                        : "#F5F0E8",
                    boxShadow: active
                      ? "0 0 0 4px rgba(196,98,29,0.12)"
                      : "none",
                  }}
                >
                  {done ? (
                    /* Checkmark */
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="#F5F0E8"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : active ? (
                    /* Spinning ring */
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      className="animate-spin"
                    >
                      <circle
                        cx="9"
                        cy="9"
                        r="7"
                        fill="none"
                        stroke="rgba(196,98,29,0.25)"
                        strokeWidth="2"
                      />
                      <path
                        d="M9 2 A7 7 0 0 1 16 9"
                        fill="none"
                        stroke="#C4621D"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <span className="font-serif text-[11px] text-ink-label">
                      {p.roman}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="pt-2.5 flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-serif text-base font-medium"
                      style={{ color: done || active ? "#2C2826" : "#7A7066" }}
                    >
                      {p.label}
                    </span>
                    {active && (
                      <span className="font-sans text-[10px] tracking-widest uppercase text-burnt animate-pulse">
                        running
                      </span>
                    )}
                    {done && (
                      <span className="font-sans text-[10px] tracking-widest uppercase text-ink-label">
                        done
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-ink-muted mt-0.5">
                    {active ? message : p.desc}
                  </p>
                </div>

                {/* Time marker for done steps */}
                {done && (
                  <div className="pt-3 shrink-0">
                    <span className="font-mono text-[10px] text-ink-label">
                      ✓
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="divider-line mb-6" />

      {/* ── Log tail toggle ── */}
      <div>
        <button
          onClick={() => setShowLogs((v) => !v)}
          className="flex items-center gap-2 section-label hover:text-ink-primary transition-colors mb-3"
        >
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: showLogs ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
          {showLogs ? "HIDE" : "SHOW"} LOGS ({logs.length})
        </button>

        {showLogs && (
          <div
            ref={logsRef}
            className="font-mono text-[11px] text-ink-muted leading-relaxed bg-warm-tertiary border border-warm-divider rounded-md px-4 py-3 max-h-36 overflow-y-auto"
          >
            {logs.length === 0 ? (
              <span className="italic">Waiting for events…</span>
            ) : (
              logs.map((line, i) => (
                <div key={i}>
                  <span className="text-ink-label select-none mr-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Error detail ── */}
      {isFailed && (
        <div className="mt-6 border border-red-200 bg-red-50 rounded-md px-5 py-4">
          <p className="section-label text-red-500 mb-1">ERROR</p>
          <p className="font-serif text-sm text-red-700">{message}</p>
        </div>
      )}
    </div>
  );
}
