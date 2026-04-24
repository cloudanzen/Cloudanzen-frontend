import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Download, Edit3, FileText, Loader2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { QK } from '@/lib/queryKeys';
import { policiesService } from '@/services/api/policies';
import { usersService } from '@/services/api/users';
import { PolicyEditor } from '@/app/components/compliance/PolicyEditor';
import { PolicyPreviewSheet } from '@/app/components/compliance/PolicyPreviewSheet';
import { PublishPolicyDialog } from '@/app/components/compliance/PublishPolicyDialog';
import { RenewPolicyDialog } from '@/app/components/compliance/RenewPolicyDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-green-50 text-green-700 border-green-200',
  DRAFT: 'bg-gray-50 text-gray-700 border-gray-200',
  REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  ARCHIVED: 'bg-red-50 text-red-700 border-red-200',
};

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [selectedApproverIds, setSelectedApproverIds] = useState<string[]>([]);
  const [recurrenceMonths, setRecurrenceMonths] = useState('');
  const me = useCurrentUser();

  const { data: policyRes, isLoading } = useQuery({
    queryKey: QK.policyDetail(id ?? ''),
    queryFn: () => policiesService.getPolicy(id!),
    enabled: !!id,
  });

  const { data: versionsRes } = useQuery({
    queryKey: QK.policyVersions(id ?? ''),
    queryFn: () => policiesService.getVersions(id!),
    enabled: !!id,
  });

  const { data: approvalsRes } = useQuery({
    queryKey: QK.policyApprovals(id ?? ''),
    queryFn: () => policiesService.getApprovals(id!),
    enabled: !!id,
  });

  const { data: acceptancesRes } = useQuery({
    queryKey: QK.policyAcceptances(id ?? ''),
    queryFn: () => policiesService.getAcceptances(id!),
    enabled: !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: () => usersService.listUsers(),
    enabled: !!id,
  });

  const policy = policyRes?.data;
  const versions = versionsRes?.data ?? [];
  const approvals = approvalsRes?.data ?? [];
  const acceptances = acceptancesRes?.data ?? [];

  const currentVersionNumber = policy?.versionNumber ?? 1;
  const linkedControls = useMemo(
    () => (policy?.controlMappings ?? []).map((mapping) => mapping.control).filter(Boolean),
    [policy?.controlMappings],
  );

  const invalidatePolicy = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: QK.policyDetail(id ?? '') }),
      qc.invalidateQueries({ queryKey: QK.policyVersions(id ?? '') }),
      qc.invalidateQueries({ queryKey: QK.policyApprovals(id ?? '') }),
      qc.invalidateQueries({ queryKey: QK.policyAcceptances(id ?? '') }),
      qc.invalidateQueries({ queryKey: ['policies'] }),
      qc.invalidateQueries({ queryKey: QK.myPolicyAcceptances() }),
    ]);
  };

  const requestApprovalMutation = useMutation({
    mutationFn: (approverIds: string[]) => policiesService.requestApproval(id!, approverIds),
    onSuccess: async () => {
      toast.success('Approval requested');
      setSelectedApproverIds([]);
      await invalidatePolicy();
    },
    onError: () => toast.error('Failed to request approval'),
  });

  const respondApprovalMutation = useMutation({
    mutationFn: ({ approvalId, status }: { approvalId: string; status: 'APPROVED' | 'REJECTED' }) =>
      policiesService.respondToApproval(id!, approvalId, { status }),
    onSuccess: async (_, variables) => {
      toast.success(variables.status === 'APPROVED' ? 'Approval recorded' : 'Rejection recorded');
      await invalidatePolicy();
    },
    onError: () => toast.error('Failed to update approval'),
  });

  const recurrenceMutation = useMutation({
    mutationFn: (months: number) => policiesService.setRecurrence(id!, { recurrenceMonths: months }),
    onSuccess: async () => {
      toast.success('Review cadence updated');
      await invalidatePolicy();
    },
    onError: () => toast.error('Failed to update review cadence'),
  });

  if (!id) return null;

  if (isLoading || !policy) {
    return (
      <PageTemplate title="Policy detail" description="">
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageTemplate>
    );
  }

  return (
    <>
      <PolicyEditor
        open={editOpen}
        policy={policy}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          await invalidatePolicy();
          setEditOpen(false);
        }}
      />

      {previewOpen && policy.documentUrl ? (
        <PolicyPreviewSheet
          policyId={policy.id}
          policyName={policy.name}
          documentUrl={policy.documentUrl}
          onClose={() => setPreviewOpen(false)}
          onDownload={() => {
            setPreviewOpen(false);
            void policiesService.downloadPolicyDocument(policy.id, `${policy.name}.pdf`);
          }}
        />
      ) : null}

      <PublishPolicyDialog
        open={publishOpen}
        nextVersion={policy.status === 'PUBLISHED' ? currentVersionNumber + 1 : currentVersionNumber}
        onClose={() => setPublishOpen(false)}
        onSubmit={async (data) => {
          const resp = await policiesService.updatePolicy(policy.id, { status: 'PUBLISHED', ...data });
          toast.success('Policy published');

          // [T-91] Surface role-exempt users who were dropped from `acceptanceUserIds`
          // (e.g. Auditors). The backend enforces the exemption even when an admin explicitly
          // selects them — the toast tells the admin *why* certain users didn't receive a task.
          const skipped = resp.skippedUsers ?? [];
          if (skipped.length > 0) {
            const names = skipped
              .slice(0, 3)
              .map((u) => u.name ?? u.role)
              .join(', ');
            const suffix = skipped.length > 3 ? `, +${skipped.length - 3} more` : '';
            toast.info(
              `${skipped.length} user${skipped.length > 1 ? 's' : ''} excluded (role exempt): ${names}${suffix}`,
              {
                description: 'Adjust the per-role onboarding matrix in Settings → Access → Roles if this is unexpected.',
                duration: 8000,
              },
            );
          }

          await invalidatePolicy();
        }}
      />

      <RenewPolicyDialog
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        onSubmit={async (mode) => {
          await policiesService.renewPolicy(policy.id, mode);
          toast.success('Policy renewed');
          await invalidatePolicy();
        }}
      />

      <PageTemplate
        title={policy.name}
        description={policy.description ?? 'Policy lifecycle, approvals, versions, and acceptance tracking'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/compliance/policies')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              disabled={policy.status === 'PUBLISHED'}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Publish
            </button>
            <button
              type="button"
              onClick={() => setRenewOpen(true)}
              disabled={policy.status !== 'PUBLISHED'}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Renew
            </button>
            <button
              type="button"
              onClick={() => void policiesService.downloadPolicyDocument(policy.id, `${policy.name}.pdf`)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[policy.status] ?? STATUS_STYLES.DRAFT}`}>
              {policy.status}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-mono font-semibold text-gray-700">
              v{currentVersionNumber}
            </span>
            {policy.renewalDate ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Renewal due {new Date(policy.renewalDate).toLocaleDateString()}
              </span>
            ) : null}
            <span className="text-sm text-muted-foreground">
              Owner: {policy.owner?.name || policy.owner?.email || 'Unassigned'}
            </span>
          </div>

          <Tabs defaultValue="policy" className="space-y-4">
            <TabsList>
              <TabsTrigger value="policy">Policy</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
            </TabsList>

            <TabsContent value="policy" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">Document</h2>
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Preview
                    </button>
                  </div>
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
                    <FileText className="mx-auto mb-3 h-8 w-8" />
                    Use Preview to view the current document.
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                    <p className="mt-1 text-sm text-foreground">{policy.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="mt-1 text-sm text-foreground">{new Date(policy.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Last updated</p>
                    <p className="mt-1 text-sm text-foreground">{policy.updatedAt ? new Date(policy.updatedAt).toLocaleString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Review cadence</p>
                    <p className="mt-1 text-sm text-foreground">
                      {policy.recurrenceMonths ? `Every ${policy.recurrenceMonths} months` : 'Not set'}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="12"
                        value={recurrenceMonths}
                        onChange={(event) => setRecurrenceMonths(event.target.value)}
                        className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => recurrenceMutation.mutate(Number(recurrenceMonths))}
                        disabled={recurrenceMutation.isPending || Number(recurrenceMonths) <= 0}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {recurrenceMutation.isPending ? 'Saving...' : 'Set cadence'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Review tests</p>
                    <p className="mt-1 text-sm text-foreground">{policy.tests?.length ?? 0} linked tests</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="versions" className="space-y-3">
              {versions.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No versions published yet.</div>
              ) : (
                versions.map((version) => (
                  <div key={version.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Version {version.versionNumber}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Published by {version.publishedBy} on {new Date(version.publishedAt).toLocaleString()}
                        </p>
                        {version.changelog ? (
                          <p className="mt-2 text-sm text-foreground">{version.changelog}</p>
                        ) : null}
                      </div>
                      {version.versionNumber === currentVersionNumber ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Current</span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="controls" className="space-y-3">
              {linkedControls.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No linked controls.</div>
              ) : (
                linkedControls.map((control) => (
                  <div key={control!.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{control!.isoReference || 'Control'} - {control!.title}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{control!.status}</span>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Approval requests</h2>
                  </div>

                  <div className="space-y-3">
                    <select
                      multiple
                      value={selectedApproverIds}
                      onChange={(event) => {
                        const next = Array.from(event.target.selectedOptions).map((option) => option.value);
                        setSelectedApproverIds(next);
                      }}
                      className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => requestApprovalMutation.mutate(selectedApproverIds)}
                      disabled={requestApprovalMutation.isPending || selectedApproverIds.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {requestApprovalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                      Request approval
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {approvals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No approval requests yet.</p>
                    ) : approvals.map((approval) => (
                      <div key={approval.id} className="rounded-xl border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{approval.approver?.name || approval.approver?.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Round {approval.approvalRound} · {approval.status}</p>
                        {approval.comment ? <p className="mt-2 text-sm text-foreground">{approval.comment}</p> : null}
                        {approval.status === 'PENDING' && approval.approverId === me?.id ? (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => respondApprovalMutation.mutate({ approvalId: approval.id, status: 'APPROVED' })}
                              disabled={respondApprovalMutation.isPending}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => respondApprovalMutation.mutate({ approvalId: approval.id, status: 'REJECTED' })}
                              disabled={respondApprovalMutation.isPending}
                              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Acceptance tracking</h2>
                  </div>

                  <div className="space-y-3">
                    {acceptances.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No acceptance requests for the current version.</p>
                    ) : acceptances.map((acceptance) => (
                      <div key={acceptance.id} className="rounded-xl border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{acceptance.user?.name || acceptance.user?.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {acceptance.status}
                          {acceptance.acceptedAt ? ` · ${new Date(acceptance.acceptedAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PageTemplate>
    </>
  );
}
