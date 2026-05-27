import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface MascotHelperProps {
  message: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
  compact?: boolean;
}

const VARIANT_STYLES = {
  default: 'bg-slate-50 border-slate-200 text-slate-700',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
};

const ICON_STYLES = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-sky-100 text-sky-600',
};

export function MascotHelper({
  message,
  variant = 'default',
  compact = false,
}: MascotHelperProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${VARIANT_STYLES[variant]}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex-shrink-0 rounded-lg p-1.5 ${ICON_STYLES[variant]} ${compact ? 'w-7 h-7' : 'w-9 h-9'} flex items-center justify-center`}
      >
        <ShieldCheck
          className={compact ? 'w-4 h-4' : 'w-5 h-5'}
          aria-hidden="true"
        />
      </div>
      <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed`}>
        {message}
      </p>
    </div>
  );
}
