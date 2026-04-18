"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Network, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      setToken(data.access_token);
      setUser(data.user);
      router.push("/projects");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-primary flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Network
          size={20}
          strokeWidth={2}
          style={{ color: "var(--ink-primary)" }}
        />
        <span className="font-serif font-bold text-xl text-ink-primary">
          YASML
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl font-bold text-ink-primary mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-ink-muted font-sans mb-8">
          Sign in to your codebase intelligence workspace.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans font-medium text-ink-secondary tracking-wide uppercase">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-transparent border border-warm-divider rounded-sm text-ink-primary text-sm px-3 py-2 outline-none transition-colors placeholder:text-ink-muted focus:border-burnt font-sans"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans font-medium text-ink-secondary tracking-wide uppercase">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-transparent border border-warm-divider rounded-sm text-ink-primary text-sm px-3 py-2 outline-none transition-colors placeholder:text-ink-muted focus:border-burnt font-sans"
            />
          </div>

          {error && (
            <p className="text-sm font-sans text-red-500 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 py-2.5 mt-2 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="text-sm font-sans text-ink-muted text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-burnt hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
