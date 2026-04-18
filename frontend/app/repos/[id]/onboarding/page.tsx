"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader, AlertTriangle, BookOpen, RefreshCw } from "lucide-react";
import { api, type LearningPath } from "@/lib/api";
import LearningPathTimeline from "@/components/LearningPathTimeline";

export default function OnboardingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.onboarding.getLearningPath(id);
      setData(result);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to generate learning path",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="flex flex-col min-h-full p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen size={20} className="text-burnt" />
            <h1 className="font-serif text-3xl font-bold text-ink-primary">
              Learning Path
            </h1>
          </div>
          <p className="font-serif text-sm text-ink-muted">
            AI-generated onboarding guide — files ordered from foundational to
            feature-level.
          </p>
        </div>

        {data && !loading && (
          <button
            onClick={() => load(true)}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <RefreshCw size={12} />
            Regenerate
          </button>
        )}
      </div>

      <div className="divider-line my-6" />

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-ink-muted">
          <Loader size={28} className="animate-spin text-burnt" />
          <p className="font-serif text-base">
            Analysing dependency graph and generating your learning path…
          </p>
          <p className="font-sans text-xs text-ink-muted">
            This may take 15–30 seconds the first time.
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertTriangle size={36} className="text-red-500" />
          <h2 className="font-serif text-xl text-ink-primary">
            Could not generate learning path
          </h2>
          <p className="font-sans text-sm text-ink-muted max-w-md">{error}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => load()} className="btn-secondary">
              Try again
            </button>
            <button onClick={() => router.back()} className="btn-secondary">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Empty phases */}
      {!loading && !error && data && data.phases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <BookOpen size={36} className="text-ink-muted" />
          <h2 className="font-serif text-xl text-ink-primary">
            No files found
          </h2>
          <p className="font-sans text-sm text-ink-muted">
            The repository graph has no modules yet — try re-ingesting the repo.
          </p>
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && data && data.phases.length > 0 && (
        <LearningPathTimeline repoId={id} data={data} />
      )}
    </div>
  );
}
