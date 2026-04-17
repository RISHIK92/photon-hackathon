"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  GitFork,
  FileCode,
  FunctionSquare,
  Network,
  Layers,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  Loader,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BreadcrumbTrail from "@/components/BreadcrumbTrail";
import { api, type Repo } from "@/lib/api";
import { langColor } from "@/lib/utils";
import React from "react";

export default function RepoOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.repos
      .get(id)
      .then(setRepo)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Navbar />
        <div
          className="flex-center"
          style={{ flex: 1, gap: "0.5rem", color: "var(--text-muted)" }}
        >
          <Loader size={20} className="animate-spin" /> Loading repository...
        </div>
      </div>
    );
  }

  if (!repo) {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Navbar />
        <div className="empty-state" style={{ flex: 1 }}>
          <AlertTriangle size={32} style={{ color: "var(--error)" }} />
          <h3>Repository not found</h3>
          <Link href="/" className="btn btn-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const totalFiles =
    Object.values(repo.language_breakdown).reduce((a, b) => a + b, 0) || 1;

  const statCards = [
    {
      icon: <FileCode size={20} style={{ color: "var(--yasml-primary)" }} />,
      value: repo.file_count,
      label: "Files",
    },
    {
      icon: (
        <FunctionSquare size={20} style={{ color: "var(--yasml-accent)" }} />
      ),
      value: repo.function_count,
      label: "Functions",
    },
    {
      icon: <Layers size={20} style={{ color: "#10b981" }} />,
      value: repo.cluster_count || "—",
      label: "Clusters",
    },
    {
      icon: <Network size={20} style={{ color: "#f59e0b" }} />,
      value: Object.keys(repo.language_breakdown).length,
      label: "Languages",
    },
  ];

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />

      <div className="page-container" style={{ flex: 1 }}>
        <BreadcrumbTrail crumbs={[{ label: repo.name }]} />

        {/* Repo header */}
        <div
          className="flex-between"
          style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}
        >
          <div className="flex-gap-2">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-md)",
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GitFork size={20} style={{ color: "var(--yasml-primary)" }} />
            </div>
            <div>
              <h2 style={{ marginBottom: 2 }}>{repo.name}</h2>
              {repo.source_url && (
                <a
                  href={repo.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  {repo.source_url}
                </a>
              )}
            </div>
          </div>

          <div className="flex-gap-2">
            <a
              href={`http://localhost:8000/api/annotations/repo/${id}/export`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <Download size={14} /> Export Report
            </a>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid-4" style={{ marginBottom: "2rem" }}>
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex-gap-2" style={{ marginBottom: "0.5rem" }}>
                {s.icon}
              </div>
              <div className="stat-value">{s.value.toLocaleString()}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Language breakdown */}
        {Object.keys(repo.language_breakdown).length > 0 && (
          <div
            className="card"
            style={{ padding: "1.5rem", marginBottom: "2rem" }}
          >
            <h4 style={{ marginBottom: "1rem" }}>Language Breakdown</h4>
            {/* Bar */}
            <div
              style={{
                display: "flex",
                height: 8,
                borderRadius: 999,
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              {Object.entries(repo.language_breakdown).map(([lang, count]) => (
                <div
                  key={lang}
                  style={{
                    width: `${(count / totalFiles) * 100}%`,
                    background: langColor(lang),
                  }}
                  title={`${lang}: ${count} files`}
                />
              ))}
            </div>
            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {Object.entries(repo.language_breakdown).map(([lang, count]) => (
                <div
                  key={lang}
                  className="flex-gap-2"
                  style={{ fontSize: "0.82rem" }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: langColor(lang),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "var(--text-secondary)" }}>{lang}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {count} ({((count / totalFiles) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top modules */}
        {repo.top_modules.length > 0 && (
          <div
            className="card"
            style={{ padding: "1.5rem", marginBottom: "2rem" }}
          >
            <h4 style={{ marginBottom: "1rem" }}>Largest Modules</h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {repo.top_modules.slice(0, 8).map((mod) => (
                <div
                  key={mod}
                  className="flex-gap-2"
                  style={{
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-elevated)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <FileCode
                    size={12}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  />
                  {mod}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation cards */}
        <div className="grid-2" style={{ gap: "1rem" }}>
          <Link
            href={`/repos/${id}/graph`}
            className="card animate-fade-in"
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              textDecoration: "none",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "var(--shadow-glow)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            <Network size={28} style={{ color: "var(--yasml-primary)" }} />
            <div>
              <h3>Dependency Graph</h3>
              <p style={{ fontSize: "0.875rem" }}>
                Explore the interactive module graph with cluster coloring and
                zoom-in navigation.
              </p>
            </div>
            <span
              className="btn btn-primary"
              style={{ alignSelf: "flex-start" }}
            >
              View Graph <ArrowRight size={14} />
            </span>
          </Link>

          <Link
            href={`/repos/${id}/query`}
            className="card animate-fade-in"
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              textDecoration: "none",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 40px rgba(34,211,238,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            <MessageSquare size={28} style={{ color: "var(--yasml-accent)" }} />
            <div>
              <h3>Natural-Language Query</h3>
              <p style={{ fontSize: "0.875rem" }}>
                Ask questions like "Where is auth handled?" and get streaming,
                cited answers.
              </p>
            </div>
            <span
              className="btn btn-accent"
              style={{ alignSelf: "flex-start" }}
            >
              Open Query <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
