'use client';

import React, { useState } from 'react';
import { AlertGraph, GraphNode, GraphEdge } from '@/data/graph';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface RelationshipGraphProps {
  graph: AlertGraph;
}

export function RelationshipGraph({ graph }: RelationshipGraphProps) {
  const [scale, setScale] = useState(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.6));
  const handleResetZoom = () => {
    setScale(1);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const getNodeColor = (node: GraphNode) => {
    if (node.suspicious) return 'stroke-[var(--accent-red)] fill-[var(--accent-red-dim)]';
    if (node.type === 'entity') return 'stroke-[var(--accent-blue)] fill-[var(--accent-blue-dim)]';
    if (node.type === 'transaction') return 'stroke-[var(--accent-cyan)] fill-[rgba(34,211,238,0.12)]';
    return 'stroke-[var(--accent-purple)] fill-[var(--accent-purple-dim)]';
  };

  return (
    <div className="card p-5 space-y-4">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="text-base font-semibold text-white">Synthetic Relationship Graph</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Time-safe topological graph proxy visualization (Synthetic entities, transactions & IP observations)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            className="btn btn-ghost p-1.5 text-xs"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs text-[var(--text-secondary)] min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="btn btn-ghost p-1.5 text-xs"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="btn btn-ghost p-1.5 text-xs"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-card-elevated)] p-2.5 rounded-md border border-[var(--border-subtle)]">
        <span className="font-semibold text-white text-[11px] uppercase tracking-wider">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 stroke-2 border-[var(--accent-red)] bg-[var(--accent-red-dim)]" />
          Suspicious Node
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[var(--accent-blue)] bg-[var(--accent-blue-dim)]" />
          Entity Wallet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[var(--accent-cyan)] bg-cyan-950/40" />
          Transaction
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[var(--accent-purple)] bg-[var(--accent-purple-dim)]" />
          IP Observation
        </span>
      </div>

      {/* GRAPH CANVAS & DETAILS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* GRAPH CANVAS */}
        <div className="lg:col-span-2 relative h-[420px] rounded-lg border border-[var(--border-subtle)] bg-[#0A0D12] overflow-hidden">
          <div
            className="w-full h-full transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${scale})` }}
          >
            <svg className="w-full h-full" viewBox="0 0 640 560">
              {/* EDGES */}
              {graph.edges.map((edge) => {
                const sourceNode = graph.nodes.find((n) => n.id === edge.source);
                const targetNode = graph.nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isSelected = selectedEdge?.id === edge.id;
                const isSuspiciousEdge = sourceNode.suspicious || targetNode.suspicious;

                return (
                  <g key={edge.id} className="cursor-pointer" onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isSelected ? '#3B82F6' : isSuspiciousEdge ? '#EF4444' : '#252B34'}
                      strokeWidth={isSelected ? 3 : isSuspiciousEdge ? 2 : 1.5}
                      strokeDasharray={edge.label.includes('network') ? '4 3' : undefined}
                    />
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 6}
                      fill={isSuspiciousEdge ? '#EF4444' : '#5F6978'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* NODES */}
              {graph.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => { setSelectedNode(node); setSelectedEdge(null); }}
                  >
                    {/* Glowing pulse if suspicious */}
                    {node.suspicious && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 26 : 22}
                        className="animate-ping opacity-25 fill-[var(--accent-red)]"
                      />
                    )}

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 24 : 20}
                      strokeWidth={isSelected ? 3 : 2}
                      className={getNodeColor(node)}
                    />

                    <text
                      x={node.x}
                      y={node.y + 4}
                      fill="#E7EAF0"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {node.label.slice(0, 10)}
                    </text>

                    {node.riskScore !== undefined && (
                      <rect
                        x={node.x - 14}
                        y={node.y + 24}
                        width="28"
                        height="14"
                        rx="3"
                        fill="#11151B"
                        stroke={node.riskScore >= 75 ? '#EF4444' : '#252B34'}
                        strokeWidth="1"
                      />
                    )}
                    {node.riskScore !== undefined && (
                      <text
                        x={node.x}
                        y={node.y + 34}
                        fill={node.riskScore >= 75 ? '#EF4444' : '#8B95A5'}
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {node.riskScore}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* DETAILS PANEL */}
        <div className="card-elevated p-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Element Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{selectedNode.label}</span>
                  {selectedNode.suspicious ? (
                    <span className="badge badge-high flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Flagged
                    </span>
                  ) : (
                    <span className="badge badge-low flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Normal
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-[var(--border)] pt-2 text-[var(--text-secondary)]">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-mono text-white capitalize">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synthetic Risk Score:</span>
                    <span className="font-mono font-bold text-white">{selectedNode.riskScore ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classification:</span>
                    <span className="font-mono text-[var(--accent-purple)]">
                      {selectedNode.suspicious ? 'Anomalous Subgraph' : 'Background Traffic'}
                    </span>
                  </div>
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-3 text-xs">
                <div className="font-semibold text-white">Relationship Edge</div>
                <div className="space-y-1.5 border-t border-[var(--border)] pt-2 text-[var(--text-secondary)]">
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="font-mono text-white">{selectedEdge.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span className="font-mono text-white">{selectedEdge.target}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Edge Type:</span>
                    <span className="font-mono text-[var(--accent-cyan)]">{selectedEdge.label}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                <Cpu className="h-6 w-6 mx-auto opacity-50" />
                <p>Click any node or edge in the graph to inspect synthetic topological properties.</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[var(--text-muted)] border-t border-[var(--border)] pt-2 font-mono">
            Graph Proxy Version: <span className="text-white">v2-time-safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
