import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ShieldCheck, AlertTriangle, CheckCircle, Clock, ChevronRight, Search, X } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { testsService } from '@/services/api/tests';
import { onboardingService } from '@/services/api/onboarding';
import { authService } from '@/services/api/auth';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import type { TestRecord, TestStatus } from '@/services/api/tests';
import { TestDetailPanel } from '@/app/pages/tests/TestDetailPanel';
import { fmtDate } from '@/lib/format-date';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_FILTER_VALUE = 'all';

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<TestStatus, { key: string; label: string; cls: string }> = {
  OK:                { key: 'complete',          label: 'Complete',          cls: 'bg-green-50 text-green-700 border-green-200' },
  Due_soon:          { key: 'dueSoon',           label: 'Due Soon',           cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Overdue:           { key: 'overdue',           label: 'Overdue',            cls: 'bg-red-50 text-red-700 border-red-200' },
  Needs_remediation: { key: 'needsRemediation',  label: 'Needs Remediation',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

function StatusBadge({ status }: { status: TestStatus }) {
  const { t } = useTranslation('dashboard');
  const cfg = STATUS_CFG[status] ?? { key: status, label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {t(`todo.statusLabels.${cfg.key}`, cfg.label)}
    </span>
  );
}

// ─── Onboarding task row ──────────────────────────────────────────────────────

function OnboardingTaskRow({
  label,
  done,
  doneAt,
  description,
  linkTo,
}: {
  label: string;
  done: boolean;
  doneAt: string | null;
  description: string;
  linkTo: string;
}) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-green-100' : 'bg-amber-100'}`}>
        {done
          ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          : <Clock className="w-3.5 h-3.5 text-amber-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-muted-foreground/70 line-through' : 'text-foreground'}`}>{label}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{done ? t('todo.completedAt', { date: fmtDate(doneAt) }) : description}</p>
      </div>
      {!done && (
        <a
          href={linkTo}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Go <ChevronRight className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TodoPage() {
  const { t } = useTranslation('dashboard');
  const me = authService.getCachedUser();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE);
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER_VALUE);

  // Fetch tests assigned to me that are not complete
  const { data: testsData, isLoading: testsLoading, refetch: refetchTests } = useQuery({
    queryKey: [...QK.tests({ ownerId: me?.id }), 'my-work'],
    queryFn: async () => {
      if (!me?.id) return [];
      const res = await testsService.listTests({ ownerId: me.id, limit: 100 });
      if (res.success && res.data) {
        // Show all non-OK tests
        return (res.data as TestRecord[]).filter(t => t.status !== 'OK');
      }
      return [];
    },
    staleTime: STALE.TESTS,
    enabled: !!me?.id,
  });

  // Fetch onboarding status
  const { data: onboardingData, isLoading: onboardingLoading } = useQuery({
    queryKey: QK.onboardingMe(),
    queryFn: async () => {
      const res = await onboardingService.getMyStatus();
      return res.data ?? null;
    },
    staleTime: STALE.USERS,
  });

  const pendingTests = useMemo(() => testsData ?? [], [testsData]);
  const assignedFilterOptions = useMemo(() => ({
    categories: Array.from(new Set(pendingTests.map((test) => test.category))).sort((a, b) => a.localeCompare(b)),
    statuses: Array.from(new Set(pendingTests.map((test) => test.status))).sort((a, b) => a.localeCompare(b)),
    types: Array.from(new Set(pendingTests.map((test) => test.type))).sort((a, b) => a.localeCompare(b)),
  }), [pendingTests]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredPendingTests = useMemo(() => pendingTests.filter((test) => {
    if (categoryFilter !== ALL_FILTER_VALUE && test.category !== categoryFilter) return false;
    if (statusFilter !== ALL_FILTER_VALUE && test.status !== statusFilter) return false;
    if (typeFilter !== ALL_FILTER_VALUE && test.type !== typeFilter) return false;
    if (!normalizedSearchQuery) return true;

    return [
      test.name,
      test.description,
      test.category,
      test.status,
      test.type,
      test.owner?.name,
      test.owner?.email,
    ].some((value) => value?.toLowerCase().includes(normalizedSearchQuery));
  }), [categoryFilter, normalizedSearchQuery, pendingTests, statusFilter, typeFilter]);
  const hasAssignedFilters = normalizedSearchQuery !== ''
    || categoryFilter !== ALL_FILTER_VALUE
    || statusFilter !== ALL_FILTER_VALUE
    || typeFilter !== ALL_FILTER_VALUE;
  const overdue = pendingTests.filter(t => isOverdue(t.dueDate) && t.status !== 'OK');
  const dueSoon = pendingTests.filter(t => !isOverdue(t.dueDate));

  const clearAssignedFilters = () => {
    setSearchQuery('');
    setCategoryFilter(ALL_FILTER_VALUE);
    setStatusFilter(ALL_FILTER_VALUE);
    setTypeFilter(ALL_FILTER_VALUE);
  };

  const getStatusLabel = (status: TestStatus) => {
    const cfg = STATUS_CFG[status] ?? { key: status, label: status };
    return t(`todo.statusLabels.${cfg.key}`, cfg.label);
  };

  const onboarding = onboardingData;
  // [T-91] Build the active task list from the server's `required` block so we only count tasks
  // that apply to the user's role. Auditors with zero required tasks contribute 0 to pending.
  const onboardingTasks = onboarding
    ? [
        {
          key: 'policy' as const,
          label: t('todo.acceptPolicies'),
          description: t('todo.acceptPoliciesDesc'),
          done: onboarding.policyAccepted,
          doneAt: onboarding.policyAcceptedAt,
          enabled: onboarding.required?.policyAcceptance !== false,
        },
        {
          key: 'mdm' as const,
          label: t('todo.enrollMdm'),
          description: t('todo.enrollMdmDesc'),
          done: onboarding.mdmEnrolled,
          doneAt: onboarding.mdmEnrolledAt,
          enabled: onboarding.required?.mdmEnrollment !== false,
        },
        {
          key: 'training' as const,
          label: t('todo.securityTraining'),
          description: t('todo.securityTrainingDesc'),
          done: onboarding.trainingCompleted,
          doneAt: onboarding.trainingCompletedAt,
          enabled: onboarding.required?.securityTraining !== false,
        },
      ].filter((task) => task.enabled)
    : [];

  const onboardingDoneCount   = onboardingTasks.filter((t) => t.done).length;
  const onboardingTotalCount  = onboardingTasks.length;
  const onboardingPendingCount = onboardingTotalCount - onboardingDoneCount;

  const totalPending = pendingTests.length + onboardingPendingCount;

  return (
    <PageTemplate
      title={t('todo.title')}
      description={t('todo.description')}
    >
      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            key: 'totalPending',
            label: t('todo.totalPending'),
            value: testsLoading || onboardingLoading ? '…' : totalPending,
            icon: <ClipboardList className="w-4 h-4" />,
            cls: 'text-foreground bg-card',
          },
          {
            key: 'overdueTests',
            label: t('todo.overdueTests'),
            value: testsLoading ? '…' : overdue.length,
            icon: <AlertTriangle className="w-4 h-4" />,
            cls: overdue.length > 0 ? 'text-red-700 bg-red-50' : 'text-foreground bg-card',
          },
          {
            key: 'dueSoon',
            label: t('todo.dueSoon'),
            value: testsLoading ? '…' : dueSoon.length,
            icon: <Clock className="w-4 h-4" />,
            cls: 'text-amber-700 bg-amber-50',
          },
          {
            key: 'onboardingTasks',
            label: t('todo.onboardingTasks'),
            value: onboardingLoading
              ? '…'
              : onboardingTotalCount === 0
                ? t('todo.notApplicable', { defaultValue: 'N/A' })
                : `${onboardingDoneCount}/${onboardingTotalCount}`,
            icon: <ShieldCheck className="w-4 h-4" />,
            cls: onboardingTotalCount === 0
              ? 'text-muted-foreground bg-muted'
              : onboardingPendingCount === 0
                ? 'text-green-700 bg-green-50'
                : 'text-amber-700 bg-amber-50',
          },
        ].map(s => (
          <Card key={s.key} className={`p-4 flex items-center gap-3 ${s.cls}`}>
            <div className="opacity-70">{s.icon}</div>
            <div>
              <div className="text-xl font-bold leading-none">{s.value}</div>
              <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Assigned Tests ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Overdue */}
          {(testsLoading || overdue.length > 0) && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-semibold text-red-700">{t('todo.overdueTests')}</h2>
                {!testsLoading && <span className="ml-auto text-xs text-red-500">{overdue.length}</span>}
              </div>
              {testsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {overdue.map(test => (
                    <TestRow key={test.id} test={test} onView={() => setSelectedTestId(test.id)} />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Due Soon / In Progress */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 bg-muted border-b border-border space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{t('todo.assignedTests')}</h2>
                {!testsLoading && (
                  <span className="ml-auto text-xs text-muted-foreground/70">
                    {hasAssignedFilters
                      ? t('todo.filteredPending', { count: filteredPendingTests.length, total: pendingTests.length })
                      : `${pendingTests.length} ${t('todo.pending')}`}
                  </span>
                )}
              </div>

              {!testsLoading && pendingTests.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_auto]">
                  <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={t('todo.searchAssignedTests')}
                      className="h-9 bg-background pl-9"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue placeholder={t('todo.categoryFilter')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>{t('todo.allCategories')}</SelectItem>
                      {assignedFilterOptions.categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue placeholder={t('todo.statusFilter')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>{t('todo.allStatuses')}</SelectItem>
                      {assignedFilterOptions.statuses.map((status) => (
                        <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue placeholder={t('todo.typeFilter')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>{t('todo.allTypes')}</SelectItem>
                      {assignedFilterOptions.types.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasAssignedFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAssignedFilters}
                      className="h-9 justify-center px-3"
                    >
                      <X className="h-4 w-4" />
                      <span>{t('todo.clearFilters')}</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
            {testsLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
              </div>
            ) : pendingTests.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground/70">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                {t('todo.noPendingTests')}
              </div>
            ) : filteredPendingTests.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground/70">
                <Search className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                {t('todo.noMatchingTests')}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredPendingTests.map(test => (
                  <TestRow key={test.id} test={test} onView={() => setSelectedTestId(test.id)} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Security Onboarding ── */}
        {/* [T-91] Hide entirely when the role has no onboarding tasks (e.g. Auditor). */}
        {(onboardingLoading || onboardingTotalCount > 0) && (
          <div>
            <Card className="overflow-hidden">
              <div className="px-4 py-3 bg-muted border-b border-border flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{t('todo.securityOnboarding')}</h2>
                {onboarding && onboardingTotalCount > 0 && (
                  <span className={`ml-auto text-xs font-medium ${onboarding.allComplete ? 'text-green-600' : 'text-amber-600'}`}>
                    {onboarding.allComplete
                      ? t('todo.complete')
                      : t('todo.nDone', { count: onboardingDoneCount })}
                  </span>
                )}
              </div>

              {onboardingLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(onboardingTotalCount || 1)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : onboarding ? (
                <div className="px-4 py-2">
                  {/* Progress bar */}
                  <div className="mb-3 mt-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${onboardingTotalCount === 0 ? 100 : (onboardingDoneCount / onboardingTotalCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  {onboardingTasks.map((task) => (
                    <OnboardingTaskRow
                      key={task.key}
                      label={task.label}
                      done={task.done}
                      doneAt={task.doneAt}
                      description={task.description}
                      linkTo="/onboarding-tasks"
                    />
                  ))}
                </div>
              ) : (
                <p className="p-4 text-sm text-muted-foreground/70">{t('todo.couldNotLoadOnboarding')}</p>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ── Test detail side panel ── */}
      {selectedTestId && (
        <TestDetailPanel
          testId={selectedTestId}
          onClose={() => setSelectedTestId(null)}
          onMutated={() => { setSelectedTestId(null); refetchTests(); }}
        />
      )}
    </PageTemplate>
  );
}

// ─── Test row ──────────────────────────────────────────────────────────────────

function TestRow({ test, onView }: { test: TestRecord; onView: () => void }) {
  const overdue = isOverdue(test.dueDate) && test.status !== 'OK';
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{test.name}</p>
        <p className={`text-xs mt-0.5 ${overdue ? 'text-red-500 font-medium' : 'text-muted-foreground/70'}`}>
          Due {fmtDate(test.dueDate)}
          {overdue && ' · Overdue'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="hidden sm:inline-block text-xs text-muted-foreground/70 bg-muted px-2 py-0.5 rounded">
          {test.category}
        </span>
        <StatusBadge status={test.status} />
        <button
          onClick={onView}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          View
        </button>
      </div>
    </div>
  );
}
