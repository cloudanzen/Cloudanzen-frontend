import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { ArrowLeft, ClipboardCheck, ShieldCheck } from 'lucide-react';
import {
  RiskTier,
  UpdateVendorInput,
  VendorRecord,
  VendorReview,
  VendorReviewDecision,
  VendorReviewStatus,
  VendorStatus,
  vendorsService,
} from '@/services/api/vendors';
import { usersService, type UserWithGit } from '@/services/api/users';
import { QK } from '@/lib/queryKeys';
import {
  getStatusColors,
  getSeverityColors,
} from '@/app/theme/semantic-colors';

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

// ── Decision dialog ──────────────────────────────────────────────────────────

function ReviewDecisionDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    decision: VendorReviewDecision;
    decisionNotes: string;
    residualTier?: RiskTier;
  }) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useTranslation('vendors');
  const [decision, setDecision] = useState<VendorReviewDecision>('APPROVED');
  const [residualTier, setResidualTier] = useState<RiskTier>('MEDIUM');
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('review.decisionTitle')}</DialogTitle>
          <DialogDescription>
            {t('review.decisionDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <select
            value={decision}
            onChange={(e) =>
              setDecision(e.target.value as VendorReviewDecision)
            }
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            <option value="APPROVED">{t('review.decision.APPROVED')}</option>
            <option value="APPROVED_WITH_CONDITIONS">
              {t('review.decision.APPROVED_WITH_CONDITIONS')}
            </option>
            <option value="REJECTED">{t('review.decision.REJECTED')}</option>
          </select>
          {decision !== 'REJECTED' && (
            <select
              value={residualTier}
              onChange={(e) => setResidualTier(e.target.value as RiskTier)}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="LOW">{t('riskLevel.LOW')}</option>
              <option value="MEDIUM">{t('riskLevel.MEDIUM')}</option>
              <option value="HIGH">{t('riskLevel.HIGH')}</option>
              <option value="CRITICAL">{t('riskLevel.CRITICAL')}</option>
            </select>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('review.decisionNotesPlaceholder')}
            className="min-h-[100px] rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
          >
            {t('dialog.cancel')}
          </Button>
          <Button
            disabled={props.saving || !notes.trim()}
            onClick={async () => {
              await props.onSubmit({
                decision,
                decisionNotes: notes.trim(),
                residualTier:
                  decision === 'REJECTED' ? undefined : residualTier,
              });
              setNotes('');
            }}
          >
            {props.saving ? t('dialog.saving') : t('review.submitDecision')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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

  const [decisionOpen, setDecisionOpen] = useState(false);

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

          {/* ── Risk context (editable) ── */}
          <TabsContent value="risk">
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.riskContext')}</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskContextForm
                  vendor={vendor}
                  orgUsers={orgUsers}
                  onSave={(patch) => updateMutation.mutateAsync(patch)}
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
                <NotesEditor
                  initial={vendor.notes ?? ''}
                  onSave={(notes) =>
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
        <ReviewDecisionDialog
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

function RiskContextForm(props: {
  vendor: VendorRecord;
  orgUsers: UserWithGit[];
  onSave: (patch: UpdateVendorInput) => Promise<unknown>;
  saving: boolean;
}) {
  const { t } = useTranslation('vendors');
  const [businessCriticality, setBusinessCriticality] = useState<
    UpdateVendorInput['businessCriticality']
  >(props.vendor.businessCriticality);
  const [dataClass, setDataClass] = useState<UpdateVendorInput['dataClass']>(
    props.vendor.dataClass,
  );
  const [subprocessors, setSubprocessors] = useState(props.vendor.subprocessors);
  const [dpaSigned, setDpaSigned] = useState(props.vendor.dpaSigned);
  const [ownerUserId, setOwnerUserId] = useState(props.vendor.ownerUserId ?? '');

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Labeled label={t('detail.owner')}>
        <select
          value={ownerUserId}
          onChange={(e) => setOwnerUserId(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">{t('dialog.ownerPlaceholder')}</option>
          {props.orgUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ? `${u.name} (${u.email})` : u.email}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label={t('detail.businessCriticality')}>
        <select
          value={businessCriticality}
          onChange={(e) =>
            setBusinessCriticality(
              e.target.value as UpdateVendorInput['businessCriticality'],
            )
          }
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="Mission-critical">Mission-critical</option>
          <option value="Business-important">Business-important</option>
          <option value="Operational">Operational</option>
        </select>
      </Labeled>
      <Labeled label={t('detail.dataClass')}>
        <select
          value={dataClass}
          onChange={(e) =>
            setDataClass(e.target.value as UpdateVendorInput['dataClass'])
          }
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="PII">PII</option>
          <option value="Sensitive">Sensitive</option>
          <option value="Internal">Internal</option>
          <option value="Public">Public</option>
        </select>
      </Labeled>
      <Labeled label={t('detail.subprocessors')}>
        <Input
          type="number"
          min={0}
          value={subprocessors}
          onChange={(e) => setSubprocessors(Number(e.target.value) || 0)}
        />
      </Labeled>
      <Labeled label={t('detail.dpa')}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={dpaSigned}
            onChange={(e) => setDpaSigned(e.target.checked)}
          />
          {t('detail.dpaCheckboxLabel')}
        </label>
      </Labeled>
      <div className="sm:col-span-2 flex justify-end">
        <Button
          disabled={props.saving}
          onClick={() =>
            props.onSave({
              businessCriticality,
              dataClass,
              subprocessors,
              dpaSigned,
              ownerUserId: ownerUserId || null,
            })
          }
        >
          {props.saving ? t('dialog.saving') : t('detail.save')}
        </Button>
      </div>
    </div>
  );
}

function Labeled(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {props.label}
      </p>
      {props.children}
    </div>
  );
}

function NotesEditor(props: {
  initial: string;
  onSave: (notes: string) => Promise<unknown>;
  saving: boolean;
}) {
  const { t } = useTranslation('vendors');
  const [notes, setNotes] = useState(props.initial);
  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[160px] w-full rounded-md border border-border px-3 py-2 text-sm"
      />
      <div className="flex justify-end">
        <Button
          disabled={props.saving || notes === props.initial}
          onClick={() => props.onSave(notes)}
        >
          {props.saving ? t('dialog.saving') : t('detail.save')}
        </Button>
      </div>
    </div>
  );
}
