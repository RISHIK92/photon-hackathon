"use client";

import { useState, useRef } from "react";
import { Upload, FolderOpen, ArrowRight, Sparkles } from "lucide-react";
import { api, type Repo, type RepoSourceType } from "@/lib/api";
import React from "react";

interface RepoConnectFormProps {
  onCreated: (repo: Repo) => void;
}

type Mode = "github" | "zip" | "local";

export default function RepoConnectForm({ onCreated }: RepoConnectFormProps) {
  const [mode, setMode] = useState<Mode>("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoName, setRepoName] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let repo: Repo;

      if (mode === "github") {
        const name = repoName || repoUrl.split("/").slice(-2).join("/");
        repo = await api.repos.create({
          name,
          source_type: "github" as RepoSourceType,
          source_url: repoUrl,
        });
      } else if (mode === "zip" && zipFile) {
        repo = await api.repos.uploadZip(
          repoName || zipFile.name.replace(".zip", ""),
          zipFile,
        );
      } else if (mode === "local") {
        repo = await api.repos.create({
          name: repoName || localPath.split("/").pop() || "local-repo",
          source_type: "local" as RepoSourceType,
          source_url: localPath,
        });
      } else {
        throw new Error("Please fill in all required fields.");
      }

      onCreated(repo);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const tabs: { label: string; mode: Mode; icon: React.ReactNode }[] = [
    { label: "GitHub", mode: "github", icon: <Upload size={15} /> },
    { label: "ZIP Archive", mode: "zip", icon: <Upload size={15} /> },
    { label: "Local Path", mode: "local", icon: <FolderOpen size={15} /> },
  ];

  return (
    <div
      className="card animate-fade-in"
      style={{ maxWidth: 560, width: "100%", padding: "2rem" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "var(--radius-lg)",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.25)",
            marginBottom: "0.75rem",
          }}
        >
          <Sparkles size={22} style={{ color: "var(--yasml-primary)" }} />
        </div>
        <h2 style={{ marginBottom: "0.35rem" }}>Connect a Repository</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          YASML will parse, graph, and index your codebase for natural-language
          exploration.
        </p>
      </div>

      {/* Mode selector */}
      <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
        {tabs.map((t) => (
          <button
            key={t.mode}
            className={`tab ${mode === t.mode ? "active" : ""}`}
            onClick={() => setMode(t.mode)}
            type="button"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {/* Repo name (always shown) */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "0.4rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Repository Name{" "}
            <span style={{ color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <input
            id="repo-name"
            className="input"
            placeholder="e.g. my-awesome-project"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
          />
        </div>

        {/* Mode-specific field */}
        {mode === "github" && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              GitHub URL *
            </label>
            <input
              id="github-url"
              className="input"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              type="url"
            />
          </div>
        )}

        {mode === "local" && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Absolute Path *
            </label>
            <input
              id="local-path"
              className="input"
              placeholder="/home/user/projects/myrepo"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              required
            />
          </div>
        )}

        {mode === "zip" && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ZIP File *
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.15s",
                color: zipFile ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--yasml-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
              }
            >
              <Upload
                size={24}
                style={{
                  margin: "0 auto 0.5rem",
                  opacity: 0.5,
                  display: "block",
                }}
              />
              {zipFile ? zipFile.name : "Drop ZIP here or click to browse"}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              style={{ display: "none" }}
              onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--error)",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          id="connect-repo-btn"
          type="submit"
          className="btn btn-accent"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", padding: "0.7rem" }}
        >
          {loading ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
                className="animate-spin"
              />
              Connecting...
            </>
          ) : (
            <>
              Start Ingestion <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
