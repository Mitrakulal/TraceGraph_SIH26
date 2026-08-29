'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">

      {/* Application Layout */}
      <div className="min-h-screen p-3 md:p-4">

        <div
          className={[
            'grid min-h-[calc(100vh-24px)] md:min-h-[calc(100vh-32px)]',
            'gap-3 md:gap-4',
            'grid-cols-1',
            collapsed
              ? 'md:grid-cols-[72px_minmax(0,1fr)]'
              : 'md:grid-cols-[250px_minmax(0,1fr)]',
          ].join(' ')}
        >

          {/* Sidebar */}
          <Sidebar
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />

          {/* Main Content */}
          <div className="min-w-0 min-h-0 flex flex-col">

            {/* Mobile Header */}
            <header className="h-12 mb-3 border border-[var(--border)] bg-[var(--bg-sidebar)] rounded-lg flex items-center px-4 md:hidden shrink-0">

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-95 transition-all"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <span className="ml-3 font-semibold text-[13px] text-[var(--text-primary)]">
                TraceGraph AI
              </span>

              <span className="ml-auto text-[10px] font-medium text-[var(--accent-purple)] uppercase tracking-wider">
                Offline
              </span>

            </header>

            {/* Page Content */}
            <main className="w-full min-w-0 flex-1">
              {children}
            </main>

          </div>
        </div>
      </div>
    </div>
  );
}