"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
} from "lucide-react";
import { api, Repo } from "@/lib/api";
import { isLoggedIn, getUser, clearToken } from "@/lib/auth";
import RepoConnectForm from "@/components/RepoConnectForm";

function StatusBadge({ status }: { status: Repo["status"] }) {
  const map = {
    READY: {
      icon: <CheckCircle2 size={12} />,
      label: "Ready",
      cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    INGESTING: {
      icon: <Loader2 size={12} className="animate-spin" />,
      label: "Ingesting",
      cls: "text-amber-700 bg-amber-50 border-amber-200",
    },
    PENDING: {
      icon: <Clock size={12} />,
      label: "Pending",
      cls: "text-ink-muted bg-warm-secondary border-warm-divider",
    },
    FAILED: {
      icon: <AlertCircle size={12} />,
      label: "Failed",
      cls: "text-red-700 bg-red-50 border-red-200",
    },
  };
  const { icon, label, cls } = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-sans font-medium px-2 py-0.5 rounded-full border ${cls}`}
    >
      {icon} {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectsPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRepos() {
    setLoading(true);
    try {
      const data = await api.repos.list();
      setRepos(data);
    } catch {
      // token may be expired
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  function handleRepoCreated(repo: Repo) {
    setShowForm(false);
    loadRepos();
  }

  return (
    <div className="min-h-screen bg-warm-primary">
      {/* Page Header */}
      <div className="border-b border-warm-divider bg-warm-primary px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <div>
            <p className="text-xs font-sans text-ink-muted mb-1 tracking-widest uppercase">
              Workspace
            </p>
            <h1 className="font-serif text-3xl font-bold text-ink-primary">
              My Projects
            </h1>
            {user && (
              <p className="text-sm font-sans text-ink-muted mt-1">
                {user.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
            >
              <Plus size={15} />
              New Project
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-sans text-ink-muted hover:text-ink-primary transition-colors border border-warm-divider rounded-sm px-3 py-2"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* New Project Form */}
        {showForm && (
          <div className="mb-8 border border-warm-divider rounded-sm bg-warm-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-ink-primary">
                Connect a repository
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-ink-muted hover:text-ink-primary text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <RepoConnectForm onCreated={handleRepoCreated} />
          </div>
        )}

        {/* Repo Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-ink-muted" />
          </div>
        ) : repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <FolderOpen size={40} className="text-ink-muted opacity-40" />
            <div>
              <p className="font-serif text-xl text-ink-primary">
                No projects yet
              </p>
              <p className="text-sm font-sans text-ink-muted mt-1">
                Connect a GitHub repository or upload a ZIP to get started.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 py-2 px-4 text-sm mt-2"
            >
              <Plus size={15} /> New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <Link
                key={repo.id}
                href={`/repos/${repo.id}`}
                className="group block border border-warm-divider rounded-sm bg-warm-secondary hover:border-burnt transition-colors p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-serif font-semibold text-ink-primary text-base leading-snug group-hover:text-burnt transition-colors line-clamp-2">
                    {repo.name}
                  </h3>
                  <StatusBadge status={repo.status} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-sans text-ink-muted">
                  {repo.file_count > 0 && <span>{repo.file_count} files</span>}
                  {repo.function_count > 0 && (
                    <span>{repo.function_count} functions</span>
                  )}
                  {Object.keys(repo.language_breakdown).length > 0 && (
                    <span>
                      {Object.keys(repo.language_breakdown)
                        .slice(0, 2)
                        .join(", ")}
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-sans text-ink-muted mt-3 pt-3 border-t border-warm-divider">
                  Added {formatDate(repo.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
