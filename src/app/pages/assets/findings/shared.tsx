/**
 * findings/shared.tsx — types and the small badge components used across the
 * findings page and its panels.
 *
 * Extracted verbatim from the original 1,487-line FindingsPage.tsx during the
 * Phase 4 split.
 */

import {
  FindingRecord,
  FindingSeverity,
  FindingStatus,
} from '@/services/api/findings';
import { RemediationActionStatus } from '@/services/api/remediation';
import {
  SEVERITY_META,
  STATUS_META,
} from '@/app/pages/compliance/useFindingsData';

export const KNOWN_SOURCE_TYPES = ['TEST_RUN', 'AUDIT', 'MANUAL'] as const;
export type KnownSourceType = (typeof KNOWN_SOURCE_TYPES)[number];
export const isKnownSourceType = (v: unknown): v is KnownSourceType =>
  typeof v === 'string' &&
  (KNOWN_SOURCE_TYPES as readonly string[]).includes(v);

export type AssetSlaStatus = 'OVERDUE' | 'DUE_SOON' | 'DUE_LATER' | 'OK';

export interface AssetGroup {
  assetId: string | null;
  assetName: string;
  assetType: string | null;
  openFindings: FindingRecord[];
  severityCounts: Record<FindingSeverity, number>;
  sourceTypes: string[];
  slaStatus: AssetSlaStatus;
  earliestDue: string | null;
}

export const ASSET_SLA_META: Record<
  AssetSlaStatus,
  { label: string; color: string }
> = {
  OVERDUE: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  DUE_SOON: { label: 'Due soon', color: 'bg-amber-100 text-amber-700' },
  DUE_LATER: { label: 'Due later', color: 'bg-blue-100 text-blue-700' },
  OK: { label: 'OK', color: 'bg-green-100 text-green-700' },
};

export function SeverityBreakdown({
  counts,
}: {
  counts: Record<FindingSeverity, number>;
}) {
  const ALL_PARTS: { sev: FindingSeverity; color: string }[] = [
    { sev: 'CRITICAL', color: 'text-red-600' },
    { sev: 'HIGH', color: 'text-orange-600' },
    { sev: 'MEDIUM', color: 'text-amber-600' },
    { sev: 'LOW', color: 'text-blue-600' },
  ];
  const parts = ALL_PARTS.filter(({ sev }) => counts[sev] > 0);

  if (parts.length === 0)
    return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
      {parts.map(({ sev, color }) => (
        <span key={sev} className={`text-xs font-semibold ${color}`}>
          {counts[sev]} {sev.charAt(0) + sev.slice(1).toLowerCase()}
        </span>
      ))}
    </div>
  );
}

export const IMPACT_META: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  LOW: { label: 'Low', color: 'bg-blue-100 text-blue-700' },
};

export function ImpactBadge({ impact }: { impact: string }) {
  const meta = IMPACT_META[impact] ?? {
    label: impact,
    color: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.LOW;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: FindingStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.OPEN;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

// ── Remediation status helpers ────────────────────────────────────────────────

export const REMEDIATION_STATUS_META: Record<
  RemediationActionStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-600' },
  DRY_RUN_READY: { label: 'Dry Run Ready', color: 'bg-blue-100 text-blue-700' },
  AWAITING_APPROVAL: {
    label: 'Awaiting Approval',
    color: 'bg-amber-100 text-amber-700',
  },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  EXECUTING: { label: 'Executing', color: 'bg-purple-100 text-purple-700' },
  SUCCEEDED: { label: 'Succeeded', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  ROLLED_BACK: { label: 'Rolled Back', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};
