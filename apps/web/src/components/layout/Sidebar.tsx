'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bell,
  Search,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Building2,
  Settings,
  Zap,
  Cpu,
  Database,
  PlayCircle,
  Moon,
  Sun,
  Upload,
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
      { label: 'Bulk Ingestion', href: '/upload', icon: Upload },
      { label: 'Live Ingest & Inspector', href: '/inspector', icon: Zap },
      { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { label: 'Entities', href: '/entities', icon: Building2 },
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check saved theme on load
    const savedTheme = window.localStorage.getItem('tracegraph-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark-theme');
        window.localStorage.setItem('tracegraph-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark-theme');
        window.localStorage.setItem('tracegraph-theme', 'light');
      }
      return next;
    });
  };

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
          'bg-white',
          'border border-slate-200/80',
          'rounded-3xl',
          'shadow-sm',
          'relative',

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
        {/* Desktop Collapse Button - Vertically Centered on Right Border Line */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            collapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          className={[
            'absolute top-1/2 -translate-y-1/2 -right-3.5 z-30',
            'hidden md:flex',
            'h-7 w-7',
            'items-center justify-center',
            'rounded-full',
            'border border-slate-200/90',
            'text-slate-600',
            'bg-white shadow-md',
            'transition-all duration-200',
            'hover:border-slate-400',
            'hover:bg-slate-50',
            'hover:text-slate-900 hover:scale-105',
            'active:scale-95',
          ].join(' ')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-700" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-700" />
          )}
        </button>

        {/* Sidebar Header */}
        <div
          className={[
            'relative flex h-[72px] shrink-0 items-center',
            'border-b border-slate-100',
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
                'rounded-2xl',
                'bg-slate-900',
                'text-white',
                'shadow-sm',
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
              <div className="text-[17px] font-extrabold leading-none text-slate-900 tracking-tight">
                TraceGraph{' '}
                <span className="text-blue-600">
                  AI
                </span>
              </div>
              <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                v2.0
              </div>
            </div>
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="ml-auto rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
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
                  <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                          'rounded-full',
                          'text-[13px]',
                          'transition-all duration-200',

                          collapsed
                            ? 'justify-center px-0'
                            : 'gap-3 px-3.5',

                          active
                            ? 'bg-slate-900 text-white font-semibold shadow-sm'
                            : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900',
                        ].join(' ')}
                      >

                        {/* Icon */}
                        <Icon
                          className={[
                            'h-[18px] w-[18px] shrink-0',
                            'transition-colors duration-200',

                            active
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-slate-700',
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
                              'rounded-xl',
                              'border border-slate-200',
                              'bg-white',
                              'px-3 py-1.5',
                              'text-xs font-semibold text-slate-800',
                              'shadow-lg',
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
        <div className="shrink-0 border-t border-slate-100 p-4 space-y-3">
          
          <button
            onClick={toggleTheme}
            className={[
              'flex items-center justify-center w-full h-10',
              'rounded-full text-[13px] font-bold transition-all',
              isDark 
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            ].join(' ')}
            title={collapsed ? (isDark ? "Light Mode" : "Dark Mode") : undefined}
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2">Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2">Dark Mode</span>}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}