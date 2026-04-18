"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowRight,
  AlertTriangle,
  Loader,
  FileCode,
  Search,
  TerminalSquare,
  GitBranch,
} from "lucide-react";
import { api, type Repo, type Job, type Pin, type EntryPoint } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import IngestionProgress from "@/components/IngestionProgress";
import QuickActionModal, {
  type QuickActionType,
} from "@/components/QuickActionModal";
import React from "react";

export default function RepoDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuickAction, setActiveQuickAction] =
    useState<QuickActionType | null>(null);

  const refreshRepo = useCallback(async () => {
    if (!id) return;
    const r = await api.repos.get(id);
    setRepo(r);
    // If repo is still ingesting, find the active job
    if (r.status === "PENDING" || r.status === "INGESTING") {
      const jobs = await api.jobs.listForRepo(id).catch(() => []);
      const running = jobs.find(
        (j) => j.status === "RUNNING" || j.status === "QUEUED",
      );
      setActiveJob(running ?? jobs[0] ?? null);
    } else {
      setActiveJob(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.repos.get(id),
      api.jobs.listForRepo(id).catch(() => [] as Job[]),
      api.pins.listForRepo(id).catch(() => [] as Pin[]),
    ])
      .then(([r, jobs, p]) => {
        setRepo(r);
        setPins(p);
        if (r.status === "PENDING" || r.status === "INGESTING") {
          const running = jobs.find(
            (j) => j.status === "RUNNING" || j.status === "QUEUED",
          );
          setActiveJob(running ?? jobs[0] ?? null);
        } else if (r.status === "READY") {
          api.graph
            .getEntryPoints(id)
            .then(setEntryPoints)
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleIngestionComplete = useCallback(async () => {
    const r = await api.repos.get(id!);
    setRepo(r);
    setActiveJob(null);
    api.pins
      .listForRepo(id!)
      .then(setPins)
      .catch(() => {});
    api.graph
      .getEntryPoints(id!)
      .then(setEntryPoints)
      .catch(() => {});
  }, [id]);

  const handleIngestionError = useCallback(
    (msg: string) => {
      // Re-fetch repo to get FAILED status
      api.repos
        .get(id!)
        .then(setRepo)
        .catch(() => {});
      setActiveJob(null);
    },
    [id],
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-muted">
        <Loader size={20} className="animate-spin mr-2" /> Loading dashboard...
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-ink-muted">
        <AlertTriangle size={32} className="text-burnt mb-4" />
        <h3 className="font-serif text-xl mb-4 text-ink-primary">
          Repository not found
        </h3>
        <button onClick={() => router.push("/")} className="btn-secondary">
          ← Back to Home
        </button>
      </div>
    );
  }

  // Show live ingestion progress overlay when ingesting
  if ((repo.status === "PENDING" || repo.status === "INGESTING") && activeJob) {
    return (
      <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
        {/* Decorative oversized number like the landing page */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-serif text-ink-primary opacity-[0.025] select-none pointer-events-none z-0">
          02
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
          {/* Left rail — repo identity */}
          <div className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-warm-divider p-8 flex flex-col justify-between">
            <div>
              <p className="section-label mb-6">REPOSITORY</p>
              <h1 className="font-serif text-3xl text-ink-primary font-bold leading-snug mb-2">
                {repo.name}
              </h1>
              {repo.source_url && (
                <p className="font-mono text-[10px] text-ink-label break-all leading-relaxed">
                  {repo.source_url}
                </p>
              )}

              <div className="divider-line my-6" />

              <p className="section-label mb-3">WHAT HAPPENS NEXT</p>
              <ul className="flex flex-col gap-3">
                {[
                  "Graph view of all dependencies",
                  "AI-powered code search",
                  "File-by-file explorer",
                  "Impact analysis",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-burnt mt-2 shrink-0" />
                    <span className="font-serif text-sm text-ink-muted">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => router.push("/")}
                className="btn-secondary w-full text-xs"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Right panel — live progress */}
          <div className="flex-1 p-8 lg:p-16 overflow-y-auto">
            <IngestionProgress
              jobId={activeJob.id}
              repoId={repo.id}
              onComplete={handleIngestionComplete}
              onError={handleIngestionError}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show failed state
  if (repo.status === "FAILED") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
        <AlertTriangle size={40} className="text-red-500" />
        <h2 className="font-serif text-2xl text-ink-primary">
          Ingestion Failed
        </h2>
        <p className="font-sans text-sm text-ink-muted max-w-md">
          {repo.error_message ??
            "An error occurred while indexing this repository."}
        </p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => router.push("/")} className="btn-secondary">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { label: "OVERVIEW", path: `/repos/${id}` },
    { label: "GRAPH", path: `/repos/${id}/graph` },
    { label: "EXPLORER", path: `/repos/${id}/file` },
    { label: "QUERY", path: `/repos/${id}/query` },
    { label: "ONBOARDING", path: `/repos/${id}/onboarding` },
    { label: "DOCS", path: `/repos/${id}/docs` },
  ];

  return (
    <div className="flex flex-col min-h-full p-8 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="mb-6">
        <div className="flex items-end gap-4 mb-2">
          <h1 className="font-serif text-4xl text-ink-primary font-bold">
            {repo.name}
          </h1>
          <span className="bg-burnt/10 border border-burnt/20 text-burnt px-2 py-0.5 rounded-sm font-sans tracking-wider uppercase text-[11px] mb-1">
            main
          </span>
        </div>
        <p className="font-sans text-xs text-ink-muted">
          Last indexed: {relativeTime(repo.updated_at)}
        </p>
      </div>
      <div className="divider-line mb-8" />

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "TOTAL FILES", value: repo.file_count },
          { label: "TOTAL FUNCTIONS", value: repo.function_count },
          { label: "DEPENDENCIES", value: repo.cluster_count || 12 }, // placeholder for deps
          { label: "STATUS", value: repo.status, isStatus: true },
        ].map((card) => (
          <div
            key={card.label}
            className="card p-5 flex flex-col justify-between h-28 hover:-translate-y-0.5 transition-transform"
          >
            <div
              className={`font-serif text-4xl font-medium ${card.isStatus && card.value === "READY" ? "text-burnt" : "text-ink-primary"}`}
            >
              {card.isStatus
                ? card.value === "READY"
                  ? "Complete"
                  : card.value
                : card.value}
            </div>
            <div className="section-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Main Tab Bar */}
      <div className="flex gap-6 border-b border-warm-divider mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.path)}
            className={`pb-3 font-sans text-xs tracking-wider transition-colors relative ${
              pathname === tab.path
                ? "text-ink-primary font-medium"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            {tab.label}
            {pathname === tab.path && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-burnt" />
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left main content columns */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Entry Points */}
            <div>
              <h4 className="section-label mb-4">ENTRY POINTS</h4>
              <ul className="flex flex-col gap-4">
                {entryPoints.length === 0 ? (
                  <li className="font-serif italic text-ink-muted text-sm">
                    — No entry points detected —
                  </li>
                ) : (
                  entryPoints.slice(0, 5).map((ep) => {
                    const filename = ep.path.split("/").pop() ?? ep.path;
                    const dir = ep.path.includes("/")
                      ? ep.path.slice(0, ep.path.lastIndexOf("/"))
                      : "";
                    return (
                      <li
                        key={ep.id}
                        className="flex gap-3 cursor-pointer group"
                        onClick={() =>
                          router.push(
                            `/repos/${id}/file?path=${encodeURIComponent(ep.path)}`,
                          )
                        }
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-burnt mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                        <div className="min-w-0">
                          <div className="font-mono text-sm text-ink-primary group-hover:text-burnt transition-colors truncate">
                            {ep.top_symbols.length > 0
                              ? `${ep.top_symbols[0]}()`
                              : filename}
                          </div>
                          <div className="font-sans text-xs text-ink-muted mt-0.5 truncate">
                            {ep.path}
                          </div>
                          {ep.top_symbols.length > 1 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {ep.top_symbols.slice(1).map((sym) => (
                                <span
                                  key={sym}
                                  className="font-mono text-[10px] text-ink-label bg-warm-tertiary border border-warm-divider rounded px-1.5 py-0.5"
                                >
                                  {sym}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>

          <div className="divider-line my-2" />

          {/* Top Dependencies Bar chart */}
          <div>
            <h4 className="section-label mb-4">TOP DEPENDENCIES</h4>
            <div className="flex flex-col gap-3">
              {repo.top_modules?.slice(0, 5).map((mod, i) => {
                const maxVal = 100;
                const mockCount = Math.max(10, 80 - i * 15);
                const width = `${(mockCount / maxVal) * 100}%`;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-48 truncate font-serif text-sm text-ink-primary">
                      {mod}
                    </div>
                    <div className="flex-1 h-2 bg-warm-divider rounded-full overflow-hidden">
                      <div
                        className="h-full bg-burnt opacity-80"
                        style={{ width }}
                      />
                    </div>
                    <div className="w-8 text-right font-sans text-xs text-ink-muted">
                      {mockCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Quick Actions (320px) */}
        <div className="w-full lg:w-[320px] shrink-0">
          <h4 className="section-label mb-4">QUICK ACTIONS</h4>
          <div className="flex flex-col gap-3">
            {[
              {
                action: "trace" as QuickActionType,
                num: "I",
                title: "Trace a Function",
                desc: "Find callers and definitions",
                icon: <Search size={14} />,
              },
              {
                action: "usages" as QuickActionType,
                num: "II",
                title: "Find Usages",
                desc: "Locate variable references",
                icon: <FileCode size={14} />,
              },
              {
                action: "explain" as QuickActionType,
                num: "III",
                title: "Explain a File",
                desc: "AI-generated summaries",
                icon: <TerminalSquare size={14} />,
              },
              {
                action: "impact" as QuickActionType,
                num: "IV",
                title: "Run Impact Analysis",
                desc: "Simulate code changes",
                icon: <GitBranch size={14} />,
              },
            ].map((a) => (
              <button
                key={a.action}
                onClick={() => setActiveQuickAction(a.action)}
                className="card p-4 flex items-center gap-4 cursor-pointer hover:border-burnt/50 transition-colors group text-left w-full"
              >
                <div className="text-burnt font-serif font-bold w-4 text-center shrink-0">
                  {a.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-sm text-ink-primary font-medium">
                    {a.title}
                  </div>
                  <div className="font-serif text-xs text-ink-muted mt-0.5">
                    {a.desc}
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-burnt opacity-50 group-hover:opacity-100 transition-opacity shrink-0"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {activeQuickAction && (
        <QuickActionModal
          repoId={id!}
          action={activeQuickAction}
          onClose={() => setActiveQuickAction(null)}
        />
      )}
    </div>
  );
}
