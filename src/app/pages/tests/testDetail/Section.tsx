import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function Section({
  title,
  icon,
  actions,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {icon}
          {title}
        </span>
        <div className="flex items-center gap-2">
          {actions && (
            <span onClick={(e) => e.stopPropagation()}>{actions}</span>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export function DetailStatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'attention' | 'success';
}) {
  const toneClass =
    tone === 'attention'
      ? 'border-amber-200 bg-amber-50'
      : tone === 'success'
        ? 'border-green-200 bg-green-50'
        : 'border-gray-200 bg-gray-50';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <div className="mt-2 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
