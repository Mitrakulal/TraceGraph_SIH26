'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  icon,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'flex h-10 w-full items-center justify-between gap-2 rounded-full border bg-white px-4 py-2 text-xs font-semibold transition-all duration-150',
          open
            ? 'border-slate-900 shadow-md ring-2 ring-slate-900/10'
            : 'border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          <span>{selectedOption ? selectedOption.label : placeholder || value}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-slate-900' : ''
          }`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-full w-max max-h-60 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-lg">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors',
                  isSelected
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
