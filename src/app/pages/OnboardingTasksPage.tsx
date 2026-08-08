import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Laptop,
  BookOpen,
  Loader2,
  AlertCircle,
  FileText,
  ArrowRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  onboardingService,
  OnboardingStatus,
  TrainingCourse,
} from '@/services/api/onboarding';
import { policiesService } from '@/services/api/policies';
import {
  findingsService,
  FindingRecord,
  FindingSeverity,
  FindingStatus,
} from '@/services/api/findings';
import { CloudAnzenAcademy } from '@/app/features/cloudanzen-academy/components/CloudAnzenAcademy';
import { getCoursePack } from '@/app/pages/onboarding/coursePacks';
import type { AcademyAttemptPayload } from '@/app/pages/onboarding/coursePacks/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { fmtDateTime } from '@/lib/format-date';

// ── Task status pill ──────────────────────────────────────────────────────────

function StatusPill({
  done,
  inProgress,
}: {
  done: boolean;
  inProgress?: boolean;
}) {
  const { t } = useTranslation('common');

  if (done)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3" />{' '}
        {t('onboardingTasks.status.completed')}
      </span>
    );
  if (inProgress)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> {t('onboardingTasks.status.inProgress')}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
      <Circle className="w-3 h-3" /> {t('onboardingTasks.status.notStarted')}
    </span>
  );
}

// ── Task 1 – Accept All Policies ──────────────────────────────────────────────

function Task1Policies({
  status,
  onDone,
}: {
  status: OnboardingStatus;
  onDone: (updated: OnboardingStatus) => void;
}) {
  const { t } = useTranslation('common');
  const [policies, setPolicies] = useState<
    {
      id: string;
      policyId: string;
      name: string;
      version: string;
      status: string;
    }[]
  >([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    policiesService
      .getMyAcceptances()
      .then((res) => {
        if (res.success && res.data)
          setPolicies(
            res.data.map((item) => ({
              id: item.id,
              policyId: item.policyId,
              name: item.policy?.name ?? 'Policy',
              version: String(item.versionNumber),
              status: item.status,
            })),
          );
      })
      .catch(() => setError(t('onboardingTasks.policies.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const hasPending = policies.length > 0;
  const publishedPolicies = policies;
  const pendingSet = new Set(policies.map((item) => item.policyId));

  if (status.policyAccepted && !hasPending) {
    const ids: string[] = (() => {
      try {
        return JSON.parse(status.policyVersionAccepted ?? '[]');
      } catch {
        return [];
      }
    })();
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {t('onboardingTasks.policies.acceptedOn', {
            date: fmtDateTime(status.policyAcceptedAt),
          })}
        </div>
        {ids.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('onboardingTasks.policies.acknowledgedCount', {
              count: ids.length,
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasPending && status.policyAcceptedAt ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          <strong>
            {t('onboardingTasks.policies.newPoliciesPublished', {
              count: pendingSet.size,
            })}
          </strong>{' '}
          {t('onboardingTasks.policies.newPoliciesDescription', {
            date: fmtDateTime(status.policyAcceptedAt),
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('onboardingTasks.policies.instructions')}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
          <Loader2 className="w-4 h-4 animate-spin" />{' '}
          {t('onboardingTasks.policies.loading')}
        </div>
      ) : publishedPolicies.length === 0 ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          {t('onboardingTasks.policies.noPublishedPolicies')}
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {publishedPolicies.map((p) => {
            const isNew = pendingSet.has(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer ${isNew ? 'border-amber-300 bg-amber-50/50' : 'border-border'}`}
              >
                <input
                  type="checkbox"
                  checked={checked.has(p.id)}
                  onChange={(e) => {
                    setChecked((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) {
                        next.add(p.id);
                      } else {
                        next.delete(p.id);
                      }
                      return next;
                    });
                  }}
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <FileText className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.name}
                    </p>
                    {isNew && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        {t('onboardingTasks.policies.newBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    v{p.version}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (publishedPolicies.length > 0)
              setChecked(new Set(publishedPolicies.map((p) => p.id)));
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          {t('onboardingTasks.policies.selectAll')}
        </button>
        <button
          disabled={
            checked.size === 0 || saving || publishedPolicies.length === 0
          }
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              const selected = policies.filter((policy) =>
                checked.has(policy.id),
              );
              await Promise.all(
                selected.map((policy) =>
                  policiesService.acceptPolicy(policy.policyId, policy.id),
                ),
              );
              const res = await onboardingService.getMyStatus();
              onDone(res.data);
              setPolicies((current) =>
                current.filter((policy) => !checked.has(policy.id)),
              );
              setChecked(new Set());
            } catch (e: unknown) {
              setError(
                (e as { message?: string })?.message ?? t('errors.saveFailed'),
              );
            } finally {
              setSaving(false);
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          {saving
            ? t('actions.saving')
            : t('onboardingTasks.policies.acceptPolicies', {
                count: checked.size,
              })}
        </button>
      </div>
    </div>
  );
}

// ── Task 2 – Install MDM Agent ────────────────────────────────────────────────

function Task2Mdm({ status }: { status: OnboardingStatus }) {
  const { t } = useTranslation('common');

  if (status.mdmEnrolled) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {t('onboardingTasks.mdm.enrolledOn', {
            date: fmtDateTime(status.mdmEnrolledAt),
          })}
        </div>
        {status.deviceId && (
          <p className="text-xs text-muted-foreground">
            {t('onboardingTasks.mdm.deviceId')}:{' '}
            <code className="font-mono">{status.deviceId}</code>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('onboardingTasks.mdm.instructions')}
      </p>
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-4 space-y-3">
        <p className="text-sm font-semibold text-blue-900">
          {t('onboardingTasks.mdm.installationSteps')}
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-800">
          <li>{t('onboardingTasks.mdm.steps.generateToken')}</li>
          <li>{t('onboardingTasks.mdm.steps.downloadAgent')}</li>
          <li>{t('onboardingTasks.mdm.steps.runInstaller')}</li>
          <li>{t('onboardingTasks.mdm.steps.autoCheckIn')}</li>
        </ol>
      </div>
      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        {t('onboardingTasks.mdm.autoCompleteNote')}
      </div>
    </div>
  );
}

// ── Task 3 – Security Awareness Training ──────────────────────────────────────

function Task3Training({
  status,
  onDone,
}: {
  status: OnboardingStatus;
  onDone: (updated: OnboardingStatus) => void;
}) {
  const { t } = useTranslation('onboarding');
  const currentUser = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(
    () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('course');
    },
  );

  const courses = status.trainingCourses ?? [];
  const selectedCourse =
    courses.find((course) => course.courseSlug === selectedCourseSlug) ??
    courses.find((course) => course.status !== 'completed') ??
    courses[0] ??
    null;
  const selectedPack = selectedCourse
    ? getCoursePack(selectedCourse.courseSlug)
    : undefined;

  if (!status.trainingRequired || courses.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {t('cloudanzenAcademy.empty.noRequiredCourses')}
      </div>
    );
  }

  const handleTrainingStart = async (course: TrainingCourse) => {
    try {
      await onboardingService.recordTrainingStart(course.courseSlug);
    } catch {
      /* non-fatal */
    }
  };

  const handleTrainingComplete = async (
    course: TrainingCourse,
    payload: AcademyAttemptPayload,
    scorePct: number,
  ) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await onboardingService.recordTrainingComplete(
        course.courseSlug,
        scorePct,
        payload,
      );
      onDone(res.data);
    } catch (e: unknown) {
      setError(
        (e as { message?: string })?.message ??
          t('cloudanzenAcademy.errors.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {status.trainingCompleted && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {t('cloudanzenAcademy.completedOn', {
            date: fmtDateTime(status.trainingCompletedAt),
          })}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <button
            type="button"
            key={course.courseSlug}
            onClick={() => {
              setSelectedCourseSlug(course.courseSlug);
              updateOnboardingTaskUrl('training', course.courseSlug);
            }}
            className={`rounded-lg border p-4 text-left shadow-sm transition hover:border-blue-300 ${
              selectedCourse?.courseSlug === course.courseSlug
                ? 'border-blue-300 bg-blue-50'
                : 'border-border bg-card'
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {course.frameworkName}
              </span>
              <StatusPill
                done={course.status === 'completed'}
                inProgress={course.status === 'in_progress'}
              />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {course.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {course.description}
            </p>
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t('cloudanzenAcademy.courseCard.estimatedMinutes', {
                count: course.estimatedMinutes,
              })}
            </p>
          </button>
        ))}
      </div>

      {selectedCourse && selectedPack && currentUser ? (
        <CloudAnzenAcademy
          course={selectedPack}
          userId={currentUser.id}
          onStart={() => handleTrainingStart(selectedCourse)}
          onComplete={(payload, scorePct) =>
            handleTrainingComplete(selectedCourse, payload, scorePct)
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {t('cloudanzenAcademy.empty.noCourseContent')}
        </div>
      )}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />{' '}
          {t('cloudanzenAcademy.savingCompletion')}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Progress banner ───────────────────────────────────────────────────────────

function ProgressBanner({ status }: { status: OnboardingStatus }) {
  const { t } = useTranslation('common');
  // [T-91] Compute progress over tasks that apply to the user's role.
  const req = status.required;
  const appliesPolicy = req?.policyAcceptance !== false;
  const appliesMdm = req?.mdmEnrollment !== false;
  const appliesTraining = req?.securityTraining !== false;

  const flags = [
    appliesPolicy ? status.policyAccepted : null,
    appliesMdm ? status.mdmEnrolled : null,
    appliesTraining ? status.trainingCompleted : null,
  ].filter((v) => v !== null) as boolean[];

  const total = flags.length;
  const done = flags.filter(Boolean).length;
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);

  if (status.allComplete) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 px-6 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-green-900">
            {t('onboardingTasks.progress.allTasksCompleteTitle')}
          </p>
          <p className="text-sm text-green-700 mt-0.5">
            {t('onboardingTasks.progress.allTasksCompleteDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">
          {t('onboardingTasks.progress.title')}
        </p>
        <span className="text-sm font-semibold text-blue-700">
          {t('onboardingTasks.progress.tasksComplete', {
            done,
            total,
          })}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground/70 mt-2">
        {t('onboardingTasks.progress.description')}
      </p>
    </div>
  );
}

// ── Remediation Tasks section ─────────────────────────────────────────────────

const SEVERITY_COLORS: Record<FindingSeverity, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-blue-100 text-blue-700',
};

const STATUS_COLORS: Record<FindingStatus, string> = {
  OPEN: 'bg-red-50 text-red-700',
  IN_REMEDIATION: 'bg-amber-50 text-amber-700',
  READY_FOR_REVIEW: 'bg-blue-50 text-blue-700',
  CLOSED: 'bg-green-50 text-green-700',
};

const STATUS_LABEL_KEYS: Record<FindingStatus, string> = {
  OPEN: 'open',
  IN_REMEDIATION: 'inRemediation',
  READY_FOR_REVIEW: 'readyForReview',
  CLOSED: 'closed',
};

function fmtShort(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(f: FindingRecord) {
  if (!f.dueAt || f.status === 'CLOSED') return false;
  return new Date(f.dueAt) < new Date();
}

function RemediationTasksSection() {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery<FindingRecord[]>({
    queryKey: ['findings', 'my-tasks'],
    queryFn: () => findingsService.myTasks(),
  });

  async function doTransition(
    finding: FindingRecord,
    action: 'start-remediation' | 'submit-review',
  ) {
    setTransitioning(finding.id);
    setErr(null);
    try {
      if (action === 'start-remediation')
        await findingsService.startRemediation(finding.id);
      else await findingsService.submitForReview(finding.id);
      qc.invalidateQueries({ queryKey: ['findings'] });
    } catch (e: unknown) {
      setErr(
        (e as { message?: string })?.message ??
          t('onboardingTasks.remediation.actionFailed'),
      );
    } finally {
      setTransitioning(null);
    }
  }

  if (isLoading)
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground/70">
        <Loader2 className="w-4 h-4 animate-spin" />{' '}
        {t('onboardingTasks.remediation.loading')}
      </div>
    );

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-semibold text-foreground">
          {t('onboardingTasks.remediation.title')}
        </h2>
        <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
          {tasks.length}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('onboardingTasks.remediation.description')}
      </p>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((f) => (
          <div
            key={f.id}
            className={`rounded-xl border shadow-sm bg-card overflow-hidden ${isOverdue(f) ? 'border-red-200' : 'border-border'}`}
          >
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_COLORS[f.severity]}`}
                    >
                      {f.severity}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[f.status]}`}
                    >
                      {t(
                        `onboardingTasks.remediation.statusLabels.${STATUS_LABEL_KEYS[f.status]}`,
                      )}
                    </span>
                    {isOverdue(f) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />{' '}
                        {t('onboardingTasks.remediation.overdue')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground/70 mb-0.5">
                    {f.control?.isoReference} — {f.control?.title}
                  </p>
                  <p className="text-sm text-foreground">{f.description}</p>
                  {f.dueAt && (
                    <p
                      className={`flex items-center gap-1 text-xs mt-1 ${isOverdue(f) ? 'text-red-600 font-semibold' : 'text-muted-foreground/70'}`}
                    >
                      <Calendar className="w-3 h-3" />{' '}
                      {t('onboardingTasks.remediation.due', {
                        date: fmtShort(f.dueAt),
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="mt-3 flex gap-2">
                {f.status === 'OPEN' && (
                  <button
                    onClick={() => doTransition(f, 'start-remediation')}
                    disabled={transitioning === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium transition-colors"
                  >
                    {transitioning === f.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    {t('onboardingTasks.remediation.startRemediation')}
                  </button>
                )}
                {f.status === 'IN_REMEDIATION' && (
                  <button
                    onClick={() => doTransition(f, 'submit-review')}
                    disabled={transitioning === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium transition-colors"
                  >
                    {transitioning === f.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    {t('onboardingTasks.remediation.submitForReview')}
                  </button>
                )}
                {f.status === 'READY_FOR_REVIEW' && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                    <Clock className="w-3.5 h-3.5" />{' '}
                    {t('onboardingTasks.remediation.awaitingAuditorReview')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Workspace shell ───────────────────────────────────────────────────────────

type OnboardingTaskKey = 'policies' | 'device' | 'training';

type WorkspaceTask = {
  key: OnboardingTaskKey;
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
  done: boolean;
  inProgress?: boolean;
  progressText?: string;
  content: React.ReactNode;
};

function taskFromQuery(): OnboardingTaskKey | null {
  const task = new URLSearchParams(window.location.search).get('task');
  if (task === 'policies' || task === 'device' || task === 'training') {
    return task;
  }
  return null;
}

function updateOnboardingTaskUrl(task: OnboardingTaskKey, courseSlug?: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('task', task);
  if (task === 'training' && courseSlug) {
    url.searchParams.set('course', courseSlug);
  } else if (task !== 'training') {
    url.searchParams.delete('course');
  }
  window.history.replaceState({}, '', url);
}

function WorkspaceTaskButton({
  task,
  active,
  onSelect,
}: {
  task: WorkspaceTask;
  active: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation('common');
  const Icon = task.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
        active
          ? 'border-blue-300 bg-blue-50 shadow-sm'
          : task.done
            ? 'border-green-200 bg-green-50/40 hover:border-green-300'
            : 'border-border bg-card hover:border-blue-200 hover:bg-muted/40'
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          task.done ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
        }`}
      >
        {task.done ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground/70">
            {t('onboardingTasks.taskNumber', { number: task.number })}
          </span>
          <StatusPill done={task.done} inProgress={task.inProgress} />
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {task.title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {task.progressText ?? task.description}
        </p>
      </div>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function OnboardingTasksPage() {
  const { t } = useTranslation(['common', 'onboarding']);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<OnboardingTaskKey | null>(() =>
    taskFromQuery(),
  );

  useEffect(() => {
    onboardingService
      .getMyStatus()
      .then((res) => setStatus(res.data))
      .catch((e) => setError(e?.message ?? t('onboardingTasks.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const tasks = useMemo<WorkspaceTask[]>(() => {
    if (!status) return [];

    const req = status.required;
    const showPolicy = req?.policyAcceptance !== false;
    const showMdm = req?.mdmEnrollment !== false;
    const showTraining = req?.securityTraining !== false;
    const items: WorkspaceTask[] = [];
    let number = 0;

    if (showPolicy) {
      number += 1;
      items.push({
        key: 'policies',
        number,
        icon: FileText,
        title: t('common:onboardingTasks.cards.policies.title'),
        description: t('common:onboardingTasks.cards.policies.description'),
        done: status.policyAccepted,
        inProgress:
          !status.policyAccepted &&
          (status.pendingPolicyIds ?? []).length > 0 &&
          !!status.policyAcceptedAt,
        content: <Task1Policies status={status} onDone={setStatus} />,
      });
    }

    if (showMdm) {
      number += 1;
      items.push({
        key: 'device',
        number,
        icon: Laptop,
        title: t('common:onboardingTasks.cards.mdm.title'),
        description: t('common:onboardingTasks.cards.mdm.description'),
        done: status.mdmEnrolled,
        content: <Task2Mdm status={status} />,
      });
    }

    if (showTraining) {
      const trainingCourses = status.trainingCourses ?? [];
      const completeCourses = trainingCourses.filter(
        (course) => course.status === 'completed',
      ).length;
      number += 1;
      items.push({
        key: 'training',
        number,
        icon: BookOpen,
        title: t('onboarding:cloudanzenAcademy.workspace.trainingTitle'),
        description: t('common:onboardingTasks.cards.training.description'),
        done: status.trainingCompleted,
        inProgress: status.trainingStarted && !status.trainingCompleted,
        progressText:
          trainingCourses.length > 0
            ? t('onboarding:cloudanzenAcademy.workspace.courseProgress', {
                done: completeCourses,
                total: trainingCourses.length,
              })
            : undefined,
        content: <Task3Training status={status} onDone={setStatus} />,
      });
    }

    return items;
  }, [status, t]);

  const selectedTask =
    tasks.find((task) => task.key === activeTask) ??
    tasks.find((task) => !task.done) ??
    tasks[0] ??
    null;

  useEffect(() => {
    if (!selectedTask) return;
    if (activeTask !== selectedTask.key) {
      setActiveTask(selectedTask.key);
      updateOnboardingTaskUrl(selectedTask.key);
    }
  }, [activeTask, selectedTask]);

  const selectTask = (task: WorkspaceTask) => {
    setActiveTask(task.key);
    updateOnboardingTaskUrl(task.key);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-muted">
        <div className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            {t('onboardingTasks.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('onboardingTasks.description')}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              {t('onboardingTasks.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex flex-col h-full bg-muted">
        <div className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            {t('onboardingTasks.title')}
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-600">
              {error ?? t('onboardingTasks.unknownError')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              {t('onboardingTasks.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-6 py-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-foreground">
          {t('onboardingTasks.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('onboardingTasks.description')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Progress banner */}
        <ProgressBanner status={status} />

        {tasks.length === 0 || !selectedTask ? (
          <div className="rounded-2xl bg-card border border-border px-6 py-8 flex flex-col items-center gap-3 text-center">
            <ShieldCheck className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">
              {t('common:onboardingTasks.noTasksApplicable')}
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-sm">
              {t('common:onboardingTasks.noTasksApplicableDescription')}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="hidden lg:block">
                <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <WorkspaceTaskButton
                        key={task.key}
                        task={task}
                        active={selectedTask.key === task.key}
                        onSelect={() => selectTask(task)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 lg:hidden">
                {tasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <button
                      key={task.key}
                      type="button"
                      onClick={() => selectTask(task)}
                      className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center text-xs font-semibold transition ${
                        selectedTask.key === task.key
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      {task.done ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span>{task.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground/70">
                        {t('common:onboardingTasks.taskNumber', {
                          number: selectedTask.number,
                        })}
                      </span>
                      <StatusPill
                        done={selectedTask.done}
                        inProgress={selectedTask.inProgress}
                      />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {selectedTask.title}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                      {selectedTask.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">{selectedTask.content}</div>
            </section>
          </div>
        )}

        {/* Remediation Tasks from audit findings */}
        <RemediationTasksSection />
      </div>
    </div>
  );
}
