import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  findingsService,
  FindingRecord,
  FindingSeverity,
  FindingStatus,
} from '@/services/api/findings';

// ── Utility helpers ───────────────────────────────────────────────────────────

export function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isOverdue(finding: FindingRecord) {
  if (!finding.dueAt || finding.status === 'CLOSED') return false;
  return new Date(finding.dueAt) < new Date();
}

// ── Display metadata ──────────────────────────────────────────────────────────

export const SEVERITY_META: Record<FindingSeverity, { label: string; color: string }> =
  {
    CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
    HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
    MEDIUM: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
    LOW: { label: 'Low', color: 'bg-blue-100 text-blue-700' },
  };

export const STATUS_META: Record<FindingStatus, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-red-50 text-red-700' },
  IN_REMEDIATION: {
    label: 'In Remediation',
    color: 'bg-amber-50 text-amber-700',
  },
  READY_FOR_REVIEW: {
    label: 'Ready for Review',
    color: 'bg-blue-50 text-blue-700',
  },
  CLOSED: { label: 'Closed', color: 'bg-green-50 text-green-700' },
};

// ── Primary data hook ─────────────────────────────────────────────────────────

export interface FindingsFilters {
  filterSeverity: FindingSeverity | '';
  filterStatus: FindingStatus | '';
  filterSourceType?: 'TEST_RUN' | 'AUDIT' | 'MANUAL' | '';
  search: string;
}

export interface FindingsStats {
  total: number;
  open: number;
  inRemediation: number;
  closed: number;
  overdue: number;
}

export function useFindingsData(filters: FindingsFilters) {
  const {
    data: findings = [],
    isLoading,
    error,
  } = useQuery<FindingRecord[]>({
    queryKey: [
      'findings',
      {
        filterSeverity: filters.filterSeverity,
        filterStatus: filters.filterStatus,
        filterSourceType: filters.filterSourceType,
      },
    ],
    queryFn: () =>
      findingsService.list({
        severity: filters.filterSeverity || undefined,
        status: filters.filterStatus || undefined,
        sourceType: filters.filterSourceType || undefined,
      }),
  });

  const visible = useMemo(
    () =>
      findings.filter((finding) => {
        if (!filters.search) return true;
        const query = filters.search.toLowerCase();
        return [
          finding.title,
          finding.description ?? '',
          finding.control?.isoReference ?? '',
          finding.control?.title ?? '',
          finding.asset?.name ?? '',
        ].some((value) => value.toLowerCase().includes(query));
      }),
    [findings, filters.search],
  );

  const stats: FindingsStats = {
    total: findings.length,
    open: findings.filter((f) => f.status === 'OPEN').length,
    inRemediation: findings.filter((f) => f.status === 'IN_REMEDIATION').length,
    closed: findings.filter((f) => f.status === 'CLOSED').length,
    overdue: findings.filter(isOverdue).length,
  };

  return { findings, visible, stats, isLoading, error };
}

// ── Finding detail mutation hook ──────────────────────────────────────────────

export function useFindingDetailActions(
  finding: FindingRecord,
  onUpdated: (finding: FindingRecord) => void,
) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: FindingStatus) {
    setSaving(true);
    setError(null);
    try {
      const updated = await findingsService.update(finding.id, { status });
      qc.invalidateQueries({ queryKey: ['findings'] });
      onUpdated(updated);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveMetadata(opts: {
    dueAt: string;
    remediationOwner: string;
  }) {
    setSaving(true);
    setError(null);
    try {
      const updated = await findingsService.update(finding.id, {
        dueAt: opts.dueAt ? new Date(opts.dueAt).toISOString() : null,
        remediationOwner: opts.remediationOwner || null,
      });
      qc.invalidateQueries({ queryKey: ['findings'] });
      onUpdated(updated);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addRemediation(note: string) {
    if (!note.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await findingsService.addRemediation(finding.id, note.trim());
      qc.invalidateQueries({ queryKey: ['findings'] });
      onUpdated(updated);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to add remediation note');
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, updateStatus, saveMetadata, addRemediation };
}

// ── Remediation actions polling hook ─────────────────────────────────────────

import {
  remediationService,
  RemediationAction,
} from '@/services/api/remediation';

export function useRemediationActions(findingId: string) {
  const qc = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: actions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['remediation-actions', findingId],
    queryFn: () => remediationService.listActions(findingId),
    refetchInterval: (query) => {
      const transitioning = (query.state.data ?? []).some(
        (a: RemediationAction) => ['PENDING', 'EXECUTING'].includes(a.status),
      );
      return transitioning ? 3000 : false;
    },
  });

  async function doAction(fn: () => Promise<void>) {
    setActionError(null);
    try {
      await fn();
      await refetch();
      qc.invalidateQueries({ queryKey: ['findings'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setActionError(msg);
    }
  }

  return { actions, isLoading, actionError, doAction };
}

// ── AI evidence synthesis hook ────────────────────────────────────────────────

import { aiService, EvidenceSynthesisResult } from '@/services/api/ai';

export function useEvidenceSynthesis(findingId: string) {
  const synthesizeMutation = useMutation({
    mutationFn: (summary: string) =>
      aiService.synthesizeEvidence(findingId, summary),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => aiService.acceptSuggestion(id),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => aiService.dismissSuggestion(id),
  });

  return { synthesizeMutation, acceptMutation, dismissMutation };
}

export type { EvidenceSynthesisResult };
