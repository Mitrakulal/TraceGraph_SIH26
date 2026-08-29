'use client';

import React, { useMemo, useState } from 'react';
import { syntheticEvents, SyntheticEvent } from '@/data/events';
import { getSeverity, getRiskBarClass, formatTimestamp } from '@/lib/utils';
import { Search, RotateCcw, X, ArrowLeftRight, ShieldAlert } from 'lucide-react';

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<SyntheticEvent | null>(null);

  const filteredEvents = useMemo(() => {
    return syntheticEvents.filter((evt) => {
      /* RISK FILTER */
      if (riskFilter !== 'ALL') {
        const severity = getSeverity(evt.riskScore);
        if (severity !== riskFilter) return false;
      }

      /* ANOMALY FILTER */
      if (anomalyFilter !== 'ALL' && evt.anomalyStatus !== anomalyFilter) {
        return false;
      }

      /* SEARCH */
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          evt.eventId.toLowerCase().includes(q) ||
          evt.sender.toLowerCase().includes(q) ||
          evt.receiver.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [search, riskFilter, anomalyFilter]);

  const resetFilters = () => {
    setSearch('');
    setRiskFilter('ALL');
    setAnomalyFilter('ALL');
  };

  return (
    <div className="w-full space-y-6 pb-8">
      {/* HEADER */}
      <section className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Synthetic Event Explorer</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Synthetic Bitcoin-style transaction events with model risk scores
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--accent-purple)] bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-md">
            60,000 SYNTHETIC EVENTS
          </span>
        </div>
      </section>

      {/* CONTROLS */}
      <section className="card p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search Event ID, Sender, or Receiver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="input h-9 text-xs"
          >
            <option value="ALL">Risk Level: All</option>
            <option value="HIGH">High (≥75)</option>
            <option value="MEDIUM">Medium (50–74)</option>
            <option value="LOW">Low (&lt;50)</option>
          </select>

          <select
            value={anomalyFilter}
            onChange={(e) => setAnomalyFilter(e.target.value)}
            className="input h-9 text-xs"
          >
            <option value="ALL">Anomaly Status: All</option>
            <option value="Anomaly">Anomaly</option>
            <option value="Borderline">Borderline</option>
            <option value="Normal">Normal</option>
          </select>
        </div>

        {(search || riskFilter !== 'ALL' || anomalyFilter !== 'ALL') && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* TABLE */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Events</h2>
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            Showing {filteredEvents.length} events
          </span>
        </div>

        <div className="data-table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount (BTC)</th>
                <th>Fee (BTC)</th>
                <th>Risk Score</th>
                <th>Anomaly</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <td className="font-mono text-xs font-semibold text-[var(--accent-blue)]">
                    {evt.eventId}
                  </td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">
                    {formatTimestamp(evt.timestamp)}
                  </td>
                  <td className="font-mono text-xs text-[var(--accent-cyan)]">{evt.sender}</td>
                  <td className="font-mono text-xs text-[var(--text-secondary)]">{evt.receiver}</td>
                  <td className="font-mono text-xs text-white font-semibold">
                    {evt.amountBtc.toFixed(2)} BTC
                  </td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">
                    {evt.feeBtc.toFixed(4)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{evt.riskScore}</span>
                      <div className="risk-bar-track w-10 opacity-80">
                        <div
                          className={`h-full ${getRiskBarClass(evt.riskScore)}`}
                          style={{ width: `${evt.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        evt.anomalyStatus === 'Anomaly'
                          ? 'badge badge-high'
                          : evt.anomalyStatus === 'Borderline'
                          ? 'badge badge-medium'
                          : 'badge badge-low'
                      }
                    >
                      {evt.anomalyStatus}
                    </span>
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">{evt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* EVENT DETAIL DRAWER / MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card-elevated w-full max-w-lg p-6 space-y-4 border border-[var(--accent-blue)] relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <ArrowLeftRight className="h-5 w-5 text-[var(--accent-blue)]" />
              <div>
                <h3 className="font-mono text-base font-bold text-white">
                  {selectedEvent.eventId}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Synthetic Transaction Event Detail</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-[var(--border-subtle)] py-1.5">
                <span className="text-[var(--text-muted)]">Timestamp:</span>
                <span className="font-mono text-white">{formatTimestamp(selectedEvent.timestamp)}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] py-1.5">
                <span className="text-[var(--text-muted)]">Sender Wallet:</span>
                <span className="font-mono text-[var(--accent-cyan)]">{selectedEvent.sender}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] py-1.5">
                <span className="text-[var(--text-muted)]">Receiver Wallet:</span>
                <span className="font-mono text-[var(--accent-cyan)]">{selectedEvent.receiver}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] py-1.5">
                <span className="text-[var(--text-muted)]">Amount:</span>
                <span className="font-mono font-bold text-white">{selectedEvent.amountBtc} BTC</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] py-1.5">
                <span className="text-[var(--text-muted)]">Inputs / Outputs:</span>
                <span className="font-mono text-white">
                  {selectedEvent.inputCount} in / {selectedEvent.outputCount} out
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] py-1.5">
                <span className="text-[var(--text-muted)]">Synthetic Risk Score:</span>
                <span className="font-mono font-bold text-[var(--accent-red)]">
                  {selectedEvent.riskScore} / 100
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="btn btn-ghost text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
