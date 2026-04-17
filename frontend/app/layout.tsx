import React from "react";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "YASML — Codebase Intelligence Platform",
  description:
    "Ingest any repository, build a structural knowledge graph, and explore your codebase with natural language.",
  keywords: ["code intelligence", "knowledge graph", "codebase exploration", "AI", "developer tools"],
  openGraph: {
    title: "YASML — Codebase Intelligence Platform",
    description: "Natural-language codebase exploration powered by graph intelligence.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
