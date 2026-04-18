"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Network, ArrowRight, X } from "lucide-react";
import { api, type Repo } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import RepoConnectForm from "@/components/RepoConnectForm";
import React from "react";

export default function LandingPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [recentRepos, setRecentRepos] = useState<Repo[]>([]);

  useEffect(() => {
    const authed = isLoggedIn();
    setLoggedIn(authed);
    setUserEmail(getUser()?.email ?? null);
    if (authed) {
      api.repos
        .list()
        .then((repos) => setRecentRepos(repos.slice(0, 3)))
        .catch(() => {});
    }
  }, []);

  function handleRepoCreated(repo: Repo) {
    router.push(`/repos/${repo.id}`);
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-32 px-6 flex flex-col items-center text-center">
        {/* Oversized fade text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-serif decorative opacity-[0.03] select-none pointer-events-none z-0">
          01
        </div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <p className="section-label mb-8">WHAT WE DO</p>

          <h1 className="text-6xl md:text-7xl font-serif text-ink-primary leading-tight mb-6 mt-16">
            <span className="italic text-burnt">Understand</span> any codebase.
            <br />
            Instantly.
          </h1>

          <p className="text-lg md:text-xl font-serif text-ink-muted max-w-2xl leading-relaxed mb-10">
            We don't treat code as text. We convert it into a structured graph
            of relationships, then use AI to generate meaningful explanations.
          </p>

          <div className="flex flex-col items-center gap-4 mb-10 w-full max-w-lg">
            {loggedIn ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={() => router.push("/projects")}
                >
                  My Projects <ArrowRight size={15} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowModal(true)}
                >
                  + New Project
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={() => router.push("/signup")}
                >
                  Get started free <ArrowRight size={15} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>

          <div className="divider-line max-w-xs mb-4" />
          <p className="text-xs font-sans text-ink-muted">
            {loggedIn
              ? `Signed in as ${userEmail}`
              : "Free to try — no credit card required"}
          </p>

          {/* Recent repos strip — only when logged in */}
          {loggedIn && recentRepos.length > 0 && (
            <div className="mt-8 w-full max-w-lg">
              <p className="section-label mb-3 text-left">RECENT PROJECTS</p>
              <div className="flex flex-col gap-2">
                {recentRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => router.push(`/repos/${repo.id}`)}
                    className="flex items-center justify-between w-full border border-warm-divider rounded-sm px-4 py-2.5 hover:border-burnt/50 transition-colors group bg-warm-secondary"
                  >
                    <span className="font-serif text-sm text-ink-primary group-hover:text-burnt transition-colors truncate">
                      {repo.name}
                    </span>
                    <span
                      className={`text-[10px] font-sans ml-3 shrink-0 ${
                        repo.status === "READY"
                          ? "text-emerald-600"
                          : repo.status === "FAILED"
                            ? "text-red-500"
                            : "text-amber-600"
                      }`}
                    >
                      {repo.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-warm-primary border-t border-warm-divider">
        <div className="max-w-6xl mx-auto">
          <p className="section-label mb-16 text-center">HOW IT WORKS</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                num: "01",
                title: "Upload",
                italic: "Upload,",
                titleRest: "not configure.",
                desc: "Paste a GitHub link or drag in a repo, zero setup.",
              },
              {
                num: "02",
                title: "Parse",
                italic: "Parse,",
                titleRest: "not read.",
                desc: "Tree-sitter extracts every function, class, import automatically.",
              },
              {
                num: "03",
                title: "Graph",
                italic: "Graph,",
                titleRest: "not list.",
                desc: "Relationships are mapped into a live dependency graph.",
              },
              {
                num: "04",
                title: "Ask",
                italic: "Ask,",
                titleRest: "not search.",
                desc: "Natural language queries answered with graph-aware AI.",
              },
            ].map((step) => (
              <div key={step.num} className="relative flex flex-col group">
                {/* Decorative numeric background */}
                <div className="absolute -top-10 -left-4 text-8xl font-serif text-ink-label opacity-[0.06] select-none pointer-events-none transition-opacity group-hover:opacity-10">
                  {step.num}
                </div>

                <h3 className="relative z-10 text-2xl font-serif text-ink-primary mb-4 transition-transform group-hover:translate-x-1 duration-300">
                  <span className="italic text-burnt">{step.italic}</span>{" "}
                  {step.titleRest}
                </h3>

                <p className="relative z-10 font-serif text-ink-muted leading-relaxed mb-6 flex-1">
                  {step.desc}
                </p>

                <div className="divider-line transition-colors group-hover:bg-burnt/30" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-warm-secondary border-t border-warm-divider">
        <div className="max-w-5xl mx-auto">
          <p className="section-label mb-16 text-center">WHY IT'S DIFFERENT</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                rn: "I",
                title: "Function Tracing",
                desc: "Follow execution paths visually through your entire codebase without losing cognitive focus.",
              },
              {
                rn: "II",
                title: "Dependency Graph",
                desc: "See the blast radius of any change before making it. Instantly locate architectural bottlenecks.",
              },
              {
                rn: "III",
                title: "Impact Analysis",
                desc: "Query potential changes in plain English and get simulated impact assessments instantly.",
              },
            ].map((feat) => (
              <div
                key={feat.rn}
                className="flex flex-col border-b border-warm-divider pb-8 transition-transform hover:-translate-y-1 duration-300"
              >
                <span className="font-serif text-burnt mb-6 text-sm">
                  {feat.rn}
                </span>
                <h4 className="font-serif text-xl text-ink-primary font-medium mb-4">
                  {feat.title}
                </h4>
                <p className="font-serif text-ink-muted leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-primary text-warm-primary py-12 px-6 relative overflow-hidden mt-auto">
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-[15rem] font-serif opacity-5 whitespace-nowrap pointer-events-none select-none">
          YASML
        </div>
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-serif font-bold text-lg">
            <Network size={18} className="text-burnt" />
            <span>YASML</span>
          </div>

          <div className="flex items-center gap-6 font-sans text-sm text-[rgba(245,240,232,0.6)]">
            <Link
              href="#"
              className="hover:text-warm-primary transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="#"
              className="hover:text-warm-primary transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="#"
              className="hover:text-warm-primary transition-colors"
            >
              Twitter
            </Link>
          </div>

          <div className="font-sans text-[11px] text-[rgba(245,240,232,0.4)] tracking-wider uppercase">
            © 2026 YASML Hackathon
          </div>
        </div>
      </footer>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-sm">
          <div className="bg-warm-primary border border-warm-divider rounded-sm w-full max-w-lg shadow-2xl p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="section-label mb-1">NEW PROJECT</p>
                <h2 className="font-serif text-2xl font-bold text-ink-primary">
                  Connect a Repository
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-ink-muted hover:text-ink-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="font-serif text-sm text-ink-muted mb-6">
              YASML will parse, graph, and index your codebase for
              natural-language exploration.
            </p>
            <RepoConnectForm onCreated={handleRepoCreated} />
          </div>
        </div>
      )}
    </div>
  );
}
