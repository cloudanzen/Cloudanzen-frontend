/**
 * Friendly UI labels for AuditRequestStatus enum values.
 *
 * Used by AuditDetailPage RequestsTab + TodoPage Assigned Audit Requests
 * section + notification copy. Pair with the i18n keys under
 * `auditDetail.requests.status.*` in compliance.json — this map is for
 * code that needs label strings outside the React tree (e.g. notification
 * templates) or where the raw enum is acceptable as the key.
 */

import type { AuditRequestStatus } from '@/services/api/audits';

export const AUDIT_REQUEST_STATUS_LABELS: Record<AuditRequestStatus, string> = {
  NOT_READY: 'Needs evidence',
  IN_REVIEW: 'In review',
  READY_FOR_AUDIT: 'Ready for auditor',
  FLAGGED: 'Needs changes',
  ACCEPTED: 'Accepted',
  NOT_APPLICABLE: 'Not applicable',
};

export const AUDIT_REQUEST_STATUS_COLORS: Record<AuditRequestStatus, string> = {
  NOT_READY: 'bg-gray-100 text-gray-700',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  READY_FOR_AUDIT: 'bg-amber-50 text-amber-700',
  FLAGGED: 'bg-red-50 text-red-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  NOT_APPLICABLE: 'bg-slate-100 text-slate-500',
};
