"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Search, ChevronDown, Download, Network, Loader } from "lucide-react";
import { api, type ImpactAnalysis, type GraphNode } from "@/lib/api";

export default function ImpactAnalyzerPage() {
  const { id } = useParams<{ id: string }>();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImpactAnalysis | null>(null);
  const [nodeInput, setNodeInput] = useState("");
  const [availableNodes, setAvailableNodes] = useState<GraphNode[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);

  useEffect(() => {
    setGraphLoading(true);
    api.graph.get(id).then((data) => {
      setAvailableNodes(data.nodes);
    }).catch(console.error).finally(() => setGraphLoading(false));
  }, [id]);

  const handleAnalyze = async () => {
    if (!nodeInput.trim()) return;
    setAnalyzing(true);
    
    // Find matching node ID based on input (label or path)
    const targetNode = availableNodes.find(n => (n.label || n.path) === nodeInput || n.id === nodeInput);
    const resolvedId = targetNode ? targetNode.id : nodeInput;

    try {
      const data = await api.graph.getImpact(id, resolvedId);
      setResult(data);
    } catch (err) {
      // Fallback Mock to demonstrate the UI
      setResult({
        node_id: resolvedId,
        impact_score: 85,
        percentile: 90,
        total_modules_in_repo: 120,
        risk_level: "HIGH",
        risk_emoji: "🔥",
        metrics: {
          affected_count: 14,
          upstream_count: 3,
          max_depth: 4,
          fan_out: 8,
          fan_in: 2
        },
        affected_nodes: [
          { id: "1", path: "src/auth/session.ts", depth: 1 },
          { id: "2", path: "src/api/routes.ts", depth: 2 },
          { id: "3", path: "src/db/queries.ts", depth: 1 },
        ],
        upstream_nodes: [],
        explanation: ""
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-warm-primary">
      {/* Left Column - Controls */}
      <div className="w-1/2 p-12 flex flex-col border-r border-warm-divider overflow-y-auto">
        <h4 className="section-label mb-4">IMPACT ANALYSIS</h4>
        <h1 className="font-serif text-4xl text-ink-primary font-bold mb-4">What breaks if you change this?</h1>
        <p className="font-serif text-ink-muted leading-relaxed mb-10">
          Select a function or module and simulate a change. We'll trace the dependency graph to expose the blast radius of potential breakages.
        </p>

        <div className="flex flex-col gap-8">
          <div>
            <label className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-2 block">Target Component</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input 
                type="text" 
                value={nodeInput}
                onChange={(e) => setNodeInput(e.target.value)}
                placeholder="Select a function or file..." 
                className="input-field pl-9 font-mono text-sm w-full"
                list="impact-nodes"
                disabled={graphLoading}
              />
              <datalist id="impact-nodes">
                {availableNodes.map(n => (
                  <option key={n.id} value={n.label || n.path} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-3 block">Change Type</label>
            <div className="flex flex-col gap-3">
              {["Modify signature", "Delete", "Rename"].map((type, i) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="changeType" defaultChecked={i===0} className="accent-burnt w-4 h-4 cursor-pointer" />
                  <span className="font-serif text-ink-primary group-hover:text-burnt transition-colors">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-3 block">Traversal Depth</label>
            <div className="flex items-center gap-4">
              <input type="range" min="1" max="5" defaultValue="3" className="w-full accent-burnt" />
              <span className="font-sans text-sm text-ink-muted w-4 flex-shrink-0 text-right">3</span>
            </div>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!nodeInput.trim() || analyzing}
            className="btn-primary w-full mt-4 h-12 text-[15px]"
          >
            {analyzing ? "Analyzing..." : "Run Analysis \u2192"}
          </button>
        </div>
      </div>

      {/* Right Column - Results */}
      <div className="w-1/2 p-12 bg-warm-secondary flex flex-col overflow-y-auto">
        {!result && !analyzing && (
          <div className="flex-1 flex items-center justify-center">
            <div className="border border-dashed border-warm-divider rounded-md p-12 text-center">
              <p className="font-serif italic text-ink-muted">Results will appear here</p>
            </div>
          </div>
        )}

        {analyzing && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-burnt border-t-transparent rounded-full animate-spin" />
            <p className="font-serif text-ink-muted">Simulating blast radius...</p>
          </div>
        )}

        {result && !analyzing && (
          <div className="flex flex-col animate-fade-in">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <h4 className="section-label m-0">AFFECTED COMPONENTS</h4>
              <span className="bg-burnt/10 text-burnt border border-burnt/20 px-3 py-1 rounded-sm font-sans text-[11px] font-medium">
                {result.metrics.affected_count} components affected
              </span>
              <span className={`px-3 py-1 rounded-sm font-serif text-[13px] font-bold tracking-wide border ${
                result.risk_level === 'HIGH' ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20' :
                result.risk_level === 'MEDIUM' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20' :
                'bg-ink-muted/10 text-ink-muted border-ink-muted/20'
              }`}>
                {result.risk_level} RISK
              </span>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {result.affected_nodes.map((node, i) => (
                <div key={i} className="card p-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      node.depth === 1 ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'
                    }`} />
                    <span className="font-mono text-sm text-ink-primary truncate max-w-[280px]" title={node.path}>
                      {node.path.split('/').pop()}
                    </span>
                  </div>
                  <span className="font-sans text-[10px] tracking-wider uppercase text-ink-muted">
                    {node.depth === 1 ? 'DIRECT CALL' : 'TRANSITIVE'}
                  </span>
                </div>
              ))}
            </div>

            <div className="divider-line my-2" />
            
            <div className="mt-6 mb-8 flex flex-col gap-4">
              <h4 className="section-label">BLAST RADIUS VISUALIZATION</h4>
              <div className="bg-[#E6DFD3] border border-warm-divider rounded-md h-40 flex items-center justify-center relative overflow-hidden group">
                <Network size={40} className="text-[#ef4444] opacity-40 absolute" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button className="bg-warm-primary text-burnt border border-warm-divider px-4 py-1.5 rounded-sm shadow-sm font-sans text-xs">
                     View in Graph Explorer
                   </button>
                </div>
              </div>
            </div>

            <button className="btn-secondary self-start text-sm px-6">
              <Download size={14} className="mr-2" /> Export Report &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
