"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader, AlertTriangle, Search, SlidersHorizontal, Settings2 } from "lucide-react";
import DependencyGraph from "@/components/DependencyGraph";
import GraphContextPanel from "@/components/GraphContextPanel";
import { api, type GraphData, type GraphNode } from "@/lib/api";

export default function GraphPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    setLoading(true);
    api.graph.get(id)
      .then(setGraphData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex h-full w-full relative bg-[#F0EBE1]">
      {/* Main Graph Area */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted">
            <Loader size={20} className="animate-spin mr-2" /> Building graph...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-muted">
            <AlertTriangle size={32} className="text-error mb-2" />
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && graphData && (
          <DependencyGraph 
            data={graphData} 
            onNodeClick={setSelectedNode} 
            selectedNodeId={selectedNode?.id} 
          />
        )}
      </div>

      {/* Floating Control Panel (Top-Right) */}
      <div className="absolute top-6 right-6 w-72 bg-warm-primary border border-warm-divider shadow-none rounded-md p-4 z-10 hidden md:block">
        <h4 className="section-label mb-3">CONTROLS</h4>
        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input 
              type="text" 
              placeholder="Find a node..." 
              className="w-full bg-warm-primary border border-warm-divider rounded-sm text-ink-primary font-serif text-sm pl-9 pr-3 py-1.5 focus:border-burnt outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {["Functions", "Files", "Classes"].map(filter => (
              <button 
                key={filter} 
                className="px-3 py-1 border border-burnt text-burnt rounded-full text-xs font-sans hover:bg-burnt hover:text-warm-primary transition-colors"
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Depth Slider */}
          <div className="flex flex-col gap-1">
            <label className="section-label flex items-center gap-1"><Settings2 size={12}/> Traversal Depth</label>
            <input type="range" className="w-full accent-burnt" min="1" max="5" defaultValue="2" />
          </div>

          <div className="divider-line my-1" />
          
          <div className="flex gap-4">
            <button className="text-burnt text-xs font-sans font-medium hover:text-burnt-hover">Reset View</button>
            <button className="text-burnt text-xs font-sans font-medium hover:text-burnt-hover">Export</button>
          </div>
        </div>
      </div>

      {/* Slide-in Detail Panel */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-[320px] bg-warm-secondary border-l border-warm-divider flex flex-col z-20 animate-slide-in shadow-xl shadow-black/5">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="bg-burnt/10 text-burnt px-2 py-0.5 rounded-sm font-sans tracking-wider uppercase text-[10px] border border-burnt/20">
                {selectedNode.label?.includes('()') ? 'FUNCTION' : 'FILE'}
              </span>
              <button onClick={() => setSelectedNode(null)} className="text-ink-muted hover:text-ink-primary text-xl leading-none">&times;</button>
            </div>
            
            <h2 className="font-serif text-2xl text-ink-primary font-bold mb-2 break-all">
              {selectedNode.label || selectedNode.path.split('/').pop()}
            </h2>
            <p className="font-mono text-xs text-ink-muted mb-6 break-all">
              {selectedNode.path}
            </p>
            
            <div className="divider-line mb-6" />

            <div className="flex flex-col gap-6">
              <div>
                <h4 className="section-label mb-3">CALLED BY</h4>
                <ul className="flex flex-col gap-2 font-serif text-sm text-ink-muted">
                  <li>— Node not actively imported —</li>
                </ul>
              </div>
              
              <div>
                <h4 className="section-label mb-3">CALLS</h4>
                <ul className="flex flex-col gap-2 font-serif text-sm text-ink-muted">
                  <li>— No outgoing dependencies —</li>
                </ul>
              </div>
            </div>
            
            <div className="divider-line my-6" />
            
            <button 
              className="text-burnt font-sans text-sm font-medium hover:underline flex items-center gap-1"
              onClick={() => router.push(`/repos/${id}/query?node=${selectedNode.id}`)}
            >
              Ask AI about this &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
