import React from "react";
import "./globals.css";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"], 
  style: ["normal", "italic"],
  variable: "--font-playfair" 
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains" });

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
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${jetbrains.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
