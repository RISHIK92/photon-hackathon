"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileCode,
  Sparkles,
} from "lucide-react";
import type { LearningPath, LearningPhase, LearningPathFile } from "@/lib/api";

interface Props {
  repoId: string;
  data: LearningPath;
}

const PHASE_COLOURS = [
  "bg-[#7A4F3A]",
  "bg-[#C4621D]",
  "bg-[#2C5F4A]",
  "bg-[#3A4F7A]",
  "bg-[#6B4F7A]",
];

const PHASE_RING = [
  "border-[#7A4F3A]",
  "border-[#C4621D]",
  "border-[#2C5F4A]",
  "border-[#3A4F7A]",
  "border-[#6B4F7A]",
];

const PHASE_TEXT = [
  "text-[#7A4F3A]",
  "text-[#C4621D]",
  "text-[#2C5F4A]",
  "text-[#3A4F7A]",
  "text-[#6B4F7A]",
];

function FileRow({
  file,
  repoId,
  done,
  onToggle,
}: {
  file: LearningPathFile;
  repoId: string;
  done: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const filename = file.path.split("/").pop() ?? file.path;
  const dir = file.path.includes("/")
    ? file.path.slice(0, file.path.lastIndexOf("/"))
    : "";

  return (
    <div
      className={`rounded-lg border transition-all duration-150 ${
        done
          ? "border-warm-divider bg-warm-secondary opacity-60"
          : "border-warm-divider bg-warm-primary hover:border-burnt/40"
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Done toggle */}
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-ink-muted hover:text-burnt transition-colors"
          title={done ? "Mark as not done" : "Mark as done"}
        >
          {done ? (
            <CheckCircle2 size={16} className="text-burnt" />
          ) : (
            <Circle size={16} />
          )}
        </button>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                router.push(
                  `/repos/${repoId}/file?path=${encodeURIComponent(file.path)}`,
                )
              }
              className="font-mono text-sm text-ink-primary hover:text-burnt transition-colors truncate"
            >
              {filename}
            </button>
            {dir && (
              <span className="font-mono text-[10px] text-ink-muted truncate max-w-[180px]">
                {dir}
              </span>
            )}
            {file.language && (
              <span className="font-sans text-[10px] text-ink-label bg-warm-tertiary border border-warm-divider px-1.5 py-0.5 rounded shrink-0">
                {file.language}
              </span>
            )}
          </div>

          {file.why_first && (
            <p className="font-serif text-xs text-ink-muted mt-1 leading-relaxed">
              {file.why_first}
            </p>
          )}

          {file.key_concepts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.key_concepts.map((c) => (
                <span
                  key={c}
                  className="font-sans text-[10px] text-burnt bg-burnt/8 border border-burnt/20 px-2 py-0.5 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {file.symbols.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-1 font-sans text-[10px] text-ink-muted hover:text-ink-primary transition-colors"
              >
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {file.symbols.length} symbol
                {file.symbols.length !== 1 ? "s" : ""}
              </button>
              {expanded && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {file.symbols.map((s) => (
                    <span
                      key={s}
                      className="font-mono text-[10px] text-ink-secondary bg-warm-tertiary border border-warm-divider px-1.5 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fan-in badge */}
        {file.fan_in > 0 && (
          <div
            className="shrink-0 text-right"
            title={`${file.fan_in} module(s) depend on this file`}
          >
            <div className="font-serif text-base font-bold text-ink-primary">
              {file.fan_in}
            </div>
            <div className="font-sans text-[9px] text-ink-muted uppercase tracking-wider">
              depended
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseCard({
  phase,
  phaseIndex,
  repoId,
  doneFiles,
  onToggleFile,
}: {
  phase: LearningPhase;
  phaseIndex: number;
  repoId: string;
  doneFiles: Set<string>;
  onToggleFile: (path: string) => void;
}) {
  const [open, setOpen] = useState(phaseIndex === 0);
  const colourIdx = phaseIndex % PHASE_COLOURS.length;
  const doneCount = phase.files.filter((f) => doneFiles.has(f.path)).length;
  const total = phase.files.length;
  const allDone = doneCount === total && total > 0;
  const progressPct = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div className={`relative pl-8`}>
      {/* Timeline spine dot */}
      <div
        className={`absolute left-0 top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          allDone
            ? "bg-burnt border-burnt"
            : `bg-warm-primary ${PHASE_RING[colourIdx]}`
        }`}
      >
        {allDone ? (
          <CheckCircle2 size={11} className="text-white" />
        ) : (
          <span
            className={`font-serif text-[10px] font-bold ${PHASE_TEXT[colourIdx]}`}
          >
            {phaseIndex + 1}
          </span>
        )}
      </div>

      {/* Phase card */}
      <div
        className={`card ml-3 overflow-hidden transition-all duration-200 ${allDone ? "opacity-70" : ""}`}
      >
        {/* Header */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-warm-secondary/40 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-sans text-[10px] tracking-widest uppercase px-2 py-0.5 rounded text-white ${PHASE_COLOURS[colourIdx]}`}
              >
                Phase {phase.phase_number}
              </span>
              <h3 className="font-serif text-base font-semibold text-ink-primary">
                {phase.title}
              </h3>
            </div>
            <p className="font-serif text-xs text-ink-muted mt-0.5 line-clamp-1">
              {phase.description}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1 text-ink-muted">
              <Clock size={12} />
              <span className="font-sans text-xs">
                {phase.estimated_minutes}m
              </span>
            </div>
            <div className="flex items-center gap-1 text-ink-muted">
              <FileCode size={12} />
              <span className="font-sans text-xs">
                {doneCount}/{total}
              </span>
            </div>
            {open ? (
              <ChevronUp size={14} className="text-ink-muted" />
            ) : (
              <ChevronDown size={14} className="text-ink-muted" />
            )}
          </div>
        </button>

        {/* Progress bar */}
        <div className="h-0.5 bg-warm-divider">
          <div
            className="h-full bg-burnt transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Files */}
        {open && (
          <div className="p-4 flex flex-col gap-2">
            {phase.description && (
              <p className="font-serif text-sm text-ink-muted mb-3 leading-relaxed">
                {phase.description}
              </p>
            )}
            {phase.files.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                repoId={repoId}
                done={doneFiles.has(file.path)}
                onToggle={() => onToggleFile(file.path)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearningPathTimeline({ repoId, data }: Props) {
  const [doneFiles, setDoneFiles] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(`lp-done-${repoId}`);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const toggleFile = (path: string) => {
    setDoneFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      try {
        localStorage.setItem(`lp-done-${repoId}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const totalFiles = data.phases.reduce((s, p) => s + p.files.length, 0);
  const totalDone = data.phases.reduce(
    (s, p) => s + p.files.filter((f) => doneFiles.has(f.path)).length,
    0,
  );
  const overallPct =
    totalFiles > 0 ? Math.round((totalDone / totalFiles) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Summary strip */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-burnt" />
            <span className="font-serif text-base font-semibold text-ink-primary">
              Onboarding Progress
            </span>
          </div>
          <span className="font-mono text-sm text-ink-muted">
            {totalDone} / {totalFiles} files
          </span>
        </div>
        {/* Overall progress bar */}
        <div className="h-2 bg-warm-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-burnt rounded-full transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-sans text-[10px] text-ink-muted">
            {data.total_phases} phases · {data.total_estimated_minutes}m total
          </span>
          <span className="font-serif text-[11px] text-burnt font-medium">
            {overallPct}%
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col gap-6">
        {/* Vertical spine line */}
        <div className="absolute left-[9px] top-5 bottom-5 w-px bg-warm-divider" />

        {data.phases.map((phase, i) => (
          <PhaseCard
            key={phase.phase_number}
            phase={phase}
            phaseIndex={i}
            repoId={repoId}
            doneFiles={doneFiles}
            onToggleFile={toggleFile}
          />
        ))}
      </div>
    </div>
  );
}
