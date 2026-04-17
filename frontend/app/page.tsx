"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitBranch, GitFork, Package, FolderGit2, Clock, Trash2,
  ArrowRight, Sparkles, Zap, Network, MessageSquare,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RepoConnectForm from "@/components/RepoConnectForm";
import IngestionProgress from "@/components/IngestionProgress";
import { api, type Repo, type Job } from "@/lib/api";
import { relativeTime, langColor } from "@/lib/utils";
import React from "react";

export default function LandingPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [activeStep, setActiveStep] = useState<"form" | "ingesting" | null>(null);
  const [currentRepo, setCurrentRepo] = useState<Repo | null>(null);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  useEffect(() => {
    api.repos.list().then(setRepos).catch(console.error);
  }, []);

  async function handleRepoCreated(repo: Repo) {
    setCurrentRepo(repo);
    // Get the latest job for this repo
    try {
      const jobs = await api.jobs.listForRepo(repo.id);
      if (jobs.length > 0) setCurrentJob(jobs[0]);
    } catch {}
    setActiveStep("ingesting");
    setRepos((prev) => [repo, ...prev.filter((r) => r.id !== repo.id)]);
  }

  function handleIngestionComplete() {
    if (currentRepo) router.push(`/repos/${currentRepo.id}`);
  }

  async function deleteRepo(id: string) {
    await api.repos.delete(id);
    setRepos((prev) => prev.filter((r) => r.id !== id));
  }

  const statusBadge: Record<string, string> = {
    READY: "badge-ready",
    INGESTING: "badge-ingesting",
    PENDING: "badge-pending",
    FAILED: "badge-failed",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="grid-bg"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
        }}
      >
        {/* Glow blob */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div
            className="badge badge-ingesting animate-fade-in"
            style={{ marginBottom: "1.25rem", display: "inline-flex" }}
          >
            <Sparkles size={11} /> Powered by Gemini 2.0 Flash
          </div>

          <h1 className="text-gradient animate-fade-in" style={{ marginBottom: "1rem" }}>
            Understand Any Codebase<br />Without Reading Every File
          </h1>

          <p
            className="animate-fade-in"
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              maxWidth: 520,
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            YASML ingests your repository, builds a structural knowledge graph, and lets you ask
            natural-language questions to navigate and understand your code instantly.
          </p>

          {/* Feature pills */}
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "3rem",
            }}
          >
            {[
              { icon: <Network size={13} />, label: "Dependency Graph" },
              { icon: <MessageSquare size={13} />, label: "NL Query" },
              { icon: <Zap size={13} />, label: "Semantic Search" },
              { icon: <GitBranch size={13} />, label: "AST Parsing" },
            ].map((f) => (
              <span
                key={f.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--bg-card-border)",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                }}
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          {/* Form / Progress */}
          {activeStep === null && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RepoConnectForm
                onCreated={(repo) => {
                  setActiveStep("form");
                  handleRepoCreated(repo);
                }}
              />
            </div>
          )}
          {activeStep === "form" && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RepoConnectForm onCreated={handleRepoCreated} />
            </div>
          )}
          {activeStep === "ingesting" && currentJob && currentRepo && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <IngestionProgress
                jobId={currentJob.id}
                repoId={currentRepo.id}
                onComplete={handleIngestionComplete}
                onError={(msg) => {
                  console.error("Ingestion error:", msg);
                  setActiveStep(null);
                }}
              />
            </div>
          )}

          {activeStep === null && (
            <button
              className="btn btn-ghost animate-fade-in"
              style={{ marginTop: "1rem" }}
              onClick={() => setActiveStep("form")}
            >
              Connect a repository <ArrowRight size={14} />
            </button>
          )}
        </div>
      </section>

      {/* Repo list */}
      {repos.length > 0 && (
        <section className="page-container" style={{ paddingTop: "1rem" }}>
          <div className="section-header">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FolderGit2 size={18} style={{ color: "var(--yasml-primary)" }} />
              Your Repositories
            </h3>
            <button
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
              onClick={() => setActiveStep("form")}
            >
              + Add repository
            </button>
          </div>

          <div className="grid-3" style={{ alignItems: "start" }}>
            {repos.map((repo) => (
              <div key={repo.id} className="card animate-fade-in" style={{ padding: "1.25rem" }}>
                <div className="flex-between" style={{ marginBottom: "0.75rem" }}>
                  <div className="flex-gap-2">
                    <GitFork size={16} style={{ color: "var(--yasml-primary)" }} />
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{repo.name}</span>
                  </div>
                  <span className={`badge ${statusBadge[repo.status] ?? "badge-pending"}`}>
                    {repo.status}
                  </span>
                </div>

                {/* Stats */}
                {repo.status === "READY" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginBottom: "0.75rem",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{repo.file_count} files</span>
                    <span>{repo.function_count} functions</span>
                  </div>
                )}

                {/* Language bar */}
                {repo.status === "READY" && Object.keys(repo.language_breakdown).length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      height: 4,
                      borderRadius: 999,
                      overflow: "hidden",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {Object.entries(repo.language_breakdown).map(([lang, count]) => {
                      const total = Object.values(repo.language_breakdown).reduce((a, b) => a + b, 0);
                      return (
                        <div
                          key={lang}
                          style={{
                            width: `${(count / total) * 100}%`,
                            background: langColor(lang),
                          }}
                          title={`${lang}: ${count} files`}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="flex-between">
                  <div className="flex-gap-2" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <Clock size={12} />
                    {relativeTime(repo.created_at)}
                  </div>

                  <div className="flex-gap-2">
                    <button
                      onClick={() => deleteRepo(repo.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <Trash2 size={14} />
                    </button>

                    {repo.status === "READY" && (
                      <Link href={`/repos/${repo.id}`} className="btn btn-primary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>
                        Explore <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          borderTop: "1px solid var(--bg-card-border)",
          padding: "1.5rem",
          textAlign: "center",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
        }}
      >
        YASML · Codebase Intelligence Platform · Built for hackathon
      </footer>
    </div>
  );
}
