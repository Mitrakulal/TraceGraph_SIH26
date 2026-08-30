'use client';

import React from 'react';
import { Cpu, AlertTriangle, ShieldCheck, ArrowRight, Network } from 'lucide-react';

export interface InspectorNodeSelection {
  type: 'node';
  id: string;
  label: string;
  category: string;
  degree: number;
  connections: {
    nodeId: string;
    nodeLabel: string;
    edgeLabel: string;
  }[];
}

export interface InspectorEdgeSelection {
  type: 'edge';
  id: string;
  label: string;
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
}

export type InspectorSelection = InspectorNodeSelection | InspectorEdgeSelection | null;

interface InspectorProps {
  selection: InspectorSelection;
}

export function Inspector({ selection }: InspectorProps) {
  const getCategoryPrettyName = (category: string) => {
    switch (category) {
      case 'suspicious':
        return 'Suspicious Entity';
      case 'transaction':
        return 'Transaction Event';
      case 'entity_wallet':
        return 'Entity Wallet';
      case 'ip_observation':
        return 'IP Observation';
      default:
        return category;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 flex flex-col justify-between h-full space-y-4 shadow-sm">
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Network className="h-3.5 w-3.5 text-blue-600" />
          Element Inspector
        </h3>

        {/* NODE SELECTION */}
        {selection?.type === 'node' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  {selection.label}
                </span>
                <span className="font-mono text-[11px] text-slate-500">ID: #{selection.id}</span>
              </div>

              <span
                className={
                  selection.category === 'suspicious'
                    ? 'badge badge-high'
                    : selection.category === 'transaction'
                    ? 'badge badge-low'
                    : 'badge badge-blue'
                }
              >
                {getCategoryPrettyName(selection.category)}
              </span>
            </div>

            <div className="space-y-2 border-b border-slate-200/80 pb-3 text-slate-600">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Category:</span>
                <span className="font-mono font-bold text-slate-900">
                  {getCategoryPrettyName(selection.category)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Degree (Edges):</span>
                <span className="font-mono font-extrabold text-blue-600">
                  {selection.degree} connected
                </span>
              </div>
            </div>

            {/* CONNECTIONS LIST */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Connected Topology:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selection.connections.map((conn, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 text-[11px]"
                  >
                    <span className="font-mono font-bold text-slate-800">#{conn.nodeId}</span>
                    <span className="badge badge-neutral text-[10px]">{conn.edgeLabel}</span>
                    <span className="font-mono text-blue-600 font-semibold">{conn.nodeLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EDGE SELECTION */}
        {selection?.type === 'edge' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  Edge: {selection.label}
                </span>
                <span className="font-mono text-[11px] text-slate-500">ID: {selection.id}</span>
              </div>
              <span className="badge badge-purple">Connected Edge</span>
            </div>

            <div className="space-y-2 border-b border-slate-200/80 pb-3 text-slate-600">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Source:</span>
                <span className="font-mono font-bold text-slate-900">
                  #{selection.sourceId} ({selection.sourceLabel})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Target:</span>
                <span className="font-mono font-bold text-slate-900">
                  #{selection.targetId} ({selection.targetLabel})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Edge Label:</span>
                <span className="font-mono font-bold text-blue-600">{selection.label}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Highlighted connected nodes: #{selection.sourceId} → #{selection.targetId}</span>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!selection && (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <Cpu className="h-8 w-8 mx-auto opacity-30 text-slate-500" />
            <p className="max-w-[220px] mx-auto leading-relaxed">
              Click any node or edge in the graph to inspect synthetic topological properties.
            </p>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 border-t border-slate-200/80 pt-3 font-mono text-right">
        Graph Proxy Version: <span className="font-bold text-slate-700">v2-time-safe</span>
      </div>
    </div>
  );
}
