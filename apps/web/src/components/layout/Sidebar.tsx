'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bell,
  Search,
  Cpu,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Building2,
  Database,
  Play,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}

const navSections = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Alerts', href: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'Investigation',
    items: [
      { label: 'Investigation', href: '/investigation', icon: Search },
      { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { label: 'Entities', href: '/entities', icon: Building2 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Model', href: '/model', icon: Cpu },
      { label: 'Dataset', href: '/dataset', icon: Database },
      { label: 'Demo', href: '/demo', icon: Play },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({
  mobileOpen,
  setMobileOpen,
  collapsed: externalCollapsed,
  setCollapsed: externalSetCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed =
    externalCollapsed !== undefined
      ? externalCollapsed
      : internalCollapsed;

  const setCollapsed =
    externalSetCollapsed ?? setInternalCollapsed;

  useEffect(() => {
    const saved = window.localStorage.getItem(
      'tracegraph-sidebar-collapsed'
    );

    if (saved === 'true') {
      setCollapsed(true);
    }
  }, [setCollapsed]);

  const toggleSidebar = () => {
    setCollapsed((previous) => {
      const next = !previous;

      window.localStorage.setItem(
        'tracegraph-sidebar-collapsed',
        String(next)
      );

      return next;
    });
  };

  const isActive = (href: string) => {
    if (!pathname) return false;

    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/60 md:hidden',
          'transition-opacity duration-300',
          mobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={[
          'flex flex-col',
          'bg-[var(--bg-sidebar)]',
          'border border-[var(--border)]',
          'rounded-lg',
          'overflow-hidden',

          /* Desktop layout */
          'md:sticky md:top-4',
          'md:h-[calc(100vh-32px)]',
          'md:translate-x-0',

          /* Mobile layout */
          'fixed top-0 bottom-0 left-0 z-50',
          'h-screen',
          'transition-[width,transform] duration-300',
          'ease-[cubic-bezier(0.22,1,0.36,1)]',

          collapsed ? 'md:w-[72px]' : 'md:w-full',

          mobileOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >

        {/* Sidebar Header */}
        <div
          className={[
            'relative flex h-[72px] shrink-0 items-center',
            'border-b border-[var(--border)]',
            collapsed
              ? 'justify-center px-3'
              : 'px-5',
          ].join(' ')}
        >

          {/* Brand */}
          <Link
            href="/"
            onClick={handleNavClick}
            className={[
              'flex min-w-0 items-center',
              'transition-transform duration-200',
              'hover:scale-[1.01]',
              collapsed
                ? 'justify-center'
                : 'gap-3',
            ].join(' ')}
          >

            {/* Logo */}
            <div
              className={[
                'flex h-10 w-10 shrink-0 items-center justify-center',
                'rounded-lg',
                'bg-[var(--accent-blue-dim)]',
                'border border-[rgba(59,130,246,0.3)]',
                'text-[var(--accent-blue)]',
              ].join(' ')}
            >
              <Shield className="h-5 w-5" />
            </div>

            {/* Brand Text */}
            <div
              className={[
                'overflow-hidden whitespace-nowrap',
                'transition-all duration-300',
                'ease-[cubic-bezier(0.22,1,0.36,1)]',
                collapsed
                  ? 'max-w-0 translate-x-[-8px] opacity-0'
                  : 'max-w-[150px] translate-x-0 opacity-100',
              ].join(' ')}
            >
              <div className="text-[17px] font-bold leading-none text-[var(--text-primary)]">
                TraceGraph{' '}
                <span className="text-[var(--accent-blue)]">
                  AI
                </span>
              </div>
              <div className="mt-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                OFFLINE · SYNTHETIC
              </div>
            </div>
          </Link>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
            className={[
              'absolute top-1/2 -translate-y-1/2',
              'hidden md:flex',
              'h-8 w-8',
              'items-center justify-center',
              'rounded-md',
              'border border-transparent',
              'text-[var(--text-muted)]',
              'transition-all duration-200',
              'hover:border-[var(--border)]',
              'hover:bg-[var(--bg-hover)]',
              'hover:text-[var(--text-primary)]',
              'active:scale-95',
              collapsed
                ? 'right-2'
                : 'right-3',
            ].join(' ')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="ml-auto rounded-md p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={[
            'flex-1 overflow-y-auto',
            collapsed
              ? 'px-3 py-4'
              : 'px-4 py-5',
          ].join(' ')}
        >
          <div className="space-y-5">
            {navSections.map((section) => (
              <div key={section.label}>
                {/* Section Label */}
                {!collapsed && (
                  <div className="section-title mb-1">
                    {section.label}
                  </div>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavClick}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={[
                          'group relative flex h-10 items-center',
                          'rounded-lg',
                          'text-[13px] font-medium',
                          'transition-all duration-200',

                          collapsed
                            ? 'justify-center px-0'
                            : 'gap-3 px-3',

                          active
                            ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
                            : [
                                'text-[var(--text-secondary)]',
                                'hover:bg-white/[0.035]',
                                'hover:text-[var(--text-primary)]',
                              ].join(' '),
                        ].join(' ')}
                      >

                        {/* Active Indicator */}
                        <span
                          className={[
                            'absolute left-0 top-1/2',
                            '-translate-y-1/2',
                            'w-[3px]',
                            'rounded-r-full',
                            'bg-[var(--accent-blue)]',
                            'transition-all duration-200',

                            active
                              ? 'h-5 opacity-100'
                              : 'h-0 opacity-0',
                          ].join(' ')}
                        />

                        {/* Icon */}
                        <Icon
                          className={[
                            'h-[18px] w-[18px] shrink-0',
                            'transition-colors duration-200',

                            active
                              ? 'text-[var(--accent-blue)]'
                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]',
                          ].join(' ')}
                        />

                        {/* Label */}
                        <span
                          className={[
                            'overflow-hidden whitespace-nowrap',
                            'transition-all duration-300',
                            'ease-[cubic-bezier(0.22,1,0.36,1)]',

                            collapsed
                              ? 'max-w-0 translate-x-[-8px] opacity-0'
                              : 'max-w-[140px] translate-x-0 opacity-100',
                          ].join(' ')}
                        >
                          {item.label}
                        </span>

                        {/* Collapsed Tooltip */}
                        {collapsed && (
                          <span
                            className={[
                              'pointer-events-none absolute',
                              'left-[calc(100%+12px)]',
                              'top-1/2',
                              '-translate-y-1/2',
                              'z-[100]',
                              'whitespace-nowrap',
                              'rounded-md',
                              'border border-[var(--border)]',
                              'bg-[var(--bg-card)]',
                              'px-3 py-2',
                              'text-xs text-[var(--text-primary)]',
                              'shadow-xl',
                              'opacity-0 translate-x-[-4px]',
                              'transition-all duration-150',
                              'group-hover:opacity-100',
                              'group-hover:translate-x-0',
                            ].join(' ')}
                          >
                            {item.label}
                          </span>
                        )}

                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Status */}
        {!collapsed && (
          <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-purple)]" />
              <span className="text-[11px] font-medium text-[var(--accent-purple)] uppercase tracking-wider">
                Offline · Synthetic Data
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}