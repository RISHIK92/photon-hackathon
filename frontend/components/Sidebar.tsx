"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Network,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  FileCode,
} from "lucide-react";
import { api, type Repo } from "@/lib/api";

export default function Sidebar() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [repo, setRepo] = useState<Repo | null>(null);

  useEffect(() => {
    if (id) {
      api.repos.get(id).then(setRepo).catch(console.error);
    }
  }, [id]);

  const navItems = [
    {
      label: "Overview",
      path: `/repos/${id}`,
      icon: <LayoutDashboard size={14} />,
    },
    {
      label: "Graph Explorer",
      path: `/repos/${id}/graph`,
      icon: <Network size={14} />,
    },
    {
      label: "Query",
      path: `/repos/${id}/query`,
      icon: <MessageSquare size={14} />,
    },
    {
      label: "Onboarding",
      path: `/repos/${id}/onboarding`,
      icon: <BookOpen size={14} />,
    },
  ];

  return (
    <aside className="w-[260px] h-[calc(100vh-56px)] bg-warm-secondary border-r border-warm-divider flex flex-col hidden md:flex shrink-0 overflow-hidden relative">
      <div className="p-4 border-b border-warm-divider">
        <h3 className="section-label mb-1">REPOSITORY</h3>
        <p
          className="font-serif font-bold text-ink-primary truncate"
          title={repo?.name}
        >
          {repo?.name || "Loading..."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Navigation Tabs (Since the user spec requested Top: repo name, Bottom: settings, Middle varies) */}
        <div className="px-3 flex flex-col gap-1 mb-6">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-sans text-[13px] text-left transition-colors ${
                  isActive
                    ? "bg-burnt/10 text-burnt border-l-[3px] border-burnt font-medium pl-2.5"
                    : "text-ink-muted hover:bg-warm-primary hover:text-ink-primary border-l-[3px] border-transparent"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="px-4 mb-2">
          <h4 className="section-label">TOP MODULES</h4>
        </div>
        <div className="px-3 flex flex-col gap-[2px]">
          {repo?.top_modules?.map((mod) => (
            <div
              key={mod}
              className="flex items-center gap-2 px-3 py-1 font-mono text-[11px] text-ink-muted hover:text-ink-primary hover:bg-warm-primary rounded-sm cursor-pointer truncate"
              title={mod}
            >
              <FileCode size={11} className="shrink-0" />
              <span className="truncate">{mod}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-warm-divider mt-auto flex items-center justify-between">
        <button className="flex items-center gap-2 font-sans text-[12px] text-ink-muted hover:text-ink-primary">
          <Settings size={14} /> Settings
        </button>
        <div className="w-8 h-4 bg-warm-divider rounded-full flex items-center p-0.5 cursor-pointer">
          <div className="w-3 h-3 bg-warm-primary rounded-full shadow-sm" />
        </div>
      </div>
    </aside>
  );
}
