"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Menu } from "lucide-react";
import React, { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 bg-warm-primary border-b border-warm-divider">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2 font-serif font-bold text-lg text-ink-primary">
        <Network size={18} strokeWidth={2} style={{ color: "var(--ink-primary)" }} />
        <span>YASML</span>
      </Link>

      {/* Center: Nav links (Desktop) */}
      <div className="hidden md:flex items-center gap-6">
        {[
          { name: "Home", path: "/" },
          { name: "API Docs", path: "http://localhost:8000/docs", external: true },
        ].map((link) => {
          const isActive = pathname === link.path;
          return link.external ? (
            <a
              key={link.name}
              href={link.path}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-[15px] text-ink-muted hover:text-ink-primary transition-colors"
            >
              {link.name}
            </a>
          ) : (
            <Link
              key={link.name}
              href={link.path}
              className={`font-serif text-[15px] transition-colors relative py-1 ${
                isActive ? "text-ink-primary" : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              {link.name}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-burnt" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Right: Upload Actions (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        <input
          type="text"
          placeholder="Paste GitHub URL..."
          className="bg-transparent border border-warm-divider rounded-sm text-ink-primary text-sm px-3 py-1.5 outline-none transition-colors placeholder:text-ink-muted focus:border-burnt w-48 font-sans"
        />
        <button className="btn-primary py-1.5 px-4 text-sm rounded-sm">
          Upload Repo
        </button>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-ink-primary">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full h-screen bg-warm-primary border-t border-warm-divider p-6 flex flex-col gap-6 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/" className="font-serif text-lg text-ink-primary border-b border-warm-divider pb-2">Home</Link>
            <a href="http://localhost:8000/docs" className="font-serif text-lg text-ink-muted border-b border-warm-divider pb-2">API Docs</a>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <input
              type="text"
              placeholder="Paste GitHub URL..."
              className="input-field"
            />
            <button className="btn-primary w-full">Upload Repo</button>
          </div>
        </div>
      )}
    </nav>
  );
}
