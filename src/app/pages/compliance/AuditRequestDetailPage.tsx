import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  AUDIT_REQUEST_EVIDENCE_TYPES,
  auditsService,
  type AuditRequestEvidenceType,
  type AuditRequestRecord,
  type AuditRequestStatus,
} from '@/services/api/audits';
import {
  useCanAudit,
  useIsExternalAuditor,
  useIsInternalAuditorOrAdmin,
  useCurrentUser,
} from '@/hooks/useCurrentUser';
import {
  allowedNextStatuses,
  resolveActorGroup,
} from '@/services/audit-request-lifecycle';
import { REQUEST_STATUS_COLORS, RequestStatusBadge } from './AuditDetailPage';
import { AuditRequestAttachModal } from './AuditRequestAttachModal';
import { AuditRequestComments } from './AuditRequestComments';
import { ArrowLeft, Download, ExternalLink, Trash2, X } from 'lucide-react';

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

export function AuditRequestDetailPage() {
  const { t } = useTranslation('compliance');
  const { auditId, requestId } = useParams<{
    auditId: string;
    requestId: string;
  }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const canAudit = useCanAudit();
  const isExternalAuditor = useIsExternalAuditor();
  const isInternalAuditorOrAdmin = useIsInternalAuditorOrAdmin();

  const [attachOpen, setAttachOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const requestQuery = useQuery<{ success: boolean; data: AuditRequestRecord }>(
    {
      queryKey: ['audit-request', auditId, requestId],
      queryFn: () => auditsService.getRequest(auditId!, requestId!),
      enabled: Boolean(auditId && requestId),
    },
  );

  const request = requestQuery.data?.data;

  // Permissions on this page (mirror backend matrix).
  const isAssignedContributor = Boolean(
    request &&
    currentUser &&
    currentUser.role === 'CONTRIBUTOR' &&
    request.assignedTo === currentUser.id,
  );
  const actorGroup = resolveActorGroup({
    isInternalAuditorOrAdmin,
    isExternalAuditor,
    isAssignedContributor,
  });

  const canEditMetadata = isInternalAuditorOrAdmin;
  const canDelete = isInternalAuditorOrAdmin;
  const canAttach = canAudit || isAssignedContributor; // includes external auditor + internal auditor + admin
  const canChangeStatus = actorGroup !== 'none';

  const updateMut = useMutation({
    mutationFn: (payload: Parameters<typeof auditsService.updateRequest>[2]) =>
      auditsService.updateRequest(auditId!, requestId!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['audit-request', auditId, requestId],
      });
      void qc.invalidateQueries({ queryKey: ['audit-requests', auditId] });
      void qc.invalidateQueries({
        queryKey: ['audit-evidence-summary', auditId],
      });
      toast.success(t('auditRequestDetail.toasts.updated'));
    },
    onError: (err) => {
      toast.error(
        (err as Error)?.message ?? t('auditRequestDetail.toasts.updateFailed'),
      );
    },
  });

  const linkMut = useMutation({
    mutationFn: (vars: { evidenceId: string; action: 'link' | 'unlink' }) =>
      auditsService.linkRequestEvidence(auditId!, requestId!, vars),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['audit-request', auditId, requestId],
      });
      void qc.invalidateQueries({
        queryKey: ['linkable-evidence', auditId, requestId],
      });
      toast.success(t('auditRequestDetail.toasts.attachUpdated'));
    },
    onError: (err) => {
      toast.error(
        (err as Error)?.message ?? t('auditRequestDetail.toasts.attachFailed'),
      );
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => auditsService.deleteRequest(auditId!, requestId!),
    onSuccess: () => {
      toast.success(t('auditRequestDetail.toasts.deleted'));
      void qc.invalidateQueries({ queryKey: ['audit-requests', auditId] });
      navigate(`/compliance/audits/${auditId}?tab=requests`);
    },
    onError: (err) => {
      toast.error(
        (err as Error)?.message ?? t('auditRequestDetail.toasts.deleteFailed'),
      );
    },
  });

  const nextStatuses = useMemo<AuditRequestStatus[]>(
    () => (request ? allowedNextStatuses(request.status, actorGroup) : []),
    [request, actorGroup],
  );

  // Clear editing mode when permissions change (e.g. role flip via re-auth).
  useEffect(() => {
    if (!canEditMetadata) setEditing(false);
  }, [canEditMetadata]);

  if (!auditId || !requestId) return null;

  if (requestQuery.isLoading) {
    return (
      <PageTemplate title={t('auditRequestDetail.title.loading')}>
        <Card className="p-6 text-sm text-muted-foreground">
          {t('auditRequestDetail.loading')}
        </Card>
      </PageTemplate>
    );
  }

  if (requestQuery.isError || !request) {
    return (
      <PageTemplate title={t('auditRequestDetail.title.notFound')}>
        <Card className="p-6 text-sm text-muted-foreground">
          {t('auditRequestDetail.notFound')}
          <div className="mt-3">
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/compliance/audits/${auditId}?tab=requests`)
              }
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('auditRequestDetail.backToAudit')}
            </Button>
          </div>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title={request.title}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Link
              to={`/compliance/audits/${auditId}?tab=requests`}
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              {t('auditRequestDetail.backToAudit')}
            </Link>
            <h1 className="text-xl font-bold text-foreground">
              {request.title}
            </h1>
            <div className="flex items-center gap-2">
              <RequestStatusBadge status={request.status} />
              {request.evidenceTypeRequested && (
                <Badge variant="outline">
                  {request.evidenceTypeRequested.replaceAll('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canChangeStatus && nextStatuses.length > 1 && (
              <select
                value={request.status}
                disabled={updateMut.isPending}
                onChange={(event) =>
                  updateMut.mutate({
                    status: event.target.value as AuditRequestStatus,
                  })
                }
                className={`rounded-md border border-border px-2 py-1 text-xs font-medium ${REQUEST_STATUS_COLORS[request.status]}`}
                aria-label={t('auditRequestDetail.changeStatus')}
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            )}
            {canEditMetadata && (
              <Button
                variant="outline"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing
                  ? t('auditRequestDetail.cancelEdit')
                  : t('auditRequestDetail.edit')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm(t('auditRequestDetail.confirmDelete'))) {
                    deleteMut.mutate();
                  }
                }}
                disabled={deleteMut.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {t('auditRequestDetail.delete')}
              </Button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="grid gap-3 md:grid-cols-4">
          <MetaCard
            label={t('auditRequestDetail.meta.control')}
            value={
              request.controlId
                ? request.controlId
                : t('auditRequestDetail.meta.auditLevel')
            }
          />
          <MetaCard
            label={t('auditRequestDetail.meta.assignee')}
            value={
              request.assignee?.name ??
              request.assignee?.email ??
              t('auditRequestDetail.meta.unassigned')
            }
          />
          <MetaCard
            label={t('auditRequestDetail.meta.dueDate')}
            value={fmtDate(request.dueDate)}
          />
          <MetaCard
            label={t('auditRequestDetail.meta.createdBy')}
            value={
              request.createdByUser?.name ?? request.createdByUser?.email ?? '—'
            }
          />
        </div>

        {/* Auditor's ask */}
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            {t('auditRequestDetail.ask.title')}
          </h2>
          {request.description ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {request.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('auditRequestDetail.ask.noDescription')}
            </p>
          )}
          {request.evidenceTypeRequested && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('auditRequestDetail.ask.typeRequested')}:{' '}
              <span className="font-medium text-foreground">
                {request.evidenceTypeRequested.replaceAll('_', ' ')}
              </span>
            </p>
          )}
        </Card>

        {/* Edit panel */}
        {editing && canEditMetadata && (
          <EditRequestForm
            request={request}
            onCancel={() => setEditing(false)}
            onSubmit={(payload) => {
              updateMut.mutate(payload, {
                onSuccess: () => setEditing(false),
              });
            }}
            submitting={updateMut.isPending}
          />
        )}

        {/* Linked evidence */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t('auditRequestDetail.linkedEvidence.title')}
            </h2>
            {canAttach && (
              <Button onClick={() => setAttachOpen(true)}>
                {t('auditRequestDetail.linkedEvidence.attach')}
              </Button>
            )}
          </div>
          <div className="divide-y divide-border">
            {!request.evidenceLinks || request.evidenceLinks.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {t('auditRequestDetail.linkedEvidence.empty')}
              </p>
            ) : (
              request.evidenceLinks.map((link) => (
                <div
                  key={link.evidenceId}
                  className="flex items-start justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {link.evidence.fileName ?? link.evidence.type}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('auditRequestDetail.linkedEvidence.linkedAt', {
                        when: fmtDate(link.linkedAt),
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.evidence.fileUrl && (
                      <a
                        href={link.evidence.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {link.evidence.fileUrl.startsWith('/files/') ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </a>
                    )}
                    {canAttach && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          linkMut.mutate({
                            evidenceId: link.evidenceId,
                            action: 'unlink',
                          })
                        }
                        disabled={linkMut.isPending}
                        aria-label={t(
                          'auditRequestDetail.linkedEvidence.unlink',
                        )}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Comments */}
        <AuditRequestComments auditId={auditId} requestId={requestId} />
      </div>

      {attachOpen && (
        <AuditRequestAttachModal
          auditId={auditId}
          requestId={requestId}
          request={request}
          isExternalScope={!isInternalAuditorOrAdmin}
          onClose={() => setAttachOpen(false)}
          onAttached={() => {
            void qc.invalidateQueries({
              queryKey: ['audit-request', auditId, requestId],
            });
            void qc.invalidateQueries({
              queryKey: ['linkable-evidence', auditId, requestId],
            });
            setAttachOpen(false);
          }}
        />
      )}
    </PageTemplate>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </p>
    </Card>
  );
}

function EditRequestForm({
  request,
  onCancel,
  onSubmit,
  submitting,
}: {
  request: AuditRequestRecord;
  onCancel: () => void;
  onSubmit: (
    payload: Parameters<typeof auditsService.updateRequest>[2],
  ) => void;
  submitting: boolean;
}) {
  const { t } = useTranslation('compliance');
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description ?? '');
  const [evidenceType, setEvidenceType] = useState<
    AuditRequestEvidenceType | ''
  >(request.evidenceTypeRequested ?? '');
  const [dueDate, setDueDate] = useState(
    request.dueDate ? request.dueDate.slice(0, 10) : '',
  );

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">
        {t('auditRequestDetail.edit.title')}
      </h2>
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">
          {t('auditRequestDetail.edit.fieldTitle')}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">
          {t('auditRequestDetail.edit.fieldDescription')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          maxLength={4000}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('auditRequestDetail.edit.fieldEvidenceType')}
          </label>
          <select
            value={evidenceType}
            onChange={(e) =>
              setEvidenceType(e.target.value as AuditRequestEvidenceType | '')
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">
              {t('auditRequestDetail.edit.evidenceTypeNone')}
            </option>
            {AUDIT_REQUEST_EVIDENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('auditRequestDetail.edit.fieldDueDate')}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          {t('auditRequestDetail.edit.cancel')}
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              title,
              description: description || null,
              evidenceTypeRequested: evidenceType || null,
              dueDate: dueDate || null,
            })
          }
          disabled={submitting || !title.trim()}
        >
          {submitting
            ? t('auditRequestDetail.edit.saving')
            : t('auditRequestDetail.edit.save')}
        </Button>
      </div>
    </Card>
  );
}
