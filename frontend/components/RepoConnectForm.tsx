"use client";

import { useState, useRef } from "react";
import { Upload, FolderOpen, ArrowRight, Loader2 } from "lucide-react";
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
    { label: "GitHub", mode: "github", icon: <Upload size={13} /> },
    { label: "ZIP Archive", mode: "zip", icon: <Upload size={13} /> },
    { label: "Local Path", mode: "local", icon: <FolderOpen size={13} /> },
  ];

  const labelCls =
    "block text-[10px] font-sans font-semibold text-ink-secondary tracking-widest uppercase mb-1.5";
  const inputCls =
    "w-full bg-transparent border border-warm-divider rounded-sm text-ink-primary text-sm px-3 py-2 outline-none transition-colors placeholder:text-ink-muted focus:border-burnt font-sans";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div className="flex gap-0 border border-warm-divider rounded-sm overflow-hidden w-fit">
        {tabs.map((t) => (
          <button
            key={t.mode}
            type="button"
            onClick={() => setMode(t.mode)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-sans transition-colors ${
              mode === t.mode
                ? "bg-burnt text-white"
                : "text-ink-muted hover:text-ink-primary hover:bg-warm-tertiary"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Repo name */}
      <div>
        <label className={labelCls}>
          Repository Name{" "}
          <span className="normal-case text-ink-muted font-normal">
            (optional)
          </span>
        </label>
        <input
          className={inputCls}
          placeholder="e.g. my-awesome-project"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
        />
      </div>

      {/* Mode-specific field */}
      {mode === "github" && (
        <div>
          <label className={labelCls}>
            GitHub URL <span className="text-burnt">*</span>
          </label>
          <input
            className={inputCls}
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
          <label className={labelCls}>
            Absolute Path <span className="text-burnt">*</span>
          </label>
          <input
            className={inputCls}
            placeholder="/home/user/projects/myrepo"
            value={localPath}
            onChange={(e) => setLocalPath(e.target.value)}
            required
          />
        </div>
      )}

      {mode === "zip" && (
        <div>
          <label className={labelCls}>
            ZIP File <span className="text-burnt">*</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${
              zipFile
                ? "border-burnt/50 bg-burnt/5"
                : "border-warm-divider hover:border-burnt/40"
            }`}
          >
            <Upload size={20} className="mx-auto mb-2 text-ink-muted" />
            <p className="text-sm font-sans text-ink-muted">
              {zipFile ? (
                <span className="text-ink-primary font-medium">
                  {zipFile.name}
                </span>
              ) : (
                "Drop ZIP here or click to browse"
              )}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm font-sans text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Connecting…
          </>
        ) : (
          <>
            Start Ingestion <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}
