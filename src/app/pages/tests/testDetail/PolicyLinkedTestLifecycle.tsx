import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Hourglass,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { fmtDate, fmtDateTime } from '@/lib/format-date';
import { policiesService } from '@/services/api/policies';
import type { PolicyApprovalRecord, PolicyVersion } from '@/services/api/types';
import type {
  PolicyLinkedTestPolicySummary,
  TestRecord,
} from '@/services/api/tests';
import { StatusBadge } from './StatusBadge';

interface Props {
  test: TestRecord;
  policyId: string;
  initialPolicy?: PolicyLinkedTestPolicySummary | null;
  onOpenPolicy?: () => void;
  /** Re-run callback for cloudanzen-internal automated tests (e.g. the
   *  policy-acceptance-complete check). When provided, the lifecycle view
   *  shows a compact "Re-run check" action so users do not have to wait for
   *  the daily 08:00 UTC sweep after accepting a policy. */
  onRunCheck?: () => void;
  isRunning?: boolean;
}

function pillClass(tone: 'success' | 'warning' | 'danger' | 'neutral') {
  if (tone === 'success') return 'border-green-200 bg-green-50 text-green-700';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (tone === 'danger') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-gray-200 bg-white text-gray-700';
}

function policyStatusTone(status?: string) {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'ARCHIVED') return 'neutral';
  return 'warning';
}

function latestApprovalRound(approvals: PolicyApprovalRecord[]) {
  const maxRound = Math.max(
    0,
    ...approvals.map((approval) => approval.approvalRound),
  );
  return approvals.filter((approval) => approval.approvalRound === maxRound);
}

function approvalSummary(approvals: PolicyApprovalRecord[]) {
  const round = latestApprovalRound(approvals);
  if (round.length === 0) return { key: 'none', tone: 'neutral' as const };
  if (round.some((approval) => approval.status === 'REJECTED')) {
    return { key: 'rejected', tone: 'danger' as const };
  }
  if (round.some((approval) => approval.status === 'PENDING')) {
    return { key: 'pending', tone: 'warning' as const };
  }
  return { key: 'approved', tone: 'success' as const };
}

function LifecycleCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {message}
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
        />
      ))}
    </div>
  );
}

export function PolicyLinkedTestLifecycle({
  test,
  policyId,
  initialPolicy,
  onOpenPolicy,
  onRunCheck,
  isRunning,
}: Props) {
  const { t } = useTranslation('tests');

  const policyQuery = useQuery({
    queryKey: QK.policyDetail(policyId),
    queryFn: () => policiesService.getPolicy(policyId),
    enabled: !!policyId,
    staleTime: STALE.POLICIES,
  });

  const versionsQuery = useQuery({
    queryKey: QK.policyVersions(policyId),
    queryFn: () => policiesService.getVersions(policyId),
    enabled: !!policyId,
    staleTime: STALE.POLICIES,
  });

  const approvalsQuery = useQuery({
    queryKey: QK.policyApprovals(policyId),
    queryFn: () => policiesService.getApprovals(policyId),
    enabled: !!policyId,
    staleTime: STALE.POLICIES,
  });

  const acceptancesQuery = useQuery({
    queryKey: QK.policyAcceptances(policyId),
    queryFn: () => policiesService.getAcceptances(policyId),
    enabled: !!policyId,
    staleTime: STALE.POLICIES,
  });

  const policy = policyQuery.data?.data ?? initialPolicy ?? null;
  const versions = versionsQuery.data?.data ?? [];
  const approvals = approvalsQuery.data?.data ?? [];
  const acceptances = acceptancesQuery.data?.data ?? [];
  const currentVersionNumber = policy?.versionNumber ?? 1;
  const currentVersion = versions.find(
    (version) => version.versionNumber === currentVersionNumber,
  );
  const japaneseLocale =
    currentVersion?.locales?.find((locale) => locale.locale === 'ja') ?? null;
  const olderVersions = versions.filter(
    (version) => version.versionNumber !== currentVersionNumber,
  );

  const approval = approvalSummary(approvals);
  const currentAcceptances = acceptances.filter(
    (acceptance) => acceptance.versionNumber === currentVersionNumber,
  );
  const acceptedCount = currentAcceptances.filter(
    (acceptance) => acceptance.status === 'ACCEPTED',
  ).length;
  const pendingAcceptances = currentAcceptances.filter(
    (acceptance) => acceptance.status === 'PENDING',
  );

  const latestApprovals = latestApprovalRound(approvals);
  const documentHref =
    currentVersion?.documentUrl ??
    currentVersion?.pdfUrl ??
    policy?.documentUrl ??
    policy?.pdfUrl ??
    null;
  const japaneseHref =
    japaneseLocale?.documentUrl ?? japaneseLocale?.pdfUrl ?? null;

  if (policyQuery.isLoading && !initialPolicy) {
    return <LoadingCards />;
  }

  if (policyQuery.isError && !policy) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {t('testDetail.policyLifecycle.unavailableTitle')}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {t('testDetail.policyLifecycle.unavailableDescription')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {policyQuery.isError && initialPolicy ? (
        <SectionError message={t('testDetail.policyLifecycle.refreshFailed')} />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {policy ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${pillClass(policyStatusTone(policy.status))}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t(`testDetail.policyLifecycle.policyStatuses.${policy.status}`, {
              defaultValue: policy.status,
            })}
          </span>
        ) : null}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${pillClass(approval.tone)}`}
        >
          {approval.tone === 'danger' ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          {t(`testDetail.policyLifecycle.approvalStates.${approval.key}`)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
          <CalendarDays className="h-3.5 w-3.5" />
          {policy?.recurrenceMonths
            ? t('testDetail.policyLifecycle.cadenceMonths', {
                count: policy.recurrenceMonths,
              })
            : t('testDetail.policyLifecycle.noCadence')}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
          <FileText className="h-3.5 w-3.5" />
          {t('testDetail.policyLifecycle.linkedCounts', {
            controls: test.controls.length,
            frameworks: test.frameworks.length,
          })}
        </span>
        <StatusBadge status={test.status} />
        {onRunCheck ? (
          <button
            type="button"
            onClick={onRunCheck}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`}
            />
            {isRunning
              ? t('testDetail.overview.running')
              : t('testDetail.policyLifecycle.rerunCheck', {
                  defaultValue: 'Re-run check',
                })}
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <LifecycleCard
          title={t('testDetail.policyLifecycle.renewBefore')}
          icon={<Hourglass className="h-4 w-4 text-gray-500" />}
        >
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t('testDetail.policyLifecycle.renewalDate')}
              </dt>
              <dd className="mt-0.5 font-semibold text-gray-900">
                {fmtDate(policy?.renewalDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t('testDetail.policyLifecycle.lastRenewed')}
              </dt>
              <dd className="mt-0.5 font-medium text-gray-800">
                {fmtDate(policy?.lastRenewedAt)}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onOpenPolicy}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            {t('testDetail.policyLifecycle.openPolicy')}
          </button>
        </LifecycleCard>

        <LifecycleCard
          title={t('testDetail.policyLifecycle.approvedVersion')}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        >
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900">
                {policy?.status === 'PUBLISHED'
                  ? t('testDetail.policyLifecycle.publishedVersion', {
                      version: currentVersionNumber,
                    })
                  : t('testDetail.policyLifecycle.currentDraft', {
                      version: currentVersionNumber,
                    })}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {currentVersion?.changelog ??
                  t('testDetail.policyLifecycle.noChangelog')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {documentHref ? (
                <a
                  href={documentHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  {t('testDetail.policyLifecycle.viewDocument')}
                </a>
              ) : (
                <span className="text-sm text-gray-400">
                  {t('testDetail.policyLifecycle.noDocument')}
                </span>
              )}
              {japaneseHref ? (
                <a
                  href={japaneseHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  {t('testDetail.policyLifecycle.viewJapanese')}
                </a>
              ) : null}
            </div>
          </div>
        </LifecycleCard>
      </div>

      <LifecycleCard
        title={t('testDetail.policyLifecycle.approvalTitle')}
        icon={<Users className="h-4 w-4 text-gray-500" />}
      >
        {approvalsQuery.isError ? (
          <SectionError
            message={t('testDetail.policyLifecycle.approvalsFailed')}
          />
        ) : latestApprovals.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t('testDetail.policyLifecycle.noApprovals')}
          </p>
        ) : (
          <div className="space-y-2">
            {latestApprovals.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.approver?.name ??
                      item.approver?.email ??
                      item.approverId}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.comment || t('testDetail.policyLifecycle.noComment')}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === 'APPROVED'
                      ? 'bg-green-50 text-green-700'
                      : item.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {t(
                    `testDetail.policyLifecycle.approvalStatus.${item.status}`,
                    {
                      defaultValue: item.status,
                    },
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </LifecycleCard>

      <LifecycleCard
        title={t('testDetail.policyLifecycle.acceptancesTitle')}
        icon={<CheckCircle2 className="h-4 w-4 text-gray-500" />}
      >
        {acceptancesQuery.isError ? (
          <SectionError
            message={t('testDetail.policyLifecycle.acceptancesFailed')}
          />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('testDetail.policyLifecycle.accepted')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {acceptedCount}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('testDetail.policyLifecycle.required')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {currentAcceptances.length}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('testDetail.policyLifecycle.pending')}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {pendingAcceptances.length}
                </p>
              </div>
            </div>
            {pendingAcceptances.length > 0 ? (
              <div className="space-y-1">
                {pendingAcceptances.slice(0, 6).map((item) => (
                  <p key={item.id} className="text-sm text-gray-600">
                    {item.user?.name ?? item.user?.email ?? item.userId}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t('testDetail.policyLifecycle.noPendingAcceptances')}
              </p>
            )}
          </div>
        )}
      </LifecycleCard>

      <LifecycleCard
        title={t('testDetail.policyLifecycle.versionHistory')}
        icon={<Clock className="h-4 w-4 text-gray-500" />}
      >
        {versionsQuery.isError ? (
          <SectionError
            message={t('testDetail.policyLifecycle.versionsFailed')}
          />
        ) : versions.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t('testDetail.policyLifecycle.noVersions')}
          </p>
        ) : (
          <div className="space-y-2">
            {[currentVersion, ...olderVersions]
              .filter(Boolean)
              .map((version) => version as PolicyVersion)
              .map((version) => (
                <div
                  key={version.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t('testDetail.policyLifecycle.versionNumber', {
                          version: version.versionNumber,
                        })}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {t('testDetail.policyLifecycle.publishedAt', {
                          date: fmtDateTime(version.publishedAt),
                        })}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                      {version.status}
                    </span>
                  </div>
                  {version.changelog ? (
                    <p className="mt-2 text-sm text-gray-700">
                      {version.changelog}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        )}
      </LifecycleCard>
    </div>
  );
}
