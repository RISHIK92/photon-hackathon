"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowRight, AlertTriangle, Loader, FileCode, Search, TerminalSquare, GitBranch } from "lucide-react";
import { api, type Repo, type Pin } from "@/lib/api";
import { relativeTime } from "@/lib/utils";

export default function RepoDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.repos.get(id).then(setRepo),
        api.pins.listForRepo(id).then(setPins).catch(() => setPins([])), // gracefully degrade
      ]).finally(() => setLoading(false));
    }
  }, [id]);

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
        <h3 className="font-serif text-xl mb-4 text-ink-primary">Repository not found</h3>
        <button onClick={() => router.push('/')} className="btn-secondary">
          ← Back to Home
        </button>
      </div>
    );
  }

  const tabs = [
    { label: "OVERVIEW", path: `/repos/${id}` },
    { label: "GRAPH", path: `/repos/${id}/graph` },
    { label: "EXPLORER", path: `/repos/${id}/file` },
    { label: "QUERY", path: `/repos/${id}/query` },
    { label: "DOCS", path: `/repos/${id}/docs` },
  ];

  return (
    <div className="flex flex-col min-h-full p-8 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="mb-6">
        <div className="flex items-end gap-4 mb-2">
          <h1 className="font-serif text-4xl text-ink-primary font-bold">{repo.name}</h1>
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
          <div key={card.label} className="card p-5 flex flex-col justify-between h-28 hover:-translate-y-0.5 transition-transform">
            <div className={`font-serif text-4xl font-medium ${card.isStatus && card.value === "READY" ? "text-burnt" : "text-ink-primary"}`}>
              {card.isStatus ? (card.value === "READY" ? "Complete" : card.value) : card.value}
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
              pathname === tab.path ? "text-ink-primary font-medium" : "text-ink-muted hover:text-ink-primary"
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
                {[
                  { func: "init_server()", file: "src/main.rs" },
                  { func: "setup_routes()", file: "src/api/routes.rs" },
                  { func: "connect_db()", file: "src/db/connection.rs" },
                ].map((entry, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-burnt mt-2 shrink-0" />
                    <div>
                      <div className="font-mono text-sm text-ink-primary">{entry.func}</div>
                      <div className="font-sans text-xs text-ink-muted mt-0.5">{entry.file}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Queries / Pins */}
            <div>
              <h4 className="section-label mb-4">SAVED PINS (QUERIES)</h4>
              <ul className="flex flex-col gap-4">
                {pins.length === 0 ? (
                  <li className="font-serif italic text-ink-muted text-sm">— No saved pins yet —</li>
                ) : (
                  pins.slice(0, 3).map((pin, i) => (
                    <li key={pin.id}>
                      <div className="font-serif italic text-ink-primary text-sm mb-1">"{pin.question}"</div>
                      <div className="font-sans text-xs text-ink-muted">
                        {new Date(pin.created_at).toLocaleDateString()}
                      </div>
                    </li>
                  ))
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
                    <div className="w-48 truncate font-serif text-sm text-ink-primary">{mod}</div>
                    <div className="flex-1 h-2 bg-warm-divider rounded-full overflow-hidden">
                      <div className="h-full bg-burnt opacity-80" style={{ width }} />
                    </div>
                    <div className="w-8 text-right font-sans text-xs text-ink-muted">{mockCount}</div>
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
              { num: "I", title: "Trace a Function", desc: "Find callers and definitions", icon: <Search size={14} /> },
              { num: "II", title: "Find Usages", desc: "Locate variable references", icon: <FileCode size={14} /> },
              { num: "III", title: "Explain a File", desc: "AI-generated summaries", icon: <TerminalSquare size={14} /> },
              { num: "IV", title: "Run Impact Analysis", desc: "Simulate code changes", icon: <GitBranch size={14} /> },
            ].map((action) => (
              <div key={action.num} className="card p-4 flex items-center gap-4 cursor-pointer hover:border-burnt/50 transition-colors group">
                <div className="text-burnt font-serif font-bold w-4 text-center">{action.num}</div>
                <div className="flex-1">
                  <div className="font-serif text-sm text-ink-primary font-medium">{action.title}</div>
                  <div className="font-serif text-xs text-ink-muted mt-0.5">{action.desc}</div>
                </div>
                <ArrowRight size={14} className="text-burnt opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
