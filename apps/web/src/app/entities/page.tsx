'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { entities } from '@/data/entities';
import { getSeverity, getRiskBarClass } from '@/lib/utils';
import { Search, Building2, ArrowUpRight } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { api } from '@/lib/api';

export default function EntitiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    async function checkBackend() {
      const status = await api.getStatus();
      if (status && status.model_ready) {
        setIsBackendConnected(true);
      }
    }
    checkBackend();
  }, []);

  const filteredEntities = useMemo(() => {
    return entities.filter((ent) => {
      if (typeFilter !== 'ALL' && ent.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!ent.id.toLowerCase().includes(q) && !ent.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [search, typeFilter]);

  return (
    <div className="w-full space-y-6 pb-8">
      {!isBackendConnected && (
        <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-700">
            BACKEND NOT CONNECTED — showing placeholder data, not live model output.
          </p>
          <p className="mt-1 text-xs font-medium text-red-600">
            Start the API at http://127.0.0.1:8000 before recording or evaluating. Do not screenshot this state.
          </p>
        </div>
      )}

      {/* HEADER */}

      <section className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Entity Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Synthetic entity intelligence (Wallet Clusters, Addresses & Network Observations)
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full">
          1,832 MONITORED ENTITIES
        </span>
      </section>

      {/* CONTROLS */}
      <section className="card p-5 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Entity ID or Cluster Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 h-10 text-xs"
            />
          </div>

          <CustomSelect
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            options={[
              { value: 'ALL', label: 'Entity Type: All' },
              { value: 'Cluster', label: 'Cluster' },
              { value: 'Address', label: 'Address' },
              { value: 'IP', label: 'IP' },
            ]}
          />
        </div>
      </section>

      {/* TABLE */}
      <section className="card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Synthetic Entities</h2>
          <span className="font-mono text-xs text-slate-500">
            Showing {filteredEntities.length} entities
          </span>
        </div>

        <div className="data-table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity ID</th>
                <th>Type</th>
                <th>Events</th>
                <th>Counterparties</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map((ent) => {
                const severity = getSeverity(ent.riskScore);
                return (
                  <tr key={ent.id}>
                    <td className="font-mono text-xs font-bold text-blue-600">
                      {ent.id}
                    </td>
                    <td>
                      <span className="badge badge-blue">{ent.type}</span>
                    </td>
                    <td className="font-mono text-xs font-bold text-slate-900">{ent.transactions}</td>
                    <td className="font-mono text-xs text-slate-500">{ent.counterparties}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{ent.riskScore}</span>
                        <div className="risk-bar-track w-12">
                          <div
                            className={`h-full ${getRiskBarClass(ent.riskScore)}`}
                            style={{ width: `${ent.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          ent.status === 'Flagged'
                            ? 'badge badge-high'
                            : ent.status === 'Monitored'
                            ? 'badge badge-medium'
                            : 'badge badge-low'
                        }
                      >
                        {ent.status}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-slate-400">{ent.lastSeen}</td>
                    <td>
                      <Link
                        href={`/entities/${ent.id}`}
                        className="btn btn-ghost py-1 px-3 text-xs text-blue-600 hover:bg-blue-50 font-bold"
                      >
                        Inspect <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
