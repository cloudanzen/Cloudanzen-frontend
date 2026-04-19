import { AuditControlStatus } from '@/services/api/audits';
import { useTranslation } from 'react-i18next';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysRemaining(end: string | null | undefined): number | null {
  if (!end) return null;
  const diff = new Date(end).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export const REVIEW_STATUS_META: Record<
  AuditControlStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-600' },
  COMPLIANT: { label: 'Compliant', color: 'bg-green-50 text-green-700' },
  NON_COMPLIANT: { label: 'Non-Compliant', color: 'bg-red-50 text-red-700' },
  NOT_APPLICABLE: {
    label: 'Not Applicable',
    color: 'bg-slate-100 text-slate-500',
  },
};

export function ReviewBadge({ status }: { status: AuditControlStatus }) {
  const { t } = useTranslation('auditor');
  const m = REVIEW_STATUS_META[status] ?? REVIEW_STATUS_META.PENDING;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}
    >
      {t(`reviewStatus.${status}`, m.label)}
    </span>
  );
}
