import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, ClipboardCheck, ShieldCheck } from 'lucide-react';
import {
  RiskTier,
  UpdateVendorInput,
  VendorReview,
  VendorReviewDecision,
  VendorReviewStatus,
  VendorStatus,
  VendorDocumentKind,
  vendorsService,
} from '@/services/api/vendors';
import { usersService } from '@/services/api/users';
import { QK } from '@/lib/queryKeys';
import {
  getStatusColors,
  getSeverityColors,
} from '@/app/theme/semantic-colors';
import { VendorReviewDecisionDialog } from './components/VendorReviewDecisionDialog';
import { VendorRiskContextForm } from './components/VendorRiskContextForm';
import { VendorNotesEditor } from './components/VendorNotesEditor';
import { VendorDocumentsTab } from './components/VendorDocumentsTab';
import { VendorContactsTab } from './components/VendorContactsTab';
import { VendorFindingsTab } from './components/VendorFindingsTab';
import { VendorMonitoringTab } from './components/VendorMonitoringTab';
import { VendorIncidentsTab } from './components/VendorIncidentsTab';

// ── Helpers ────────────────────────────────────────────────────────────────────

const statusMeta: Record<VendorStatus, { className: string }> = {
  MONITORED: { className: getStatusColors('MONITORED').className },
  ASSESSMENT_DUE: { className: getStatusColors('ASSESSMENT_DUE').className },
  IN_REVIEW: { className: getStatusColors('IN_REVIEW').className },
  BLOCKED: { className: getStatusColors('BLOCKED').className },
};

const tierMeta: Record<RiskTier, { className: string }> = {
  LOW: { className: getSeverityColors('LOW').className },
  MEDIUM: { className: getSeverityColors('MEDIUM').className },
  HIGH: { className: getSeverityColors('HIGH').className },
  CRITICAL: { className: getSeverityColors('CRITICAL').className },
};

const reviewStatusMeta: Record<VendorReviewStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  UNDER_APPROVAL: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

function isOpenReview(s: VendorReviewStatus): boolean {
  return s === 'DRAFT' || s === 'IN_PROGRESS' || s === 'UNDER_APPROVAL';
}

// ── Main page ────────────────────────────────────────────────────────────────

export function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('vendors');
  const qc = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: QK.vendor(vendorId ?? ''),
    queryFn: () => vendorsService.get(vendorId ?? ''),
    enabled: Boolean(vendorId),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: QK.vendorReviews(vendorId ?? ''),
    queryFn: () => vendorsService.reviews.list(vendorId ?? ''),
    enabled: Boolean(vendorId),
  });

  const { data: orgUsers = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: () => usersService.listUsers(),
    staleTime: 5 * 60_000,
  });

  const openReview = useMemo<VendorReview | null>(
    () => reviews.find((r) => isOpenReview(r.status)) ?? null,
    [reviews],
  );

  const { data: reviewDocuments = [] } = useQuery({
    queryKey: QK.vendorReviewDocuments(vendorId ?? '', openReview?.id ?? ''),
    queryFn: () => vendorsService.reviews.documents.list(vendorId ?? '', openReview!.id),
    enabled: Boolean(vendorId && openReview?.id),
  });

  const { data: questionnaireAnswers = [] } = useQuery({
    queryKey: QK.vendorQuestionnaireAnswers(vendorId ?? '', openReview?.id ?? ''),
    queryFn: () => vendorsService.reviews.questionnaire.list(vendorId ?? '', openReview!.id),
    enabled: Boolean(vendorId && openReview?.id),
  });

  const [decisionOpen, setDecisionOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedKind, setSelectedKind] = useState<VendorDocumentKind>('SOC2');
  const [answerEdits, setAnswerEdits] = useState<Record<string, string>>({});
  const [pollAfterRun, setPollAfterRun] = useState(false);

  const { data: reviewAiStatus } = useQuery({
    queryKey: QK.vendorQuestionnaireStatus(vendorId ?? '', openReview?.id ?? ''),
    queryFn: () => vendorsService.reviews.questionnaire.getStatus(vendorId ?? '', openReview!.id),
    enabled: Boolean(vendorId && openReview?.id),
    refetchInterval: pollAfterRun ? 2000 : false,
  });

  const { data: suggestedControls = [] } = useQuery({
    queryKey: QK.vendorQuestionnaireSuggestions(vendorId ?? '', openReview?.id ?? ''),
    queryFn: () => vendorsService.reviews.questionnaire.listSuggestions(vendorId ?? '', openReview!.id),
    enabled: Boolean(vendorId && openReview?.id),
    refetchInterval: pollAfterRun ? 3000 : false,
  });

  // ── Mutations ──
  const updateMutation = useMutation({
    mutationFn: (patch: UpdateVendorInput) =>
      vendorsService.update(vendorId ?? '', patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.vendor(vendorId ?? '') });
      qc.invalidateQueries({ queryKey: QK.vendors() });
    },
  });

  const startReviewMutation = useMutation({
    mutationFn: () => vendorsService.reviews.start(vendorId ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.vendorReviews(vendorId ?? '') });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: (reviewId: string) =>
      vendorsService.reviews.submit(vendorId ?? '', reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.vendorReviews(vendorId ?? '') });
    },
  });

  const cancelReviewMutation = useMutation({
    mutationFn: (reviewId: string) =>
      vendorsService.reviews.cancel(vendorId ?? '', reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.vendorReviews(vendorId ?? '') });
    },
  });

  const decideMutation = useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: string;
      data: {
        decision: VendorReviewDecision;
        decisionNotes: string;
        residualTier?: RiskTier;
      };
    }) =>
      vendorsService.reviews.decide(vendorId ?? '', reviewId, {
        decision: data.decision,
        decisionNotes: data.decisionNotes,
        residualTier: data.residualTier,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.vendorReviews(vendorId ?? '') });
      qc.invalidateQueries({ queryKey: QK.vendor(vendorId ?? '') });
      qc.invalidateQueries({ queryKey: QK.vendors() });
      setDecisionOpen(false);
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: VendorDocumentKind }) =>
      vendorsService.reviews.documents.upload(vendorId ?? '', openReview!.id, file, kind),
    onSuccess: async () => {
      setSelectedFile(null);
      toast.success(t('phase3.uploadSuccess'));
      await qc.invalidateQueries({ queryKey: QK.vendorReviewDocuments(vendorId ?? '', openReview?.id ?? '') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('phase3.uploadFailed'));
    },
  });

  const runQuestionnaireMutation = useMutation({
    mutationFn: () => vendorsService.reviews.questionnaire.run(vendorId ?? '', openReview!.id),
    onSuccess: async () => {
      setPollAfterRun(true);
      toast.success(t('phase3.runQueued'));
      await qc.invalidateQueries({ queryKey: QK.vendorQuestionnaireStatus(vendorId ?? '', openReview?.id ?? '') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('phase3.runFailed'));
    },
  });

  const updateAnswerMutation = useMutation({
    mutationFn: ({ answerId, status, finalText }: { answerId: string; status: 'ACCEPTED' | 'EDITED' | 'DISMISSED'; finalText?: string | null }) =>
      vendorsService.reviews.questionnaire.updateAnswer(vendorId ?? '', openReview!.id, answerId, { status, finalText }),
    onSuccess: async () => {
      toast.success(t('phase3.answerSaved'));
      await qc.invalidateQueries({ queryKey: QK.vendorQuestionnaireAnswers(vendorId ?? '', openReview?.id ?? '') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('phase3.answerSaveFailed'));
    },
  });

  const createControlLinkMutation = useMutation({
    mutationFn: ({ documentId, controlId, confidence }: { documentId: string; controlId: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }) =>
      vendorsService.reviews.documents.createControlLink(vendorId ?? '', openReview!.id, documentId, { controlId, confidence }),
    onSuccess: async () => {
      toast.success(t('phase3.controlAccepted'));
      await qc.invalidateQueries({ queryKey: QK.vendorReviewDocuments(vendorId ?? '', openReview?.id ?? '') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('phase3.controlAcceptFailed'));
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => vendorsService.reviews.documents.remove(vendorId ?? '', openReview!.id, documentId),
    onSuccess: async () => {
      toast.success(t('phase3.deleteSuccess'));
      await Promise.all([
        qc.invalidateQueries({ queryKey: QK.vendorReviewDocuments(vendorId ?? '', openReview?.id ?? '') }),
        qc.invalidateQueries({ queryKey: QK.vendorQuestionnaireAnswers(vendorId ?? '', openReview?.id ?? '') }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('phase3.deleteFailed'));
    },
  });

  useEffect(() => {
    if (!pollAfterRun) return;
    if (reviewAiStatus?.state === 'COMPLETED') {
      void qc.invalidateQueries({ queryKey: QK.vendorQuestionnaireAnswers(vendorId ?? '', openReview?.id ?? '') });
      void qc.invalidateQueries({ queryKey: QK.vendorQuestionnaireSuggestions(vendorId ?? '', openReview?.id ?? '') });
      setPollAfterRun(false);
    }
  }, [pollAfterRun, reviewAiStatus?.state, qc, vendorId, openReview?.id]);

  // ── Render ──
  if (!vendorId) return null;
  if (isLoading || !vendor) {
    return (
      <PageTemplate
        title={t('detail.loading')}
        description={t('detail.loadingDescription')}
      >
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t('detail.loadingDescription')}
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={vendor.name}
      description={vendor.category}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/vendors')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('detail.back')}
          </Button>
          {!openReview && (
            <Button
              onClick={() => startReviewMutation.mutate()}
              disabled={startReviewMutation.isPending}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {startReviewMutation.isPending
                ? t('review.starting')
                : t('review.start')}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header summary card */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <Badge
              variant="outline"
              className={statusMeta[vendor.status].className}
            >
              {t(`status.${vendor.status}`)}
            </Badge>
            {vendor.inherentTier && (
              <Badge
                variant="outline"
                className={tierMeta[vendor.inherentTier].className}
              >
                {t('inherent.tierLabel', {
                  tier: t(`riskLevel.${vendor.inherentTier}`),
                })}
              </Badge>
            )}
            {vendor.residualTier ? (
              <Badge
                variant="outline"
                className={tierMeta[vendor.residualTier].className}
              >
                {t('residual.tierLabel', {
                  tier: t(`riskLevel.${vendor.residualTier}`),
                })}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {t('residual.pending')}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {t('detail.ownerLabel', {
                owner:
                  vendor.ownerUser?.name ??
                  vendor.ownerUser?.email ??
                  t('emptyValue'),
              })}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('detail.nextReviewLabel', {
                date: fmtDate(vendor.nextAssessmentAt),
              })}
            </span>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t('detail.overview')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('detail.reviews')}</TabsTrigger>
            <TabsTrigger value="documents">{t('detail.documents')}</TabsTrigger>
            <TabsTrigger value="contacts">{t('detail.contacts')}</TabsTrigger>
            <TabsTrigger value="findings">{t('detail.findings')}</TabsTrigger>
            <TabsTrigger value="monitoring">{t('detail.monitoring')}</TabsTrigger>
            <TabsTrigger value="incidents">{t('detail.incidents')}</TabsTrigger>
            <TabsTrigger value="risk">{t('detail.riskContext')}</TabsTrigger>
            <TabsTrigger value="notes">{t('detail.notes')}</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.overview')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('detail.inherentScore')}
                  value={vendor.inherentRiskScore?.toString() ?? '—'}
                />
                <Field
                  label={t('detail.residualScore')}
                  value={vendor.residualRiskScore?.toString() ?? '—'}
                />
                <Field
                  label={t('detail.dataClass')}
                  value={vendor.dataClass}
                />
                <Field
                  label={t('detail.businessCriticality')}
                  value={vendor.businessCriticality}
                />
                <Field
                  label={t('detail.subprocessors')}
                  value={vendor.subprocessors.toString()}
                />
                <Field
                  label={t('detail.dpa')}
                  value={vendor.dpaSigned ? t('detail.yes') : t('detail.no')}
                />
                <Field
                  label={t('detail.lastAssessment')}
                  value={fmtDate(vendor.lastAssessmentAt)}
                />
                <Field
                  label={t('detail.nextReview')}
                  value={fmtDate(vendor.nextAssessmentAt)}
                />
                {vendor.contractEndDate && (
                  <Field
                    label={t('detail.contractEnd')}
                    value={fmtDate(vendor.contractEndDate)}
                  />
                )}
                {vendor.trustCenterUrl && (
                  <Field
                    label={t('detail.trustCenter')}
                    value={vendor.trustCenterUrl}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Reviews ── */}
          <TabsContent value="reviews" className="space-y-3">
            {reviews.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  {t('review.empty')}
                </CardContent>
              </Card>
            )}
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      {t('review.cycleLabel', { cycle: review.cycleNumber })}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t('review.startedLabel', {
                        date: fmtDate(review.startedAt),
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={reviewStatusMeta[review.status]}
                  >
                    {t(`review.status.${review.status}`)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field
                      label={t('review.reviewer')}
                      value={
                        review.reviewer?.name ??
                        review.reviewer?.email ??
                        t('emptyValue')
                      }
                    />
                    <Field
                      label={t('review.approver')}
                      value={
                        review.approver?.name ??
                        review.approver?.email ??
                        t('emptyValue')
                      }
                    />
                    <Field
                      label={t('inherent.tierLabel', {
                        tier: t(`riskLevel.${review.inherentTierSnapshot ?? 'MEDIUM'}`),
                      })}
                      value={review.inherentRiskScoreSnapshot?.toString() ?? '—'}
                    />
                    <Field
                      label={t('review.residual')}
                      value={
                        review.residualTier
                          ? `${t(`riskLevel.${review.residualTier}`)} (${review.residualRiskScore ?? '—'})`
                          : t('emptyValue')
                      }
                    />
                    {review.decisionNotes && (
                      <div className="sm:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t('review.decisionNotes')}
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {review.decisionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  {isOpenReview(review.status) && (
                    <div className="flex flex-wrap gap-2">
                      {(review.status === 'DRAFT' ||
                        review.status === 'IN_PROGRESS') && (
                        <Button
                          size="sm"
                          onClick={() => submitReviewMutation.mutate(review.id)}
                          disabled={submitReviewMutation.isPending}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {t('review.submitForApproval')}
                        </Button>
                      )}
                      {review.status === 'UNDER_APPROVAL' && (
                        <Button
                          size="sm"
                          onClick={() => setDecisionOpen(true)}
                        >
                          {t('review.decide')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelReviewMutation.mutate(review.id)}
                        disabled={cancelReviewMutation.isPending}
                      >
                        {t('review.cancel')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <VendorDocumentsTab
              hasOpenReview={Boolean(openReview)}
              reviewAiStatus={reviewAiStatus?.state ?? 'IDLE'}
              selectedKind={selectedKind}
              onSelectedKindChange={setSelectedKind}
              onFileChange={setSelectedFile}
              selectedFile={selectedFile}
              onUpload={() => {
                if (selectedFile) {
                  uploadDocumentMutation.mutate({ file: selectedFile, kind: selectedKind });
                }
              }}
              uploading={uploadDocumentMutation.isPending}
              onRunAiReview={() => runQuestionnaireMutation.mutate()}
              runningAiReview={runQuestionnaireMutation.isPending}
              documents={reviewDocuments}
              onDeleteDocument={(documentId) => deleteDocumentMutation.mutate(documentId)}
              questionnaireAnswers={questionnaireAnswers}
              answerEdits={answerEdits}
              onAnswerEditChange={(answerId, value) => setAnswerEdits((curr) => ({ ...curr, [answerId]: value }))}
              onAcceptAnswer={(answer) =>
                updateAnswerMutation.mutate({
                  answerId: answer.id,
                  status:
                    answerEdits[answer.id] &&
                    answerEdits[answer.id] !== (answer.draftText ?? '')
                      ? 'EDITED'
                      : 'ACCEPTED',
                  finalText: answerEdits[answer.id] ?? answer.draftText ?? '',
                })
              }
              onDismissAnswer={(answer) =>
                updateAnswerMutation.mutate({
                  answerId: answer.id,
                  status: 'DISMISSED',
                })
              }
              suggestedControls={suggestedControls}
              onAcceptControl={(suggestion) =>
                createControlLinkMutation.mutate({
                  documentId: suggestion.documentId,
                  controlId: suggestion.controlId,
                  confidence: suggestion.confidence,
                })
              }
            />
          </TabsContent>

          {/* ── Contacts ── */}
          <TabsContent value="contacts">
            {vendorId && <VendorContactsTab vendorId={vendorId} />}
          </TabsContent>

          {/* ── Findings ── */}
          <TabsContent value="findings">
            {vendorId && <VendorFindingsTab vendorId={vendorId} />}
          </TabsContent>

          {/* ── Monitoring ── */}
          <TabsContent value="monitoring">
            {vendorId && <VendorMonitoringTab vendorId={vendorId} />}
          </TabsContent>

          {/* ── Incidents ── */}
          <TabsContent value="incidents">
            {vendorId && <VendorIncidentsTab vendorId={vendorId} />}
          </TabsContent>

          {/* ── Risk context (editable) ── */}
          <TabsContent value="risk">
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.riskContext')}</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorRiskContextForm
                  vendor={vendor}
                  orgUsers={orgUsers}
                  onSave={(patch: UpdateVendorInput) => updateMutation.mutateAsync(patch)}
                  saving={updateMutation.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notes ── */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorNotesEditor
                  initial={vendor.notes ?? ''}
                  onSave={(notes: string) =>
                    updateMutation.mutateAsync({ notes: notes || null })
                  }
                  saving={updateMutation.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {openReview && (
        <VendorReviewDecisionDialog
          open={decisionOpen}
          onOpenChange={setDecisionOpen}
          saving={decideMutation.isPending}
          onSubmit={(data) =>
            decideMutation.mutateAsync({
              reviewId: openReview.id,
              data,
            }).then(() => undefined)
          }
        />
      )}
    </PageTemplate>
  );
}

// ── Tiny presentational helpers ──────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
