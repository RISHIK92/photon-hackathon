"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Search, Copy, Download, Code } from "lucide-react";

export default function AutoDocsPage() {
  const { id } = useParams<{ id: string }>();
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  
  const generateDocs = () => {
    setGenerating(true);
    setTimeout(() => {
      setOutput(`
# \`AuthService\`

The \`AuthService\` class manages user authentication, token issuance, and session verification across the platform.

## Key Functions

### \`verify_token(token: str) -> bool\`
Validates the structural integrity and expiration of a JWT token against the cluster public key.

| Parameter | Type | Description |
|-----------|------|-------------|
| \`token\` | \`str\` | The raw JWT string provided in the Authorization header. |

### \`create_session(user_id: str) -> Session\`
Establishes a new secure context for an authenticated entity.

\`\`\`python
def create_session(user_id: str) -> Session:
    token = generate_jwt(user_id)
    cache.set(f"session:{user_id}", token, ex=3600)
    return Session(token=token, active=True)
\`\`\`

> **Note:** Sessions are cached using Redis and automatically expire after 1 hour.
      `);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex h-full w-full bg-warm-primary">
      {/* Left Selector Panel */}
      <div className="w-[300px] border-r border-warm-divider bg-warm-secondary flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6">
          <h4 className="section-label mb-8">DOCUMENTATION GENERATOR</h4>
          
          <div className="flex flex-col gap-8">
            {/* Target Selector */}
            <div>
              <label className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-2 block">Target</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input 
                  type="text" 
                  placeholder="Find auto-complete..." 
                  className="input-field pl-9 font-mono text-xs py-2"
                />
              </div>
            </div>

            {/* Options Group */}
            <div>
              <label className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-3 block">Scope</label>
              <div className="flex flex-col gap-3">
                {["Generate for entire file", "Generate for selected function", "Generate README"].map((opt, i) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="docScope" defaultChecked={i===0} className="accent-burnt w-4 h-4" />
                    <span className="font-serif text-[15px] text-ink-primary group-hover:text-burnt transition-colors">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selector */}
            <div>
              <label className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-3 block">Format</label>
              <div className="flex gap-2 bg-warm-primary p-1 border border-warm-divider rounded-md">
                {["Markdown", "HTML", "Plain text"].map((fmt, i) => (
                  <button 
                    key={fmt} 
                    className={`flex-1 py-1.5 text-xs font-sans rounded-sm transition-colors ${
                      i === 0 ? "bg-burnt text-warm-primary font-medium shadow-sm" : "text-ink-muted hover:text-ink-primary"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={generateDocs}
              disabled={generating}
              className="btn-primary w-full mt-4 h-12"
            >
              {generating ? "Generating..." : "Generate \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Output Panel */}
      <div className="flex-1 flex flex-col bg-warm-primary overflow-hidden min-w-0">
        {!output && !generating && (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-serif italic text-ink-muted text-lg">Your documentation will appear here</p>
          </div>
        )}

        {generating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 border-2 border-burnt border-t-transparent rounded-full animate-spin" />
             <p className="font-serif text-ink-muted">Parsing syntax trees...</p>
          </div>
        )}

        {output && !generating && (
          <div className="flex flex-col h-full animate-fade-in">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-divider bg-warm-secondary shrink-0">
              <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
                <Code size={14} /> Generated Docs
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 font-sans text-xs text-burnt hover:opacity-80 transition-opacity">
                  <Copy size={13} /> Copy
                </button>
                <button className="flex items-center gap-2 font-sans text-xs text-burnt hover:opacity-80 transition-opacity pl-3 border-l border-warm-divider">
                  <Download size={13} /> Download .md
                </button>
              </div>
            </div>

            {/* Markdown Preview Area (Simulated custom Markdown formatting) */}
            <div className="flex-1 p-10 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-6">
                 {/* This mocks a rendered markdown view based on the aesthetic rules */}
                 <h1 className="font-serif text-4xl text-ink-primary font-bold mb-4">AuthService</h1>
                 <p className="font-serif text-ink-primary leading-relaxed">
                   The <span className="font-mono text-burnt text-sm px-1 bg-warm-secondary rounded">AuthService</span> class manages user authentication, token issuance, and session verification across the platform.
                 </p>
                 
                 <div className="divider-line my-8" />
                 
                 <h2 className="font-serif text-2xl text-ink-primary font-semibold mb-4">Key Functions</h2>
                 
                 <div className="mb-8">
                   <h3 className="font-mono text-lg text-ink-primary mb-3">verify_token(token: str) -&gt; bool</h3>
                   <p className="font-serif text-ink-primary mb-4 leading-relaxed">
                     Validates the structural integrity and expiration of a JWT token against the cluster public key.
                   </p>
                   
                   {/* Mock table */}
                   <div className="border border-warm-divider rounded-md overflow-hidden">
                     <table className="w-full text-left font-serif">
                       <thead className="bg-[#EDE8DE] border-b border-warm-divider text-ink-muted text-xs uppercase tracking-wider font-sans">
                         <tr>
                           <th className="px-4 py-2 font-medium">Parameter</th>
                           <th className="px-4 py-2 font-medium border-l border-warm-divider">Type</th>
                           <th className="px-4 py-2 font-medium border-l border-warm-divider">Description</th>
                         </tr>
                       </thead>
                       <tbody className="bg-warm-primary divide-y divide-warm-divider">
                         <tr>
                           <td className="px-4 py-3 font-mono text-xs text-burnt">token</td>
                           <td className="px-4 py-3 font-mono text-xs text-ink-muted border-l border-warm-divider">str</td>
                           <td className="px-4 py-3 text-ink-primary text-sm border-l border-warm-divider">The raw JWT string provided in the Authorization header.</td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                 </div>

                 <div>
                   <h3 className="font-mono text-lg text-ink-primary mb-3">create_session(user_id: str) -&gt; Session</h3>
                   <p className="font-serif text-ink-primary mb-4 leading-relaxed">
                     Establishes a new secure context for an authenticated entity.
                   </p>
                   
                   {/* Mock code block */}
                   <div className="bg-[#E6DFD3] border border-warm-divider rounded-md p-4 font-mono text-[13px] text-ink-primary leading-relaxed overflow-x-auto shadow-inner">
<pre><code><span className="text-[#C4621D]">def</span> <span className="text-[#A34E15]">create_session</span>(user_id: <span className="text-[#C4621D]">str</span>) -&gt; Session:
    token = generate_jwt(user_id)
    cache.set(<span className="text-[#A34E15]">f&quot;session:&#123;user_id&#125;&quot;</span>, token, ex=<span className="text-[#9E9488]">3600</span>)
    <span className="text-[#C4621D]">return</span> Session(token=token, active=<span className="text-[#C4621D]">True</span>)</code></pre>
                   </div>
                   
                   {/* Mock blockquote */}
                   <blockquote className="mt-6 border-l-4 border-burnt bg-[#EDE8DE] p-4 text-ink-primary font-serif italic text-sm rounded-r-md">
                     <strong>Note:</strong> Sessions are cached using Redis and automatically expire after 1 hour.
                   </blockquote>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
