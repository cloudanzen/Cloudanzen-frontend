/**
 * audit-request-lifecycle.ts — Mirrors the backend allowed-transitions table
 * (see backend `src/modules/audits/audit-request-lifecycle.ts`).
 *
 * The state-machine-aware status select consumes `allowedNextStatuses`.
 * Backend independently enforces the same matrix; the frontend uses it
 * purely for UX (don't show invalid options).
 */

import type { AuditRequestStatus } from './api/audits';

export type ActorGroup =
  | 'internal_auditor'
  | 'external_auditor'
  | 'assigned_contributor'
  | 'none';

const TRANSITIONS: Record<
  AuditRequestStatus,
  Partial<Record<ActorGroup, AuditRequestStatus[]>>
> = {
  NOT_READY: {
    internal_auditor: ['IN_REVIEW', 'NOT_APPLICABLE'],
    assigned_contributor: ['IN_REVIEW'],
    external_auditor: ['NOT_APPLICABLE'],
  },
  IN_REVIEW: {
    internal_auditor: ['READY_FOR_AUDIT', 'NOT_APPLICABLE'],
    assigned_contributor: ['READY_FOR_AUDIT'],
    external_auditor: ['NOT_APPLICABLE'],
  },
  READY_FOR_AUDIT: {
    internal_auditor: ['ACCEPTED', 'FLAGGED', 'NOT_APPLICABLE'],
    external_auditor: ['ACCEPTED', 'FLAGGED', 'NOT_APPLICABLE'],
  },
  FLAGGED: {
    internal_auditor: ['IN_REVIEW', 'NOT_APPLICABLE'],
    assigned_contributor: ['IN_REVIEW'],
    external_auditor: ['NOT_APPLICABLE'],
  },
  ACCEPTED: {},
  NOT_APPLICABLE: {
    internal_auditor: ['NOT_READY'],
  },
};

export interface ResolveActorInput {
  isInternalAuditorOrAdmin: boolean;
  isExternalAuditor: boolean;
  isAssignedContributor: boolean;
}

export function resolveActorGroup(input: ResolveActorInput): ActorGroup {
  if (input.isInternalAuditorOrAdmin) return 'internal_auditor';
  if (input.isExternalAuditor) return 'external_auditor';
  if (input.isAssignedContributor) return 'assigned_contributor';
  return 'none';
}

export function allowedNextStatuses(
  current: AuditRequestStatus,
  group: ActorGroup,
): AuditRequestStatus[] {
  if (group === 'none') return [current];
  const allowed = TRANSITIONS[current]?.[group] ?? [];
  return [current, ...allowed];
}
