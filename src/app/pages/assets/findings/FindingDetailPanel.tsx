/**
 * findings/FindingDetailPanel.tsx — split out of the original 1,487-line FindingsPage.tsx
 * in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { FindingRecord } from '@/services/api/findings';
import { useCanAudit, useCurrentUser } from '@/hooks/useCurrentUser';
import {
  fmt,
  isOverdue,
  useFindingDetailActions,
} from '@/app/pages/compliance/useFindingsData';
import { SeverityBadge, StatusBadge } from './shared';
import { RemediationPanel } from './RemediationPanel';
import { EvidenceSynthesisPanel } from './EvidenceSynthesisPanel';

export function FindingDetailPanel({
  finding,
  onClose,
  onUpdated,
}: {
  finding: FindingRecord;
  onClose: () => void;
  onUpdated: (finding: FindingRecord) => void;
}) {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const canAudit = useCanAudit();
  const [dueAt, setDueAt] = useState(
    finding.dueAt ? finding.dueAt.slice(0, 10) : '',
  );
  const [remediationOwner, setRemediationOwner] = useState(
    finding.remediationOwner ?? '',
  );
  const [note, setNote] = useState('');

  const canEdit = canAudit;

  const {
    saving,
    error,
    updateStatus,
    saveMetadata: saveMetadataFn,
    addRemediation: addRemediationFn,
  } = useFindingDetailActions(finding, onUpdated);

  async function saveMetadata() {
    await saveMetadataFn({ dueAt, remediationOwner });
  }

  async function addRemediation() {
    await addRemediationFn(note);
    setNote('');
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
              {isOverdue(finding) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {finding.title}
            </h2>
            <p className="text-xs font-medium text-gray-500">
              {finding.control?.isoReference ?? '—'} -{' '}
              {finding.control?.title ?? 'Unmapped control'}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </p>
            <p className="text-sm text-gray-700">
              {finding.description ?? 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Asset</p>
              <p className="font-medium">{finding.asset?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Risk</p>
              <p className="font-medium">{finding.risk?.title ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Related policy</p>
              {finding.policy ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/compliance/policies/${finding.policy!.id}`)
                  }
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {finding.policy.name}
                </button>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="font-medium">{fmt(finding.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Due date</p>
              <p
                className={`font-medium ${isOverdue(finding) ? 'text-red-600' : ''}`}
              >
                {fmt(finding.dueAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Owner</p>
              <p className="font-medium">{finding.remediationOwner ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Age</p>
              <p className="font-medium">{finding.ageInDays ?? 0} days</p>
            </div>
          </div>

          {finding.testRun && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Latest triggering run
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Executed</p>
                  <p className="font-medium">
                    {fmt(finding.testRun.executedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="font-medium">
                    {finding.testRun.executionSource ?? '—'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-700">
                {finding.testRun.summary}
              </p>
            </div>
          )}

          {/* AI-2: Evidence synthesis — suggest control mappings from finding context */}
          <EvidenceSynthesisPanel findingId={finding.id} />

          {canEdit && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Workflow metadata
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block text-xs text-gray-500">
                    Remediation owner
                  </span>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={remediationOwner}
                    onChange={(event) =>
                      setRemediationOwner(event.target.value)
                    }
                    placeholder="User id or email"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block text-xs text-gray-500">
                    Due date
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={dueAt}
                    onChange={(event) => setDueAt(event.target.value)}
                  />
                </label>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={saveMetadata}
                disabled={saving}
              >
                Save Metadata
              </Button>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Remediation Log
            </p>
            <div className="space-y-2">
              {(finding.remediations ?? []).length === 0 && (
                <p className="text-sm text-gray-400">
                  No remediation updates yet.
                </p>
              )}
              {(finding.remediations ?? []).map((entry) => (
                <div key={entry.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">{entry.note}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {fmt(entry.createdAt)} · {entry.createdBy ?? 'system'}
                  </p>
                </div>
              ))}
            </div>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a remediation update..."
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addRemediation}
              disabled={saving || !note.trim()}
            >
              Add Remediation Note
            </Button>
          </div>

          {/* RE-1/RE-2: Automated Remediation Panel */}
          <RemediationPanel finding={finding} canApprove={canEdit} />

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Actions
            </p>
            {finding.status === 'OPEN' && canEdit && (
              <Button
                className="w-full"
                onClick={() => updateStatus('IN_REMEDIATION')}
                disabled={saving}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Start Remediation
              </Button>
            )}
            {finding.status === 'IN_REMEDIATION' && canEdit && (
              <Button
                className="w-full"
                onClick={() => updateStatus('READY_FOR_REVIEW')}
                disabled={saving}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Submit for Review
              </Button>
            )}
            {finding.status === 'READY_FOR_REVIEW' && canEdit && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateStatus('CLOSED')}
                  disabled={saving}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => updateStatus('OPEN')}
                  disabled={saving}
                >
                  Reopen
                </Button>
              </div>
            )}
          </div>

          {finding.slaBreached && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              This finding has breached its remediation SLA.
            </div>
          )}

          {currentUser && finding.remediationOwner === currentUser.email && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              You are the current remediation owner for this finding.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
