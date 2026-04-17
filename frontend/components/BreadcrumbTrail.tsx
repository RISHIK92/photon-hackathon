"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbTrailProps {
  crumbs: Crumb[];
}

export default function BreadcrumbTrail({ crumbs }: BreadcrumbTrailProps) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "0.82rem",
        color: "var(--text-muted)",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
      }}
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          color: "var(--text-muted)",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Home size={13} />
      </Link>

      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <ChevronRight size={13} style={{ opacity: 0.4 }} />
          {crumb.href ? (
            <Link
              href={crumb.href}
              style={{
                color: i === crumbs.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: i === crumbs.length - 1 ? 500 : 400,
                transition: "color 0.15s",
              }}
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              style={{
                color: i === crumbs.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: i === crumbs.length - 1 ? 500 : 400,
              }}
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
