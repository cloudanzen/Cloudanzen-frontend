/**
 * audit-detail/shared.tsx — constants and small helpers used across the audit
 * detail tabs.
 *
 * Extracted verbatim from the original 2,267-line AuditDetailPage.tsx during
 * the Phase 4 split.
 */

import { AuditRequestStatus } from '@/services/api/audits';

export function isoPrefix(ref: string): string {
  // "A.5.15" → "A.5", "CC1.1" → "CC1", "8.1" → "8"
  const m = ref.match(/^([A-Za-z]+\.\d+|\d+)/);
  return m ? (m[1] ?? ref) : ref.split('.').slice(0, 2).join('.');
}

export const REVIEW_STATUS_COLORS: Record<string, string> = {
  COMPLIANT: 'bg-green-50 text-green-700',
  NON_COMPLIANT: 'bg-red-50 text-red-700',
  NOT_APPLICABLE: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-gray-100 text-gray-500',
};

export const FINDING_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-orange-50 text-orange-700',
  IN_REMEDIATION: 'bg-blue-50 text-blue-700',
  READY_FOR_REVIEW: 'bg-purple-50 text-purple-700',
  CLOSED: 'bg-green-50 text-green-700',
};

export const FINDING_SEVERITY_COLORS: Record<string, string> = {
  MAJOR: 'bg-red-50 text-red-700',
  MINOR: 'bg-amber-50 text-amber-700',
  OBSERVATION: 'bg-blue-50 text-blue-700',
  OFI: 'bg-slate-100 text-slate-600',
};

export const REQUEST_STATUS_COLORS: Record<AuditRequestStatus, string> = {
  NOT_READY: 'bg-slate-100 text-slate-600',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  READY_FOR_AUDIT: 'bg-purple-50 text-purple-700',
  FLAGGED: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  NOT_APPLICABLE: 'bg-gray-100 text-gray-500',
};

export const REQUEST_STATUS_OPTIONS: AuditRequestStatus[] = [
  'NOT_READY',
  'IN_REVIEW',
  'READY_FOR_AUDIT',
  'FLAGGED',
  'ACCEPTED',
  'NOT_APPLICABLE',
];

// ── Overview Tab ─────────────────────────────────────────────────────────────

export function RequestStatusBadge({ status }: { status: AuditRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_STATUS_COLORS[status]}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

// ── Evidence Tab (ISO category folders) ──────────────────────────────────────
