import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Laptop,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  FileText,
  ArrowRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingService, OnboardingStatus } from '@/services/api/onboarding';
import { policiesService } from '@/services/api/policies';
import {
  findingsService,
  FindingRecord,
  FindingSeverity,
  FindingStatus,
} from '@/services/api/findings';
import { SecurityQuestApp } from '@/app/features/security-quest/components/SecurityQuestApp';
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
        {t('securityTasks.status.completed')}
      </span>
    );
  if (inProgress)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> {t('securityTasks.status.inProgress')}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
      <Circle className="w-3 h-3" /> {t('securityTasks.status.notStarted')}
    </span>
  );
}

// ── Task card wrapper ─────────────────────────────────────────────────────────

function TaskCard({
  number,
  icon: Icon,
  title,
  description,
  done,
  inProgress,
  children,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
  done: boolean;
  inProgress?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(!done);

  return (
    <div
      className={`rounded-2xl border shadow-sm transition-all ${done ? 'border-green-200 bg-green-50/30' : 'border-border bg-card'}`}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-4 px-6 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100' : 'bg-blue-50'}`}
        >
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Icon className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground/70">
              {t('securityTasks.taskNumber', { number })}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {title}
            </span>
            <StatusPill done={done} inProgress={inProgress} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
        )}
      </button>

      {/* Expandable body */}
      {open && (
        <div className="px-6 pb-6 border-t border-border">
          <div className="mt-4">{children}</div>
        </div>
      )}
    </div>
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
    { id: string; name: string; version: string; status: string }[]
  >([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    policiesService
      .getPolicies({ status: 'PUBLISHED' })
      .then((res) => {
        if (res.success && res.data)
          setPolicies(
            res.data as {
              id: string;
              name: string;
              version: string;
              status: string;
            }[],
          );
      })
      .catch(() => setError(t('securityTasks.policies.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const hasPending = (status.pendingPolicyIds ?? []).length > 0;
  const publishedPolicies = policies.filter((p) => p.status === 'PUBLISHED');
  const pendingSet = new Set(status.pendingPolicyIds ?? []);

  // If reopened due to new policies, pre-check already-accepted ones
  useEffect(() => {
    if (hasPending && publishedPolicies.length > 0) {
      const alreadyAccepted = publishedPolicies
        .filter((p) => !pendingSet.has(p.id))
        .map((p) => p.id);
      if (alreadyAccepted.length > 0) {
        setChecked(new Set(alreadyAccepted));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending, policies.length]);

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
          {t('securityTasks.policies.acceptedOn', {
            date: fmtDateTime(status.policyAcceptedAt),
          })}
        </div>
        {ids.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('securityTasks.policies.acknowledgedCount', {
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
            {t('securityTasks.policies.newPoliciesPublished', {
              count: pendingSet.size,
            })}
          </strong>{' '}
          {t('securityTasks.policies.newPoliciesDescription', {
            date: fmtDateTime(status.policyAcceptedAt),
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('securityTasks.policies.instructions')}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
          <Loader2 className="w-4 h-4 animate-spin" />{' '}
          {t('securityTasks.policies.loading')}
        </div>
      ) : publishedPolicies.length === 0 ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          {t('securityTasks.policies.noPublishedPolicies')}
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
                        {t('securityTasks.policies.newBadge')}
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
          {t('securityTasks.policies.selectAll')}
        </button>
        <button
          disabled={
            checked.size === 0 || saving || publishedPolicies.length === 0
          }
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              const res = await onboardingService.acceptPolicies(
                Array.from(checked),
              );
              onDone(res.data);
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
            : t('securityTasks.policies.acceptPolicies', {
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
          {t('securityTasks.mdm.enrolledOn', {
            date: fmtDateTime(status.mdmEnrolledAt),
          })}
        </div>
        {status.deviceId && (
          <p className="text-xs text-muted-foreground">
            {t('securityTasks.mdm.deviceId')}:{' '}
            <code className="font-mono">{status.deviceId}</code>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('securityTasks.mdm.instructions')}
      </p>
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-4 space-y-3">
        <p className="text-sm font-semibold text-blue-900">
          {t('securityTasks.mdm.installationSteps')}
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-800">
          <li>{t('securityTasks.mdm.steps.generateToken')}</li>
          <li>{t('securityTasks.mdm.steps.downloadAgent')}</li>
          <li>{t('securityTasks.mdm.steps.runInstaller')}</li>
          <li>{t('securityTasks.mdm.steps.autoCheckIn')}</li>
        </ol>
      </div>
      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        {t('securityTasks.mdm.autoCompleteNote')}
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
  const { t } = useTranslation('common');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status.trainingCompleted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
        <CheckCircle2 className="w-4 h-4" />
        {t('securityTasks.training.completedOn', {
          date: fmtDateTime(status.trainingCompletedAt),
        })}
      </div>
    );
  }

  const handleTrainingStart = async () => {
    try {
      await onboardingService.recordTrainingStart();
    } catch {
      /* non-fatal */
    }
  };

  const handleTrainingComplete = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await onboardingService.recordTrainingComplete();
      onDone(res.data);
    } catch (e: unknown) {
      setError(
        (e as { message?: string })?.message ??
          t('securityTasks.training.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {status.trainingStarted && !status.trainingCompleted && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Clock className="w-3.5 h-3.5" />
          {t('securityTasks.training.inProgress', {
            date: fmtDateTime(status.trainingStartedAt),
          })}
        </div>
      )}

      <SecurityQuestApp
        onTrainingStart={handleTrainingStart}
        onTrainingComplete={handleTrainingComplete}
      />

      {saving && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />{' '}
          {t('securityTasks.training.savingCompletion')}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Progress banner ───────────────────────────────────────────────────────────

function ProgressBanner({ status }: { status: OnboardingStatus }) {
  const { t } = useTranslation('common');
  const done = [
    status.policyAccepted,
    status.mdmEnrolled,
    status.trainingCompleted,
  ].filter(Boolean).length;
  const pct = Math.round((done / 3) * 100);

  if (status.allComplete) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 px-6 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-green-900">
            {t('securityTasks.progress.allTasksCompleteTitle')}
          </p>
          <p className="text-sm text-green-700 mt-0.5">
            {t('securityTasks.progress.allTasksCompleteDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">
          {t('securityTasks.progress.title')}
        </p>
        <span className="text-sm font-semibold text-blue-700">
          {t('securityTasks.progress.tasksComplete', { done })}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground/70 mt-2">
        {t('securityTasks.progress.description')}
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
          t('securityTasks.remediation.actionFailed'),
      );
    } finally {
      setTransitioning(null);
    }
  }

  if (isLoading)
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground/70">
        <Loader2 className="w-4 h-4 animate-spin" />{' '}
        {t('securityTasks.remediation.loading')}
      </div>
    );

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-semibold text-foreground">
          {t('securityTasks.remediation.title')}
        </h2>
        <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
          {tasks.length}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('securityTasks.remediation.description')}
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
                        `securityTasks.remediation.statusLabels.${STATUS_LABEL_KEYS[f.status]}`,
                      )}
                    </span>
                    {isOverdue(f) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />{' '}
                        {t('securityTasks.remediation.overdue')}
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
                      {t('securityTasks.remediation.due', {
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
                    {t('securityTasks.remediation.startRemediation')}
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
                    {t('securityTasks.remediation.submitForReview')}
                  </button>
                )}
                {f.status === 'READY_FOR_REVIEW' && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                    <Clock className="w-3.5 h-3.5" />{' '}
                    {t('securityTasks.remediation.awaitingAuditorReview')}
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

// ── Main page ──────────────────────────────────────────────────────────────────

export function MySecurityTasksPage() {
  const { t } = useTranslation('common');
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onboardingService
      .getMyStatus()
      .then((res) => setStatus(res.data))
      .catch((e) => setError(e?.message ?? t('securityTasks.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-muted">
        <div className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            {t('securityTasks.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('securityTasks.description')}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              {t('securityTasks.loading')}
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
            {t('securityTasks.title')}
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-600">
              {error ?? t('securityTasks.unknownError')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              {t('securityTasks.retry')}
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
          {t('securityTasks.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('securityTasks.description')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-3xl w-full mx-auto space-y-5">
        {/* Progress banner */}
        <ProgressBanner status={status} />

        {/* Task 1 */}
        <TaskCard
          number={1}
          icon={FileText}
          title={t('securityTasks.cards.policies.title')}
          description={t('securityTasks.cards.policies.description')}
          done={status.policyAccepted}
          inProgress={
            !status.policyAccepted &&
            (status.pendingPolicyIds ?? []).length > 0 &&
            !!status.policyAcceptedAt
          }
        >
          <Task1Policies status={status} onDone={setStatus} />
        </TaskCard>

        {/* Task 2 */}
        <TaskCard
          number={2}
          icon={Laptop}
          title={t('securityTasks.cards.mdm.title')}
          description={t('securityTasks.cards.mdm.description')}
          done={status.mdmEnrolled}
        >
          <Task2Mdm status={status} />
        </TaskCard>

        {/* Task 3 */}
        <TaskCard
          number={3}
          icon={BookOpen}
          title={t('securityTasks.cards.training.title')}
          description={t('securityTasks.cards.training.description')}
          done={status.trainingCompleted}
          inProgress={status.trainingStarted && !status.trainingCompleted}
        >
          <Task3Training status={status} onDone={setStatus} />
        </TaskCard>

        {/* Remediation Tasks from audit findings */}
        <RemediationTasksSection />
      </div>
    </div>
  );
}
