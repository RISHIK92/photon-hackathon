import React from "react";
import Sidebar from "@/components/Sidebar";

export default function RepoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-warm-primary relative">
        {children}
      </main>
    </div>
  );
}
