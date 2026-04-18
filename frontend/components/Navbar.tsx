"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Network, Menu, LogOut, LogIn } from "lucide-react";
import React, { useState, useEffect } from "react";
import { isLoggedIn, getUser, clearToken } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUserEmail(getUser()?.email ?? null);
  }, [pathname]);

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    router.push("/login");
  }

  const navLinks = [
    { name: "Home", path: "/" },
    ...(loggedIn ? [{ name: "My Projects", path: "/projects" }] : []),
    { name: "API Docs", path: "http://localhost:8000/docs", external: true },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 bg-warm-primary border-b border-warm-divider">
      {/* Left: Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 font-serif font-bold text-lg text-ink-primary"
      >
        <Network
          size={18}
          strokeWidth={2}
          style={{ color: "var(--ink-primary)" }}
        />
        <span>YASML</span>
      </Link>

      {/* Center: Nav links (Desktop) — absolutely centered so logo/auth don't affect position */}
      <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return "external" in link && link.external ? (
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
                isActive
                  ? "text-ink-primary"
                  : "text-ink-muted hover:text-ink-primary"
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

      {/* Right: Auth actions (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        {loggedIn ? (
          <>
            <span className="text-xs font-sans text-ink-muted truncate max-w-[140px]">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-sans text-ink-muted hover:text-ink-primary transition-colors border border-warm-divider rounded-sm px-3 py-1.5"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-sans text-ink-muted hover:text-ink-primary transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary py-1.5 px-4 text-sm rounded-sm flex items-center gap-1.5"
            >
              <LogIn size={13} />
              Get started
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-ink-primary"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full h-screen bg-warm-primary border-t border-warm-divider p-6 flex flex-col gap-6 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="font-serif text-lg text-ink-primary border-b border-warm-divider pb-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {loggedIn && (
              <Link
                href="/projects"
                className="font-serif text-lg text-ink-primary border-b border-warm-divider pb-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Projects
              </Link>
            )}
            <a
              href="http://localhost:8000/docs"
              className="font-serif text-lg text-ink-muted border-b border-warm-divider pb-2"
            >
              API Docs
            </a>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {loggedIn ? (
              <button
                onClick={handleLogout}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-center font-sans text-ink-primary border border-warm-divider rounded-sm py-2"
                >
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary w-full text-center">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
