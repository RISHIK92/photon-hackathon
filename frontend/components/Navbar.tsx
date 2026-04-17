"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, Zap } from "lucide-react";
import React from "react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <GitBranch size={18} strokeWidth={2.5} style={{ color: "var(--yasml-primary)" }} />
        <span>YASML</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
          Home
        </Link>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          API Docs
        </a>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          <Zap size={13} style={{ color: "var(--yasml-accent)" }} />
          Gemini 2.0 Flash
        </div>
      </div>
    </nav>
  );
}
