'use client';

import React, { useMemo, useState } from 'react';
import { syntheticEvents, SyntheticEvent } from '@/data/events';
import { getSeverity, getRiskBarClass, formatTimestamp } from '@/lib/utils';
import { Search, RotateCcw, X, ArrowLeftRight, ShieldAlert } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
      <section className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Synthetic Event Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Synthetic Bitcoin-style transaction events with model risk scores
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full">
          60,000 SYNTHETIC EVENTS
        </span>
      </section>

      {/* CONTROLS */}
      <section className="card p-5 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Event ID, Sender, or Receiver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 h-10 text-xs"
            />
          </div>

          <CustomSelect
            value={riskFilter}
            onChange={(val) => setRiskFilter(val)}
            options={[
              { value: 'ALL', label: 'Risk Level: All' },
              { value: 'HIGH', label: 'High (≥75)' },
              { value: 'MEDIUM', label: 'Medium (50–74)' },
              { value: 'LOW', label: 'Low (<50)' },
            ]}
          />

          <CustomSelect
            value={anomalyFilter}
            onChange={(val) => setAnomalyFilter(val)}
            options={[
              { value: 'ALL', label: 'Anomaly Status: All' },
              { value: 'Anomaly', label: 'Anomaly' },
              { value: 'Borderline', label: 'Borderline' },
              { value: 'Normal', label: 'Normal' },
            ]}
          />
        </div>

        {(search || riskFilter !== 'ALL' || anomalyFilter !== 'ALL') && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* TABLE */}
      <section className="card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Events</h2>
          <span className="font-mono text-xs text-slate-500">
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
                  className="cursor-pointer"
                >
                  <td className="font-mono text-xs font-bold text-blue-600">
                    {evt.eventId}
                  </td>
                  <td className="font-mono text-[11px] text-slate-400">
                    {formatTimestamp(evt.timestamp)}
                  </td>
                  <td className="font-mono text-xs text-blue-600 font-medium">{evt.sender}</td>
                  <td className="font-mono text-xs text-slate-500">{evt.receiver}</td>
                  <td className="font-mono text-xs text-slate-900 font-bold">
                    {evt.amountBtc.toFixed(2)} BTC
                  </td>
                  <td className="font-mono text-xs text-slate-400">
                    {evt.feeBtc.toFixed(4)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{evt.riskScore}</span>
                      <div className="risk-bar-track w-12">
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
                  <td className="text-xs text-slate-500">{evt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* EVENT DETAIL DRAWER / MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 border border-blue-200 relative shadow-elevated">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-mono text-base font-bold text-slate-900">
                  {selectedEvent.eventId}
                </h3>
                <p className="text-xs text-slate-400">Synthetic Transaction Event Detail</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-900 font-bold">{formatTimestamp(selectedEvent.timestamp)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-400">Sender Wallet:</span>
                <span className="font-mono text-blue-600 font-medium">{selectedEvent.sender}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-400">Receiver Wallet:</span>
                <span className="font-mono text-blue-600 font-medium">{selectedEvent.receiver}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono font-bold text-slate-900">{selectedEvent.amountBtc} BTC</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-400">Inputs / Outputs:</span>
                <span className="font-mono text-slate-900">
                  {selectedEvent.inputCount} in / {selectedEvent.outputCount} out
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-400">Synthetic Risk Score:</span>
                <span className="font-mono font-bold text-red-600">
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
