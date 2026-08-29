'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { entities } from '@/data/entities';
import { getSeverity, getRiskBarClass } from '@/lib/utils';
import { Search, Building2, ArrowUpRight } from 'lucide-react';

export default function EntitiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

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
      {/* HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Entity Explorer</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Synthetic entity intelligence (Wallet Clusters, Addresses & Network Observations)
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md">
            1,832 MONITORED ENTITIES
          </span>
        </div>
      </section>

      {/* CONTROLS */}
      <section className="card p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search Entity ID or Cluster Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input h-9 text-xs"
          >
            <option value="ALL">Entity Type: All</option>
            <option value="Cluster">Cluster</option>
            <option value="Address">Address</option>
            <option value="IP">IP</option>
          </select>
        </div>
      </section>

      {/* TABLE */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Synthetic Entities</h2>
          <span className="font-mono text-xs text-[var(--text-secondary)]">
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
                    <td className="font-mono text-xs font-semibold text-[var(--accent-cyan)]">
                      {ent.id}
                    </td>
                    <td>
                      <span className="badge badge-blue">{ent.type}</span>
                    </td>
                    <td className="font-mono text-xs text-white">{ent.transactions}</td>
                    <td className="font-mono text-xs text-[var(--text-secondary)]">{ent.counterparties}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{ent.riskScore}</span>
                        <div className="risk-bar-track w-10 opacity-80">
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
                    <td className="font-mono text-[11px] text-[var(--text-muted)]">{ent.lastSeen}</td>
                    <td>
                      <Link
                        href={`/entities/${ent.id}`}
                        className="btn btn-ghost py-1 px-2 text-xs text-[var(--accent-blue)]"
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
