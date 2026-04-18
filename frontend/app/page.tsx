"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Network, Search, GitBranch } from "lucide-react";
import { api, type Repo } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [showInput, setShowInput] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;
    setLoading(true);
    setError(null);
    try {
      const name = repoUrl.split('/').pop() || "unknown-repo";
      const repo = await api.repos.create({
        name,
        source_type: "github",
        source_url: repoUrl
      });
      router.push(`/repos/${repo.id}`);
    } catch (err) {
      setError((err as Error).message || "Failed to create repo.");
      setLoading(false);
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const repo = await api.repos.uploadZip(file.name, file);
      router.push(`/repos/${repo.id}`);
    } catch (err) {
      setError((err as Error).message || "Failed to upload repository.");
      setLoading(false);
    }
  };

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
            <span className="italic text-burnt">Understand</span> any codebase.<br />
            Instantly.
          </h1>
          
          <p className="text-lg md:text-xl font-serif text-ink-muted max-w-2xl leading-relaxed mb-10">
            We don't treat code as text. We convert it into a structured graph of relationships, then use AI to generate meaningful explanations.
          </p>

          <div className="flex flex-col items-center gap-4 mb-10 w-full max-w-lg">
            {!showInput ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <input 
                  type="file" 
                  accept=".zip" 
                  ref={fileInputRef} 
                  onChange={handleZipUpload} 
                  style={{ display: "none" }} 
                />
                <button 
                  className="btn-primary" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? "Uploading..." : "Upload (.zip)"}
                </button>
                <button className="btn-secondary" onClick={() => setShowInput(true)} disabled={loading}>
                  Paste GitHub URL
                </button>
              </div>
            ) : (
              <form 
                onSubmit={handleCreateRepo}
                className="flex items-center w-full bg-warm-secondary border border-warm-divider rounded-full shadow-sm overflow-hidden p-1 relative"
              >
                <input
                  type="text"
                  placeholder="https://github.com/user/repo"
                  className="w-full bg-transparent outline-none px-5 py-2 font-mono text-sm text-ink-primary"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary shrink-0 rounded-full px-6 flex items-center h-full"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-warm-primary border-t-transparent rounded-full animate-spin" /> : "Analyze"}
                </button>
              </form>
            )}
            
            {error && <p className="text-error text-sm font-sans mt-2">{error}</p>}
          </div>

          <div className="divider-line max-w-xs mb-4" />
          <p className="text-xs font-sans text-ink-muted">No account required to explore</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-warm-primary border-t border-warm-divider">
        <div className="max-w-6xl mx-auto">
          <p className="section-label mb-16 text-center">HOW IT WORKS</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { num: "01", title: "Upload", italic: "Upload,", titleRest: "not configure.", desc: "Paste a GitHub link or drag in a repo, zero setup." },
              { num: "02", title: "Parse", italic: "Parse,", titleRest: "not read.", desc: "Tree-sitter extracts every function, class, import automatically." },
              { num: "03", title: "Graph", italic: "Graph,", titleRest: "not list.", desc: "Relationships are mapped into a live dependency graph." },
              { num: "04", title: "Ask", italic: "Ask,", titleRest: "not search.", desc: "Natural language queries answered with graph-aware AI." },
            ].map((step) => (
              <div key={step.num} className="relative flex flex-col group">
                {/* Decorative numeric background */}
                <div className="absolute -top-10 -left-4 text-8xl font-serif text-ink-label opacity-[0.06] select-none pointer-events-none transition-opacity group-hover:opacity-10">
                  {step.num}
                </div>
                
                <h3 className="relative z-10 text-2xl font-serif text-ink-primary mb-4 transition-transform group-hover:translate-x-1 duration-300">
                  <span className="italic text-burnt">{step.italic}</span> {step.titleRest}
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
              { rn: "I", title: "Function Tracing", desc: "Follow execution paths visually through your entire codebase without losing cognitive focus." },
              { rn: "II", title: "Dependency Graph", desc: "See the blast radius of any change before making it. Instantly locate architectural bottlenecks." },
              { rn: "III", title: "Impact Analysis", desc: "Query potential changes in plain English and get simulated impact assessments instantly." },
            ].map((feat) => (
              <div key={feat.rn} className="flex flex-col border-b border-warm-divider pb-8 transition-transform hover:-translate-y-1 duration-300">
                <span className="font-serif text-burnt mb-6 text-sm">{feat.rn}</span>
                <h4 className="font-serif text-xl text-ink-primary font-medium mb-4">{feat.title}</h4>
                <p className="font-serif text-ink-muted leading-relaxed">{feat.desc}</p>
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
            <Link href="#" className="hover:text-warm-primary transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-warm-primary transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-warm-primary transition-colors">Twitter</Link>
          </div>
          
          <div className="font-sans text-[11px] text-[rgba(245,240,232,0.4)] tracking-wider uppercase">
            © 2026 YASML Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
}
