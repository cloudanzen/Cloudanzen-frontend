/**
 * riskDetail/shared.tsx — constants, scoring helpers and the inline select
 * used across the risk detail sections.
 */

import { type RiskStakeholder } from '@/services/api/riskCenter';

export const IMPACT_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const LIKELIHOOD_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const STATUS_OPTIONS = [
  'IDENTIFIED',
  'ASSESSING',
  'TREATING',
  'MONITORING',
  'CLOSED',
] as const;
export const TREATMENT_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'MITIGATE', label: 'Mitigate' },
  { value: 'ACCEPT', label: 'Accept' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'AVOID', label: 'Avoid' },
] as const;

export const SCORE_WEIGHTS: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function calcScore(impact: string, likelihood: string): number {
  return (SCORE_WEIGHTS[impact] ?? 2) * (SCORE_WEIGHTS[likelihood] ?? 2);
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function scoreColor(score: number): string {
  if (score >= 12) return 'text-red-600';
  if (score >= 6) return 'text-amber-600';
  if (score >= 3) return 'text-yellow-600';
  return 'text-green-600';
}

export function scoreBgColor(score: number): string {
  if (score >= 12) return 'bg-red-50 border-red-200';
  if (score >= 6) return 'bg-amber-50 border-amber-200';
  if (score >= 3) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}

export function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Inline select component ─────────────────────────────────────────────────

export function InlineSelect({
  value,
  options,
  onChange,
  disabled,
  className = '',
}: {
  value: string;
  options: readonly { value: string; label: string }[] | readonly string[];
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const opts = options.map((o) =>
    typeof o === 'string' ? { value: o, label: statusLabel(o) } : o,
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    >
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Stakeholder Edit Dialog ──────────────────────────────────────────────────

export interface StakeholderDialogProps {
  open: boolean;
  onClose: () => void;
  stakeholders: RiskStakeholder[];
  riskId: string;
}

export function activityDotColor(type: string): string {
  switch (type) {
    case 'DETECTED':
      return 'bg-red-500';
    case 'STAKEHOLDER_CHANGED':
      return 'bg-amber-500';
    case 'EVIDENCE':
      return 'bg-blue-500';
    case 'REMEDIATION':
      return 'bg-purple-500';
    case 'ACCEPTED':
      return 'bg-yellow-500';
    case 'ASSIGNED':
      return 'bg-green-500';
    default:
      return 'bg-foreground';
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
