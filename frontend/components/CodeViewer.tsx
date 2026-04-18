"use client";

import { useState, useEffect } from "react";
import { Loader, Code, Copy } from "lucide-react";
import { api } from "@/lib/api";
import React from "react";

interface CodeViewerProps {
  repoId: string;
  filePath: string;
  onFunctionClick?: (funcName: string) => void;
  activeFunction?: string | null;
}

// Super simple regex highlighter for demo purposes
// keywords in #C4621D, strings in #A34E15, comments in #9E9488, base text in #2C2826
function highlightLine(line: string) {
  let html = line
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /(const|let|var|function|return|if|else|import|from|export|class|async|await|def|class|import)/g,
      '<span style="color: #C4621D">$1</span>',
    )
    .replace(/('.*?'|".*?"|`.*?`)/g, '<span style="color: #A34E15">$1</span>')
    .replace(/(\/\/.*|#.*)/g, '<span style="color: #9E9488">$1</span>');
  return { __html: html };
}

export default function CodeViewer({
  repoId,
  filePath,
  onFunctionClick,
  activeFunction,
}: CodeViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    api.files
      .get(repoId, filePath)
      .then(({ content: c }) => setContent(c))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [repoId, filePath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-ink-muted bg-[#F0EBE1]">
        <Loader size={18} className="animate-spin mr-2" /> Loading file...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-error bg-[#F0EBE1] flex-col">
        <p className="font-serif">Error loading file</p>
        <p className="text-xs mt-2">{error}</p>
      </div>
    );
  }

  const lines = content.split("\n");

  // Mock function block detection for the demo
  const isFunctionActive = (lineNum: number) => {
    // Just mock that lines 10-20 belong to 'parse_ast' if active
    if (activeFunction === "parse_ast()" && lineNum >= 10 && lineNum <= 20)
      return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-[#F0EBE1]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-warm-divider bg-[#E6DFD3]">
        <div className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          <Code size={14} className="text-ink-muted" />
          <span>{filePath.split("/").join(" / ")}</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 font-sans text-xs text-ink-muted hover:text-ink-primary transition-colors">
            <Copy size={12} /> Copy
          </button>
          <button className="text-burnt font-sans text-xs font-medium hover:underline">
            Explain this file &rarr;
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto py-4">
        <table className="w-full border-collapse font-mono text-[13px] leading-relaxed">
          <tbody>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const active = isFunctionActive(lineNum);
              // Trigger a function selection if we find "function" on a line
              const isFunctionDef =
                line.includes("function ") || line.includes("def ");

              return (
                <tr
                  key={i}
                  className={`group relative ${active ? "bg-burnt/10" : "hover:bg-black/5"}`}
                >
                  <td className="select-none text-right pr-4 pl-4 min-w-[50px] text-ink-label border-r border-[#9E9488]/30">
                    {lineNum}
                  </td>
                  <td
                    className={`pl-4 pr-4 whitespace-pre border-l-4 ${active ? "border-burnt" : "border-transparent"}`}
                  >
                    <span
                      dangerouslySetInnerHTML={highlightLine(line)}
                      className="text-ink-primary"
                    />

                    {/* Hover tooltip for function calls - mocked on 'api' word */}
                    {line.includes("api.") && (
                      <div className="hidden group-hover:block absolute top-0 right-10 bg-warm-primary border border-warm-divider rounded-md shadow-md p-2 z-10 font-sans">
                        <p className="text-xs text-ink-primary mb-1 font-mono">
                          api.method(args)
                        </p>
                        <a
                          href="#"
                          className="text-burnt text-[10px] hover:underline"
                        >
                          Go to definition &rarr;
                        </a>
                      </div>
                    )}

                    {/* Clickable function defs */}
                    {isFunctionDef && (
                      <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => onFunctionClick?.("parse_ast()")} // Mock name
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
