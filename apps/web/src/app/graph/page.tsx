'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';

const DynamicGraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then((mod) => mod.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-7xl mx-auto p-8 h-[540px] flex items-center justify-center bg-slate-50 rounded-3xl border border-slate-200">
        <div className="flex items-center gap-2 font-semibold text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Loading React Flow v12 Relationship Graph...
        </div>
      </div>
    ),
  }
);

export default function GraphPage() {
  return (
    <main className="w-full min-h-screen bg-slate-50/50">
      <DynamicGraphCanvas />
    </main>
  );
}
