import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Hourglass, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { policiesService } from '@/services/api/policies';
import type { PolicyApprovalRecord } from '@/services/api/types';

/**
 * R2 — Mandatory org-wide re-acceptance.
 *
 * The dialog used to expose three modes (`publish_only`, `all`, `specific`).
 * They are gone — every published version produces a fresh PolicyAcceptance
 * row for every non-exempt user. The dialog now collects only a changelog,
 * and additionally surfaces the current approval-round state so the publisher
 * sees why publish is blocked when there are PENDING or REJECTED approvals.
 */
export function PublishPolicyDialog({
  open,
  policyId,
  nextVersion,
  onClose,
  onSubmit,
}: {
  open: boolean;
  policyId: string;
  nextVersion: number;
  onClose: () => void;
  onSubmit: (data: { changelog?: string }) => Promise<void>;
}) {
  const [changelog, setChangelog] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: approvalsRes } = useQuery({
    queryKey: ['policy-publish-gate', policyId],
    queryFn: () => policiesService.getApprovals(policyId),
    enabled: open,
  });

  // Reset changelog whenever the dialog re-opens
  useEffect(() => {
    if (open) setChangelog('');
  }, [open]);

  const approvals: PolicyApprovalRecord[] = approvalsRes?.data ?? [];
  const latestRound = approvals.reduce<number>((acc, a) => Math.max(acc, a.approvalRound), 0);
  const latestRoundApprovals = approvals.filter((a) => a.approvalRound === latestRound);
  const rejected = latestRoundApprovals.filter((a) => a.status === 'REJECTED');
  const pending = latestRoundApprovals.filter((a) => a.status === 'PENDING');
  const approved = latestRoundApprovals.filter((a) => a.status === 'APPROVED');

  const blocked = rejected.length > 0 || pending.length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ changelog: changelog.trim() || undefined });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Policy v{nextVersion}</DialogTitle>
          <DialogDescription>
            Every non-exempt user will receive a task to review and accept this version. Auditors are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {rejected.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Approval blocked</p>
                <p>
                  Rejected by{' '}
                  {rejected
                    .slice(0, 3)
                    .map((a) => a.approver?.name ?? a.approver?.email ?? 'an approver')
                    .join(', ')}
                  {rejected.length > 3 ? `, +${rejected.length - 3} more` : ''}. Request a new approval round before publishing.
                </p>
              </div>
            </div>
          )}

          {rejected.length === 0 && pending.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <Hourglass className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  Awaiting {pending.length} approver{pending.length === 1 ? '' : 's'}
                </p>
                <p>
                  {approved.length} of {latestRoundApprovals.length} approved. Publish unlocks once every approver in the latest round approves.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Changelog</label>
            <textarea
              value={changelog}
              onChange={(event) => setChangelog(event.target.value)}
              placeholder="Describe what changed in this version…"
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || blocked}
            title={blocked ? 'Approval blocked or pending — see message above' : undefined}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish v{nextVersion}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
