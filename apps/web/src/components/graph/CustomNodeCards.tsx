'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AlertTriangle, DollarSign, Wallet, Globe, Shield } from 'lucide-react';

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  category: 'suspicious' | 'transaction' | 'entity_wallet' | 'ip_observation';
  numericId: string | number;
  highlighted?: boolean;
}

export const SuspiciousNodeCard = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const isHighlighted = nodeData.highlighted || selected;

  return (
    <div
      className={[
        'relative w-[220px] p-3.5 rounded-xl border bg-rose-50/90 shadow-sm transition-all duration-200',
        isHighlighted
          ? 'border-rose-600 ring-2 ring-rose-500/40 shadow-md scale-105'
          : 'border-rose-400 hover:border-rose-500 hover:shadow',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
          Suspicious
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[9px] font-bold text-rose-700">
          <AlertTriangle className="h-2.5 w-2.5" /> ⚠ suspicious
        </span>
      </div>

      <div className="font-mono text-xs font-extrabold text-slate-900 truncate">
        {nodeData.label}
      </div>

      <div className="font-mono text-[11px] font-medium text-slate-500 mt-1">
        ID: #{nodeData.numericId}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white"
      />
    </div>
  );
});
SuspiciousNodeCard.displayName = 'SuspiciousNodeCard';

export const TransactionNodeCard = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const isHighlighted = nodeData.highlighted || selected;

  return (
    <div
      className={[
        'relative w-[220px] p-3.5 rounded-xl border bg-emerald-50/90 shadow-sm transition-all duration-200',
        isHighlighted
          ? 'border-emerald-600 ring-2 ring-emerald-500/40 shadow-md scale-105'
          : 'border-emerald-400 hover:border-emerald-500 hover:shadow',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
          Transaction
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
          <DollarSign className="h-2.5 w-2.5" /> transaction
        </span>
      </div>

      <div className="font-mono text-xs font-extrabold text-slate-900 truncate">
        {nodeData.label}
      </div>

      <div className="font-mono text-[11px] font-medium text-slate-500 mt-1">
        ID: #{nodeData.numericId}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
});
TransactionNodeCard.displayName = 'TransactionNodeCard';

export const WalletNodeCard = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const isHighlighted = nodeData.highlighted || selected;

  return (
    <div
      className={[
        'relative w-[220px] p-3.5 rounded-xl border bg-sky-50/90 shadow-sm transition-all duration-200',
        isHighlighted
          ? 'border-sky-600 ring-2 ring-sky-500/40 shadow-md scale-105'
          : 'border-sky-400 hover:border-sky-500 hover:shadow',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-sky-500 !border-2 !border-white"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
          Entity Wallet
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-300 px-2 py-0.5 text-[9px] font-bold text-sky-700">
          <Wallet className="h-2.5 w-2.5" /> wallet
        </span>
      </div>

      <div className="font-mono text-xs font-extrabold text-slate-900 truncate">
        {nodeData.label}
      </div>

      <div className="font-mono text-[11px] font-medium text-slate-500 mt-1">
        ID: #{nodeData.numericId}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-sky-500 !border-2 !border-white"
      />
    </div>
  );
});
WalletNodeCard.displayName = 'WalletNodeCard';

export const IPNodeCard = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const isHighlighted = nodeData.highlighted || selected;

  return (
    <div
      className={[
        'relative w-[220px] p-3.5 rounded-xl border bg-violet-50/90 shadow-sm transition-all duration-200',
        isHighlighted
          ? 'border-violet-600 ring-2 ring-violet-500/40 shadow-md scale-105'
          : 'border-violet-400 hover:border-violet-500 hover:shadow',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
          IP Observation
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 border border-violet-300 px-2 py-0.5 text-[9px] font-bold text-violet-700">
          <Globe className="h-2.5 w-2.5" /> ip obs
        </span>
      </div>

      <div className="font-mono text-xs font-extrabold text-slate-900 truncate">
        {nodeData.label}
      </div>

      <div className="font-mono text-[11px] font-medium text-slate-500 mt-1">
        ID: #{nodeData.numericId}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white"
      />
    </div>
  );
});
IPNodeCard.displayName = 'IPNodeCard';
