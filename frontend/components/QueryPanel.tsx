"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Send, ThumbsUp, ThumbsDown, Network } from "lucide-react";
import { api, type CitedChunk, type Pin as PinType } from "@/lib/api";
import { readSSE } from "@/lib/sse";
import React from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  intent?: string;
  chunks?: CitedChunk[];
  sessionId?: string;
}

interface QueryPanelProps {
  repoId: string;
}

const SUGGESTED_QUESTIONS = [
  "Explain the login flow",
  "Where is validate_user called?",
  "What does AuthService depend on?",
  "What breaks if I change db_query?",
];

export default function QueryPanel({ repoId }: QueryPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (messages.length > 0) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || streaming) return;
      setInput("");

      const userMsg: Message = { role: "user", text: question };
      setMessages((prev) => [...prev, userMsg]);

      const assistantMsg: Message = { role: "assistant", text: "", chunks: [] };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreaming(true);

      try {
        const sessionId = messages.find((m) => m.sessionId)?.sessionId ?? undefined;
        const res = await api.query.stream({
          repo_id: repoId,
          question,
          session_id: sessionId,
        });

        for await (const event of readSSE(res)) {
          if (event.type === "meta") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.intent = event.intent as string;
              last.chunks = (event.cited_chunks ?? []) as CitedChunk[];
              last.sessionId = event.session_id as string;
              updated[updated.length - 1] = last;
              return updated;
            });
          } else if (event.type === "token") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.text += event.text as string;
              updated[updated.length - 1] = last;
              return updated;
            });
          } else if (event.type === "done") {
            break;
          }
        }
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: "Failed to get a response. Check that the backend is running.",
          };
          return updated;
        });
      } finally {
        setStreaming(false);
      }
    },
    [repoId, messages, streaming]
  );

  return (
    <div className="flex flex-col gap-12" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="animate-fade-in text-center flex flex-col items-center">
          <p className="section-label mb-6">QUERY</p>
          <h1 className="text-4xl md:text-5xl font-serif text-ink-primary font-medium mb-4">
            <span className="italic text-burnt">Ask</span> anything about your codebase.
          </h1>
          <p className="font-serif text-lg text-ink-muted mb-10">
            Trace flows, find usages, understand dependencies — in plain language.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12 max-w-2xl">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendQuestion(q)}
                className="bg-warm-secondary border border-warm-divider rounded-full px-5 py-2 font-serif italic text-ink-muted hover:text-ink-primary hover:border-burnt transition-colors text-sm"
              >
                "{q}"
              </button>
            ))}
          </div>

          <div className="w-full relative shadow-sm rounded-md">
            <textarea
              className="w-full bg-warm-primary border border-warm-divider rounded-md focus:border-burnt focus:ring-1 focus:ring-burnt outline-none p-5 pb-16 font-serif text-ink-primary text-lg resize-none placeholder:text-ink-muted/50 transition-colors"
              placeholder="How are payments verified?"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendQuestion(input);
                }
              }}
            />
            <button
              onClick={() => sendQuestion(input)}
              disabled={!input.trim() || streaming}
              className="absolute bottom-4 right-4 bg-burnt text-warm-primary px-5 py-2 rounded-sm font-serif font-medium hover:bg-burnt-hover disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              Ask &rarr;
            </button>
          </div>
          
          <div className="flex w-full items-center justify-start gap-4 mt-3">
            {["Include code snippets", "Deep trace", "Show graph"].map((toggle) => (
              <label key={toggle} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-burnt rounded-sm" defaultChecked={toggle === "Include code snippets"} />
                <span className="font-sans text-[11px] uppercase tracking-wider text-ink-muted">{toggle}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-16 pb-24 animate-fade-in">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="bg-warm-secondary border-l-4 border-burnt p-6 rounded-r-md">
                  <p className="font-serif italic text-ink-primary text-xl">"{msg.text}"</p>
                </div>
              );
            }

            // Assistant message
            return (
              <div key={i} className="flex flex-col gap-10">
                {/* FLOW TRACE */}
                {msg.chunks && msg.chunks.length > 0 && (
                  <div>
                    <h4 className="section-label mb-6">FLOW TRACE</h4>
                    <div className="flex flex-col gap-6 relative">
                      {/* Vertical line connector */}
                      <div className="absolute left-[11px] top-6 bottom-6 w-px bg-warm-divider z-0" />
                      
                      {msg.chunks.map((chunk, ci) => (
                        <div key={ci} className="relative z-10 flex gap-4">
                          <div className="w-6 h-6 flex items-center justify-center bg-warm-secondary border border-warm-divider rounded-full font-sans text-[10px] text-ink-primary mt-1 shrink-0">
                            {ci + 1}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-burnt text-sm cursor-pointer hover:underline">
                              {chunk.symbol_name || "Code Segment"}
                            </span>
                            <span className="font-sans text-[11px] text-ink-muted">
                              {chunk.path || chunk.file_path}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* GRAPH CONTEXT (Mocked) */}
                {msg.chunks && msg.chunks.length > 0 && (
                  <div>
                    <h4 className="section-label mb-4">GRAPH CONTEXT</h4>
                    <div className="border border-warm-divider rounded-md bg-[#F0EBE1] h-48 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                      <Network size={32} strokeWidth={1} className="text-burnt opacity-50" />
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-burnt font-serif font-medium bg-warm-primary px-3 py-1 rounded-sm border border-burnt/30 shadow-sm">
                           Open in Graph Explorer &rarr;
                         </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXPLANATION */}
                <div>
                  <h4 className="section-label mb-4">EXPLANATION</h4>
                  <div className="font-serif text-ink-primary text-lg leading-relaxed whitespace-pre-wrap">
                    {msg.text || (streaming && i === messages.length - 1 ? "Thinking..." : "")}
                  </div>
                </div>

                {/* Feedback */}
                {!streaming && msg.text && (
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-sm font-sans text-ink-muted mr-2">Was this helpful?</span>
                    <button className="p-1.5 border border-warm-divider rounded-sm text-ink-muted hover:text-burnt hover:border-burnt transition-colors"><ThumbsUp size={14}/></button>
                    <button className="p-1.5 border border-warm-divider rounded-sm text-ink-muted hover:text-burnt hover:border-burnt transition-colors"><ThumbsDown size={14}/></button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Fixed bottom input for followups */}
          <div className="fixed bottom-0 left-[260px] right-0 bg-warm-primary border-t border-warm-divider p-6 z-20 shadow-[0_-10px_40px_rgba(245,240,232,0.8)]">
            <div className="max-w-[760px] mx-auto relative flex items-center">
              <input
                className="w-full bg-warm-secondary border border-warm-divider rounded-full focus:border-burnt outline-none px-6 py-3 font-serif text-ink-primary pr-32 placeholder:text-ink-muted transition-colors"
                placeholder="Ask a follow-up question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendQuestion(input);
                  }
                }}
              />
              <button
                onClick={() => sendQuestion(input)}
                disabled={!input.trim() || streaming}
                className="absolute right-2 top-1.5 bottom-1.5 bg-burnt text-warm-primary px-4 rounded-full font-serif font-medium hover:bg-burnt-hover disabled:opacity-50 transition-colors flex items-center"
              >
                 <Send size={14} className="mr-2" /> Ask
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
