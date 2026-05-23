import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { toast } from 'sonner';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Link as LinkIcon,
  FlaskConical,
  BookOpen,
  PlusCircle,
  Trash2,
  Sparkles,
  Loader2,
  CheckCheck,
  MessageCircle,
  Send,
  Flag,
  CheckSquare,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  auditsService,
  AuditControlRecord,
  AuditControlStatus,
  AuditEvidenceReview,
  ControlEvidenceItem,
  ControlPolicyItem,
  ControlRiskItem,
  ControlTestItem,
  ControlFindingItem,
  AuditComment,
} from '@/services/api/audits';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ReviewBadge } from './helpers';
import { AddFindingModal } from './AddFindingModal';
import { aiService, AuditorNoteResult } from '@/services/api/ai';
import { CitationViewer } from '@/app/components/CitationViewer';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTranslation } from 'react-i18next';

// ── Auditor Note AI Panel (AI-4) ─────────────────────────────────────────────

function AuditorNoteAiPanel({
  controlId,
  auditId,
  onNoteAccepted,
}: {
  controlId: string;
  auditId: string;
  onNoteAccepted: (noteText: string) => void;
}) {
  const { t } = useTranslation('auditor');
  const [draft, setDraft] = useState<AuditorNoteResult | null>(null);
  const [editedText, setEditedText] = useState('');

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateAuditorNote(controlId, auditId),
    onSuccess: (resp) => {
      setDraft(resp.data);
      setEditedText(resp.data.noteText);
    },
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      aiService.applyAuditorNote(
        draft!.generationId,
        auditId,
        controlId,
        editedText,
      ),
    onSuccess: () => {
      onNoteAccepted(editedText);
      setDraft(null);
    },
  });

  if (!draft) {
    return (
      <button
        type="button"
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50"
      >
        {generateMutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {generateMutation.isPending
          ? t('controlReview.generating')
          : t('controlReview.generateAiNote')}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
        <span className="text-xs font-semibold text-violet-800">
          {t('controlReview.aiGeneratedNote')}
        </span>
        <span className="ml-auto text-xs text-violet-500">
          {t('controlReview.reviewBeforeApplying')}
        </span>
      </div>

      <textarea
        rows={4}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
      />

      {draft.citations.length > 0 && (
        <CitationViewer
          citations={draft.citations}
          label="Sources"
          className="text-xs"
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => applyMutation.mutate()}
          disabled={!editedText.trim() || applyMutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {applyMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCheck className="h-3.5 w-3.5" />
          )}
          Apply note
        </button>
        <button
          type="button"
          onClick={() => setDraft(null)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

// ── Section Head helper ───────────────────────────────────────────────────────

export function SectionHead({
  icon,
  title,
  noMargin,
}: {
  icon: React.ReactNode;
  title: string;
  noMargin?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${noMargin ? '' : 'mb-3'}`}
    >
      <span className="text-gray-400">{icon}</span>
      {title}
    </div>
  );
}

// ── Finding Row ───────────────────────────────────────────────────────────────

interface FindingItem {
  id: string;
  severity: string;
  status: string;
  description?: string;
  remediation?: string;
}

export function FindingRow({
  finding,
  auditId,
  onDeleted,
}: {
  finding: FindingItem;
  auditId: string;
  onDeleted: () => void;
}) {
  const confirm = useConfirmDialog();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Delete Finding',
      description: 'Delete this finding?',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await auditsService.deleteFinding(auditId, finding.id);
      onDeleted();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            finding.severity === 'MAJOR'
              ? 'bg-red-50 text-red-700'
              : finding.severity === 'MINOR'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-blue-50 text-blue-700'
          }`}
        >
          {finding.severity}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            finding.status === 'OPEN'
              ? 'bg-orange-50 text-orange-600'
              : 'bg-green-50 text-green-600'
          }`}
        >
          {finding.status}
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-gray-700">{finding.description}</p>
      {finding.remediation && (
        <p className="text-xs text-gray-500 mt-1 italic">
          Remediation: {finding.remediation}
        </p>
      )}
    </div>
  );
}

// ── Control Comments Section ──────────────────────────────────────────────────

function ControlCommentsSection({
  auditId,
  controlId,
}: {
  auditId: string;
  controlId: string;
}) {
  const me = useCurrentUser();
  const confirm = useConfirmDialog();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const { data, refetch } = useQuery<{
    success: boolean;
    data: AuditComment[];
  }>({
    queryKey: ['audit-comments', auditId, controlId],
    queryFn: () => auditsService.listComments(auditId, { controlId }),
  });

  const comments = data?.data ?? [];

  async function handlePost() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await auditsService.postComment(auditId, {
        text: text.trim(),
        controlId,
      });
      setText('');
      refetch();
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const ok = await confirm({
      title: 'Delete Comment',
      description: 'Delete this comment?',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await auditsService.deleteComment(auditId, commentId);
      refetch();
    } catch {
      toast.error('Failed to delete comment');
    }
  }

  function initials(name: string | null | undefined, email: string): string {
    if (name)
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <div className="p-5">
      <SectionHead
        icon={<MessageCircle className="w-3.5 h-3.5" />}
        title={`Comments (${comments.length})`}
      />
      <div className="space-y-3 mb-3">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-400">
            No comments on this control yet.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initials(c.author?.name, c.author?.email ?? '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-semibold text-gray-800">
                    {c.author?.name ?? c.author?.email}
                  </span>
                  {c.author?.role === 'AUDITOR' && (
                    <span className="text-xs px-1 py-0 rounded bg-violet-50 text-violet-700">
                      Auditor
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  {me?.id === c.authorId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto text-gray-300 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-700">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
        <button
          type="button"
          onClick={handlePost}
          disabled={!text.trim() || posting}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 self-end"
        >
          {posting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Control Review Side Panel ─────────────────────────────────────────────────

export function ControlReviewPanel({
  auditControl,
  auditId,
  onClose,
  onUpdated,
}: {
  auditControl: AuditControlRecord;
  auditId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { t } = useTranslation('auditor');
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notes, setNotes] = useState(auditControl.notes ?? '');
  const [notesDirty, setNotesDirty] = useState(false);

  const ctrl = auditControl.control;
  const evidence: ControlEvidenceItem[] = ctrl.evidence ?? [];
  const auditEvidences: AuditEvidenceReview[] = ctrl.auditEvidences ?? [];
  const policies: ControlPolicyItem[] =
    ctrl.policyMappings?.map((p) => p.policy) ?? [];
  const risks: ControlRiskItem[] = ctrl.riskMappings?.map((r) => r.risk) ?? [];
  const tests: ControlTestItem[] = ctrl.testMappings?.map((r) => r.test) ?? [];
  const findings: ControlFindingItem[] = ctrl.findings ?? [];

  // Derived readiness signals
  const hasFailingTests = tests.some(
    (t) => t.status === 'Overdue' || t.status === 'Needs_remediation',
  );
  const hasFlaggedEvidence = auditEvidences.some(
    (ae) => ae.status === 'FLAGGED',
  );
  const allEvidenceApproved =
    auditEvidences.length > 0 &&
    auditEvidences.every((ae) => ae.status === 'APPROVED');

  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<Record<string, string>>({});
  const [evidencePending, setEvidencePending] = useState<string | null>(null);

  async function handleStatusChange(status: AuditControlStatus) {
    setSavingStatus(true);
    setSaveError(null);
    try {
      await auditsService.updateControl(auditId, auditControl.id, {
        reviewStatus: status,
        notes: notes || undefined,
      });
      onUpdated();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update status',
      );
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveNotes() {
    setSavingStatus(true);
    setSaveError(null);
    try {
      await auditsService.updateControl(auditId, auditControl.id, { notes });
      setNotesDirty(false);
      onUpdated();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleApproveEvidence(auditEvidenceId: string) {
    setEvidencePending(auditEvidenceId);
    try {
      await auditsService.approveEvidence(
        auditId,
        auditControl.id,
        auditEvidenceId,
      );
      onUpdated();
    } catch {
      toast.error('Failed to approve evidence');
    } finally {
      setEvidencePending(null);
    }
  }

  async function handleFlagEvidence(auditEvidenceId: string) {
    const reason = flagReason[auditEvidenceId]?.trim();
    if (!reason) return;
    setEvidencePending(auditEvidenceId);
    try {
      await auditsService.flagEvidence(
        auditId,
        auditControl.id,
        auditEvidenceId,
        reason,
      );
      setFlaggingId(null);
      setFlagReason((prev) => {
        const n = { ...prev };
        delete n[auditEvidenceId];
        return n;
      });
      onUpdated();
    } catch {
      toast.error('Failed to flag evidence');
    } finally {
      setEvidencePending(null);
    }
  }

  async function handleReadyEvidence(auditEvidenceId: string) {
    setEvidencePending(auditEvidenceId);
    try {
      await auditsService.readyEvidence(
        auditId,
        auditControl.id,
        auditEvidenceId,
      );
      onUpdated();
    } catch {
      toast.error('Failed to mark evidence ready');
    } finally {
      setEvidencePending(null);
    }
  }

  const statusOptions: {
    value: AuditControlStatus;
    label: string;
    color: string;
  }[] = [
    { value: 'PENDING', label: 'Pending', color: 'text-gray-600' },
    { value: 'COMPLIANT', label: 'Compliant', color: 'text-green-700' },
    { value: 'NON_COMPLIANT', label: 'Non-Compliant', color: 'text-red-700' },
    {
      value: 'NOT_APPLICABLE',
      label: 'Not Applicable',
      color: 'text-slate-500',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/30" onClick={onClose} />
        <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {ctrl.isoReference}
                </span>
                <ReviewBadge status={auditControl.reviewStatus} />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                {ctrl.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 ml-3 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {/* Description */}
            {ctrl.description && (
              <div className="p-5">
                <SectionHead
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  title="Control Description"
                />
                <p className="text-sm text-gray-600 leading-relaxed">
                  {ctrl.description}
                </p>
              </div>
            )}

            {/* Review Status selector */}
            <div className="p-5">
              <SectionHead
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                title="Review Status"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    disabled={savingStatus}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`flex items-center justify-center gap-1.5 border rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                      auditControl.reviewStatus === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {auditControl.reviewStatus === opt.value && (
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="p-5">
              <SectionHead
                icon={<FileText className="w-3.5 h-3.5" />}
                title="Auditor Notes"
              />
              <textarea
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add notes about this control review..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesDirty(true);
                }}
              />
              {saveError && (
                <p className="mt-1 text-xs text-red-600">{saveError}</p>
              )}
              {notesDirty && (
                <div className="flex justify-end mt-1.5">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingStatus}
                  >
                    {savingStatus ? 'Saving…' : 'Save Notes'}
                  </Button>
                </div>
              )}
              {/* AI-4: Auditor note generator — surfaces below the manual textarea */}
              <AuditorNoteAiPanel
                controlId={ctrl.id}
                auditId={auditId}
                onNoteAccepted={(text) => {
                  setNotes(text);
                  setNotesDirty(true);
                }}
              />
            </div>

            {/* Readiness Banner */}
            {(hasFlaggedEvidence || hasFailingTests || allEvidenceApproved) && (
              <div
                className={`mx-5 mt-3 rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${
                  hasFlaggedEvidence || hasFailingTests
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}
              >
                {hasFlaggedEvidence || hasFailingTests ? (
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span>
                  {hasFlaggedEvidence &&
                    'Some evidence has been flagged and needs attention. '}
                  {hasFailingTests &&
                    'Failing validations — this control is not ready for audit. '}
                  {!hasFlaggedEvidence &&
                    !hasFailingTests &&
                    allEvidenceApproved &&
                    'All evidence approved. Control ready for audit.'}
                </span>
              </div>
            )}

            {/* Related Evidence */}
            <div className="p-5">
              <SectionHead
                icon={<LinkIcon className="w-3.5 h-3.5" />}
                title={`Evidence (${evidence.length})`}
              />
              {evidence.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No evidence linked to this control.
                </p>
              ) : (
                <div className="space-y-2">
                  {evidence.map((ev: ControlEvidenceItem) => {
                    const review = auditEvidences.find(
                      (ae) => ae.evidenceId === ev.id,
                    );
                    const isBusy = evidencePending === review?.id;
                    const isExpanding = flaggingId === review?.id;
                    return (
                      <div
                        key={ev.id}
                        className="border border-gray-100 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-2 text-xs px-3 py-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-700">
                            {ev.type}
                          </span>
                          {ev.fileName && (
                            <span className="text-gray-500 truncate flex-1">
                              {ev.fileName}
                            </span>
                          )}
                          {ev.automated && (
                            <Badge variant="outline" className="text-xs">
                              Automated
                            </Badge>
                          )}
                          {/* Status badge */}
                          {review && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                review.status === 'APPROVED'
                                  ? 'bg-green-50 text-green-700'
                                  : review.status === 'FLAGGED'
                                    ? 'bg-amber-50 text-amber-700'
                                    : review.status === 'READY'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {review.status === 'APPROVED'
                                ? 'Approved'
                                : review.status === 'FLAGGED'
                                  ? 'Flagged'
                                  : review.status === 'READY'
                                    ? 'Ready'
                                    : 'Pending'}
                            </span>
                          )}
                          {/* Actions */}
                          {review && !ev.automated && (
                            <div className="flex items-center gap-1 ml-auto">
                              {review.status !== 'APPROVED' && (
                                <button
                                  onClick={() =>
                                    handleApproveEvidence(review.id)
                                  }
                                  disabled={isBusy}
                                  title="Approve"
                                  className="text-gray-300 hover:text-green-600 disabled:opacity-40"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckSquare className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              {review.status !== 'FLAGGED' && (
                                <button
                                  onClick={() =>
                                    setFlaggingId(
                                      isExpanding ? null : review.id,
                                    )
                                  }
                                  disabled={isBusy}
                                  title="Flag"
                                  className="text-gray-300 hover:text-amber-600 disabled:opacity-40"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {review.status === 'FLAGGED' && (
                                <button
                                  onClick={() => handleReadyEvidence(review.id)}
                                  disabled={isBusy}
                                  title="Mark Ready"
                                  className="text-gray-300 hover:text-blue-600 disabled:opacity-40"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              {review.status === 'APPROVED' && (
                                <button
                                  onClick={() =>
                                    setFlaggingId(
                                      isExpanding ? null : review.id,
                                    )
                                  }
                                  disabled={isBusy}
                                  title="Flag"
                                  className="text-gray-300 hover:text-amber-600 disabled:opacity-40"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                          {/* Automated evidence: only approve */}
                          {review &&
                            ev.automated &&
                            review.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleApproveEvidence(review.id)}
                                disabled={isBusy}
                                title="Approve"
                                className="ml-auto text-gray-300 hover:text-green-600 disabled:opacity-40"
                              >
                                {isBusy ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckSquare className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                        </div>
                        {/* Flag reason display */}
                        {review?.status === 'FLAGGED' && review.flagReason && (
                          <div className="px-3 pb-2 text-xs text-amber-700 bg-amber-50/50">
                            <span className="font-medium">Flag reason:</span>{' '}
                            {review.flagReason}
                          </div>
                        )}
                        {/* Inline flag form */}
                        {isExpanding && review && (
                          <div className="px-3 pb-3 pt-1 space-y-1.5">
                            <textarea
                              rows={2}
                              placeholder="Reason for flagging…"
                              value={flagReason[review.id] ?? ''}
                              onChange={(e) =>
                                setFlagReason((prev) => ({
                                  ...prev,
                                  [review.id]: e.target.value,
                                }))
                              }
                              className="w-full text-xs border border-amber-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none bg-amber-50/30"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFlagEvidence(review.id)}
                                disabled={
                                  !flagReason[review.id]?.trim() || isBusy
                                }
                                className="text-xs bg-amber-600 text-white px-2.5 py-1 rounded hover:bg-amber-700 disabled:opacity-40"
                              >
                                {isBusy ? 'Flagging…' : 'Submit Flag'}
                              </button>
                              <button
                                onClick={() => setFlaggingId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Related Policies — entire row is a link when documentUrl
                is present so auditors can open the policy document without
                hunting for a small icon. Non-clickable muted row otherwise. */}
            {policies.length > 0 && (
              <div className="p-5">
                <SectionHead
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  title={`Policies (${policies.length})`}
                />
                <div className="space-y-1.5">
                  {policies.map((p: ControlPolicyItem) => {
                    const statusBadge = (
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          p.approvedAt
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.approvedAt ? 'Approved' : p.status || 'Draft'}
                      </span>
                    );
                    if (p.documentUrl) {
                      return (
                        <a
                          key={p.id}
                          href={p.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-700 flex-1 truncate">
                            {p.name}
                          </span>
                          {statusBadge}
                          <span className="inline-flex items-center gap-1 text-blue-600 flex-shrink-0">
                            <span className="hidden sm:inline">
                              {t('controlReview.openPolicyDocument')}
                            </span>
                            <LinkIcon className="w-3.5 h-3.5" />
                          </span>
                        </a>
                      );
                    }
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2 bg-gray-50"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-700 flex-1 truncate">
                          {p.name}
                        </span>
                        {statusBadge}
                        <span className="text-gray-400 italic flex-shrink-0">
                          {t('controlReview.noPolicyDocument')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related Validations — render latest run summary inline so
                auditors can see execution status without leaving the panel.
                Backend populates `runs` (latest 1) + cheap fallback fields
                `lastRunAt` / `lastResult` (audit-helpers.ts). */}
            <div className="p-5">
              <SectionHead
                icon={<FlaskConical className="w-3.5 h-3.5" />}
                title={`Validations (${tests.length})`}
              />
              {tests.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No tests linked to this control.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {tests.map((tt: ControlTestItem) => {
                    const latestRun = tt.runs?.[0];
                    const runIso = latestRun?.executedAt ?? tt.lastRunAt;
                    const runStatus = latestRun?.status ?? tt.lastResult;
                    return (
                      <div
                        key={tt.id}
                        className="text-xs border border-gray-100 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 flex-1 truncate">
                            {tt.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              tt.status === 'OK'
                                ? 'bg-green-50 text-green-700'
                                : tt.status === 'Overdue'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {tt.status}
                          </span>
                          {tt.completedAt && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="mt-1 text-gray-500">
                          {runIso ? (
                            <>
                              {t('controlReview.lastRun')}:{' '}
                              {new Date(runIso).toLocaleString()}
                              {runStatus ? ` · ${runStatus}` : null}
                            </>
                          ) : (
                            <span className="italic text-gray-400">
                              {t('controlReview.noRunsYet')}
                            </span>
                          )}
                        </div>
                        {latestRun?.summary && (
                          <div className="mt-1 text-gray-500 line-clamp-2">
                            {latestRun.summary}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Related Risks */}
            {risks.length > 0 && (
              <div className="p-5">
                <SectionHead
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  title={`Risks (${risks.length})`}
                />
                <div className="space-y-1.5">
                  {risks.map((r: ControlRiskItem) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          r.impact === 'CRITICAL'
                            ? 'bg-red-500'
                            : r.impact === 'HIGH'
                              ? 'bg-orange-500'
                              : r.impact === 'MEDIUM'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                        }`}
                      />
                      <span className="font-medium text-gray-700 flex-1 truncate">
                        {r.title}
                      </span>
                      <span className="text-gray-400">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit History / Findings */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionHead
                  icon={<AlertCircle className="w-3.5 h-3.5" />}
                  title={`Findings (${findings.length})`}
                  noMargin
                />
                <button
                  onClick={() => setShowFindingModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Finding
                </button>
              </div>
              {findings.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No findings raised for this control yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {(findings as FindingItem[]).map((f) => (
                    <FindingRow
                      key={f.id}
                      finding={f}
                      auditId={auditId}
                      onDeleted={onUpdated}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <ControlCommentsSection auditId={auditId} controlId={ctrl.id} />
          </div>
        </div>
      </div>

      {showFindingModal && (
        <AddFindingModal
          auditId={auditId}
          auditControlId={auditControl.id}
          controlId={ctrl.id}
          controlRef={ctrl.isoReference}
          onClose={() => setShowFindingModal(false)}
          onSaved={onUpdated}
        />
      )}
    </>
  );
}
