"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CodeViewer from "@/components/CodeViewer";

export default function FileViewerPage() {
  const params = useParams<{ id: string; path: string[] }>();
  const repoId = params.id;
  
  const filePath = Array.isArray(params.path)
    ? params.path.map(decodeURIComponent).join("/")
    : decodeURIComponent(params.path ?? "");

  const [selectedFunc, setSelectedFunc] = useState<string | null>(null);

  // When a function is clicked in the CodeViewer, it can call this
  return (
    <div className="flex h-full w-full bg-[#F0EBE1]">
      
      {/* Center Code Area */}
      <div className="flex-1 overflow-hidden border-r border-warm-divider bg-[#F0EBE1]">
        <CodeViewer 
          repoId={repoId} 
          filePath={filePath} 
          onFunctionClick={(funcName) => setSelectedFunc(funcName)}
          activeFunction={selectedFunc}
        />
      </div>

      {/* Right AI Sidebar */}
      <div className="w-[320px] shrink-0 bg-warm-secondary flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-warm-divider">
          <h4 className="section-label">AI CONTEXT</h4>
        </div>
        
        <div className="flex-1 p-5">
          {!selectedFunc ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="font-serif italic text-ink-muted">Select a function to see insights</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h2 className="font-serif text-2xl font-bold text-ink-primary break-all">
                {selectedFunc}
              </h2>
              
              <div>
                <h4 className="section-label mb-2">WHAT IT DOES</h4>
                <p className="font-serif text-ink-muted text-sm leading-relaxed">
                  Extracts core dependency strings from the AST tree using tree-sitter. Handles error resilience if parser fails on invalid syntax blocks.
                </p>
              </div>

              <div>
                <h4 className="section-label mb-2">CALLS</h4>
                <ul className="flex flex-col gap-2 font-serif text-sm text-ink-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-burnt mt-0.5">&rarr;</span> 
                    <span className="font-mono text-xs">parse_ast()</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-burnt mt-0.5">&rarr;</span> 
                    <span className="font-mono text-xs">report_error()</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="section-label mb-2">CALLED BY</h4>
                <ul className="flex flex-col gap-2 font-serif text-sm text-ink-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-burnt mt-0.5">&rarr;</span> 
                    <span className="font-mono text-xs">LanguageDetector.analyze</span>
                  </li>
                </ul>
              </div>

              <div className="divider-line my-2" />

              <div className="flex flex-col gap-3">
                <button className="text-burnt font-sans text-sm font-medium hover:underline text-left">
                  Explain full flow &rarr;
                </button>
                <button className="text-burnt font-sans text-sm font-medium hover:underline text-left">
                  Find similar logic &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
