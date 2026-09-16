'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { entities } from '@/data/entities';
import { syntheticEvents } from '@/data/events';
import { getSeverity, getRiskBarClass, formatTimestamp } from '@/lib/utils';
import { ArrowLeft, Building2, ShieldAlert, Activity, Cpu } from 'lucide-react';
import { api, ApiGraphPayload } from '@/lib/api';

export default function EntityDetailPage() {
  const params = useParams();
  const entityId = (params?.id as string) ?? 'syn_w_0042';

  const [graph, setGraph] = useState<ApiGraphPayload | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    async function loadGraph() {
      const res = await api.getEntityGraph(entityId, 2, 60);
      if (res && res.nodes) {
        setGraph(res);
        setIsBackendConnected(true);
      }
    }
    loadGraph();
  }, [entityId]);

  const mockEntity = entities.find((e) => e.id === entityId) ?? entities[0];
  const nodeCount = graph?.summary?.node_count ?? mockEntity.transactions;
  const edgeCount = graph?.summary?.edge_count ?? mockEntity.counterparties;

  const focusNode = graph?.nodes?.find((n) => n.is_focus);
  const activeScore = focusNode?.risk_score ?? mockEntity.riskScore;
  const severity = getSeverity(activeScore);

  return (
    <div className="w-full space-y-6 pb-12">
      {!isBackendConnected && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">
            Backend service unavailable — displaying sample data.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">

        <Link
          href="/entities"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Entities Explorer
        </Link>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full">
          {isBackendConnected ? 'LIVE GRAPH API' : 'OFFLINE SYNTHETIC'}
        </span>
      </div>

      <section className="card p-6 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-blue">WALLET</span>
              <span
                className={
                  severity === 'HIGH'
                    ? 'badge badge-high'
                    : severity === 'MEDIUM'
                    ? 'badge badge-medium'
                    : 'badge badge-low'
                }
              >
                {severity} RISK
              </span>
            </div>
            <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">{entityId}</h1>
            <p className="text-xs text-slate-500">Synthetic wallet cluster identifier</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
            <div
              className="score-ring"
              style={{
                borderColor: activeScore >= 75 ? '#EF4444' : activeScore >= 50 ? '#F59E0B' : '#22C55E',
                color: activeScore >= 75 ? '#EF4444' : activeScore >= 50 ? '#F59E0B' : '#22C55E',
              }}
            >
              {activeScore}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Risk Score</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Synthetically scored</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Connected Nodes</span>
            <span className="font-mono text-lg font-bold text-slate-900 mt-1 block">{nodeCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Graph Edges</span>
            <span className="font-mono text-lg font-bold text-blue-600 mt-1 block">
              {edgeCount}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Traversal Depth</span>
            <span className="font-mono text-lg font-bold text-amber-500 mt-1 block">
              2 Hops
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Classification</span>
            <span className="font-mono text-sm font-bold text-purple-600 mt-1 block">SYNTHETIC ONLY</span>
          </div>
        </div>
      </section>

      {/* GRAPH NODES DATA TABLE */}
      <section className="card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Graph Topology Nodes</h2>
          <span className="font-mono text-xs text-slate-500">
            {graph?.nodes?.length ?? 4} nodes
          </span>
        </div>
        <div className="data-table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Node ID</th>
                <th>Type</th>
                <th>Label</th>
                <th>Focus Node</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {graph?.nodes ? (
                graph.nodes.map((n) => (
                  <tr key={n.id}>
                    <td className="font-mono text-xs font-bold text-blue-600">{n.id}</td>
                    <td>
                      <span className={n.type === 'WALLET' ? 'badge badge-blue' : 'badge badge-neutral'}>
                        {n.type}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-medium text-slate-900">{n.label}</td>
                    <td className="font-mono text-xs text-slate-500">{n.is_focus ? 'YES (FOCUS)' : 'NO'}</td>
                    <td>
                       <span className="font-mono text-xs font-bold text-slate-900">{n.risk_score ?? 'N/A'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                syntheticEvents.slice(0, 4).map((evt) => (
                  <tr key={evt.id}>
                    <td className="font-mono text-xs font-bold text-blue-600">{evt.eventId}</td>
                    <td><span className="badge badge-blue">WALLET</span></td>
                    <td className="font-mono text-xs font-medium text-slate-900">{evt.sender}</td>
                    <td className="font-mono text-xs text-slate-500">NO</td>
                    <td>
                       <span className="font-mono text-xs font-bold text-slate-900">{evt.riskScore}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
