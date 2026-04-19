import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldCheck,
  FileText,
  FlaskConical,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { testsService, TestRecord } from '@/services/api/tests';
import { policiesService } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import { evidenceService } from '@/services/api/evidence';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Control } from './types';
import { fmtDate } from '@/lib/format-date';

interface EvidenceItem {
  id: string;
  type: string;
  fileName?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  controlId?: string;
  control?: { id: string };
}

const STATUS_CONFIG = {
  IMPLEMENTED: {
    key: 'IMPLEMENTED',
    label: 'Implemented',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    Icon: CheckCircle2,
  },
  PARTIALLY_IMPLEMENTED: {
    key: 'PARTIALLY_IMPLEMENTED',
    label: 'Partial',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    Icon: AlertCircle,
  },
  NOT_IMPLEMENTED: {
    key: 'NOT_IMPLEMENTED',
    label: 'Not Implemented',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    Icon: XCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('compliance');
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    key: status,
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    Icon: ShieldCheck,
  };
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {t(`controls.status.${cfg.key}`, cfg.label)}
    </span>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {icon}
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function ControlDetailPanel({
  control,
  onClose,
}: {
  control: Control;
  onClose: () => void;
}) {
  const { t } = useTranslation('compliance');
  const progressPct =
    control.status === 'IMPLEMENTED'
      ? 100
      : control.status === 'PARTIALLY_IMPLEMENTED'
        ? 50
        : 0;

  // Load linked tests (filter by controlId in the list)
  const { data: allTests = [] } = useQuery({
    queryKey: ['tests', 'list', {}],
    queryFn: async () => {
      const r = await testsService.listTests({ limit: 999 });
      return r.data ?? [];
    },
    staleTime: 30_000,
  });

  const linkedTests = (allTests as TestRecord[]).filter((t) =>
    t.controls?.some((c) => c.controlId === control.id),
  );

  // Load policies
  const { data: allPolicies = [] } = useQuery({
    queryKey: ['policies', 'list', {}],
    queryFn: async () => {
      const r = await policiesService.getPolicies();
      return r.data ?? [];
    },
    staleTime: 30_000,
  });

  // Load evidence for this control
  const { data: evidence = [], isLoading: evidenceLoading } = useQuery({
    queryKey: ['evidence', 'control', control.id],
    queryFn: async () => {
      const r = (await evidenceService.getEvidence()) as
        | { data?: EvidenceItem[] }
        | undefined;
      const items = r?.data ?? [];
      return items.filter(
        (e) => e.controlId === control.id || e.control?.id === control.id,
      );
    },
    staleTime: 30_000,
  });

  // Guess policy relevance by ISO reference in policy name / description
  const _ref = control.isoReference?.split('.')[0] ?? '';
  const relatedPolicies = allPolicies
    .filter(
      (_p) =>
        // Currently returns all (true); future: filter by ref/name
        true,
    )
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                {control.isoReference}
              </span>
              <StatusBadge status={control.status} />
            </div>
            <h2 className="mt-2 text-lg font-semibold text-gray-900 leading-snug">
              {control.title}
            </h2>
            {control.description && (
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                {control.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI strip */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {linkedTests.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('controls.detail.linkedTests')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {evidence.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('controls.detail.evidenceItems')}
              </p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${progressPct === 100 ? 'text-green-600' : progressPct > 0 ? 'text-amber-600' : 'text-red-600'}`}
              >
                {progressPct}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('controls.detail.implementation')}
              </p>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPct === 100 ? 'bg-green-500' : progressPct > 0 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Tabs body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="rounded-xl bg-slate-100 p-1 h-auto">
              <TabsTrigger value="overview">
                {t('controls.detail.overview')}
              </TabsTrigger>
              <TabsTrigger value="tests">
                {t('controls.detail.tests', { count: linkedTests.length })}
              </TabsTrigger>
              <TabsTrigger value="evidence">
                {t('controls.detail.evidence', { count: evidence.length })}
              </TabsTrigger>
              <TabsTrigger value="policies">
                {t('controls.detail.policies')}
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <Section
                title={t('controls.detail.controlDetails')}
                icon={<ShieldCheck className="w-4 h-4 text-gray-500" />}
              >
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {t('controls.detail.reference')}
                    </dt>
                    <dd className="mt-1 font-mono font-semibold text-blue-700">
                      {control.isoReference}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {t('controls.detail.status')}
                    </dt>
                    <dd className="mt-1">
                      <StatusBadge status={control.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {t('controls.detail.created')}
                    </dt>
                    <dd className="mt-1 text-gray-700">
                      {fmtDate(control.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {t('controls.detail.lastUpdated')}
                    </dt>
                    <dd className="mt-1 text-gray-700">
                      {fmtDate(control.updatedAt)}
                    </dd>
                  </div>
                  {control.description && (
                    <div className="col-span-2">
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {t('controls.detail.description')}
                      </dt>
                      <dd className="mt-1 text-gray-700 leading-relaxed text-sm">
                        {control.description}
                      </dd>
                    </div>
                  )}
                  {control.justification && (
                    <div className="col-span-2">
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {t('controls.detail.justification')}
                      </dt>
                      <dd className="mt-1 text-gray-700 leading-relaxed text-sm">
                        {control.justification}
                      </dd>
                    </div>
                  )}
                </dl>
              </Section>

              {linkedTests.length > 0 && (
                <Section
                  title={t('controls.detail.linkedTestsSection', {
                    count: linkedTests.length,
                  })}
                  icon={<FlaskConical className="w-4 h-4 text-gray-500" />}
                >
                  <ul className="space-y-2">
                    {linkedTests.slice(0, 5).map((testRecord: TestRecord) => {
                      const statusColors: Record<string, string> = {
                        OK: 'bg-green-50 text-green-700',
                        Overdue: 'bg-red-50 text-red-700',
                        Due_soon: 'bg-amber-50 text-amber-700',
                        Needs_remediation: 'bg-orange-50 text-orange-700',
                      };
                      return (
                        <li
                          key={testRecord.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {testRecord.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {testRecord.type} · {testRecord.category}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[testRecord.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {STATUS_CONFIG[
                              testRecord.status as keyof typeof STATUS_CONFIG
                            ]?.label
                              ? t(
                                  `controls.status.${STATUS_CONFIG[testRecord.status as keyof typeof STATUS_CONFIG].key}`,
                                  STATUS_CONFIG[
                                    testRecord.status as keyof typeof STATUS_CONFIG
                                  ].label,
                                )
                              : testRecord.status.replace(/_/g, ' ')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}
            </TabsContent>

            {/* Tests */}
            <TabsContent value="tests" className="space-y-3 mt-0">
              {linkedTests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {t('controls.detail.noTestsLinked')}
                  </p>
                  <p className="text-xs mt-1">
                    {t('controls.detail.goToTestsHint')}
                  </p>
                </div>
              ) : (
                linkedTests.map((testRecord: TestRecord) => {
                  const statusColors: Record<string, string> = {
                    OK: 'border-green-200 bg-green-50/50',
                    Overdue: 'border-red-200 bg-red-50/50',
                    Due_soon: 'border-amber-200 bg-amber-50/50',
                    Needs_remediation: 'border-orange-200 bg-orange-50/50',
                  };
                  const badgeColors: Record<string, string> = {
                    OK: 'bg-green-100 text-green-700',
                    Overdue: 'bg-red-100 text-red-700',
                    Due_soon: 'bg-amber-100 text-amber-700',
                    Needs_remediation: 'bg-orange-100 text-orange-700',
                  };
                  return (
                    <div
                      key={testRecord.id}
                      className={`rounded-xl border p-4 ${statusColors[testRecord.status] ?? 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {testRecord.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t('controls.detail.testMeta', {
                              type: testRecord.type,
                              category: testRecord.category,
                              dueDate: fmtDate(testRecord.dueDate),
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${badgeColors[testRecord.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_CONFIG[
                            testRecord.status as keyof typeof STATUS_CONFIG
                          ]?.label
                            ? t(
                                `controls.status.${STATUS_CONFIG[testRecord.status as keyof typeof STATUS_CONFIG].key}`,
                                STATUS_CONFIG[
                                  testRecord.status as keyof typeof STATUS_CONFIG
                                ].label,
                              )
                            : testRecord.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {testRecord.evidences?.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">
                          {t('controls.detail.evidenceItemCount', {
                            count: testRecord.evidences.length,
                          })}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Evidence */}
            <TabsContent value="evidence" className="space-y-3 mt-0">
              {evidenceLoading ? (
                <p className="text-sm text-gray-400 animate-pulse py-4 text-center">
                  {t('controls.detail.loadingEvidence')}
                </p>
              ) : evidence.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {t('controls.detail.noEvidenceAttached')}
                  </p>
                  <p className="text-xs mt-1">
                    {t('controls.detail.uploadEvidenceHint')}
                  </p>
                </div>
              ) : (
                evidence.map((ev: EvidenceItem) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {ev.type} · {fmtDate(ev.createdAt)}
                        </p>
                      </div>
                    </div>
                    {ev.fileUrl && (
                      <a
                        href={ev.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline flex-shrink-0 ml-2"
                      >
                        <ExternalLink className="w-3 h-3" />{' '}
                        {t('controls.view')}
                      </a>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* Policies */}
            <TabsContent value="policies" className="space-y-3 mt-0">
              {relatedPolicies.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {t('controls.detail.noPoliciesFound')}
                  </p>
                </div>
              ) : (
                relatedPolicies.map((p: Policy) => {
                  const statusColors: Record<string, string> = {
                    PUBLISHED: 'bg-green-50 text-green-700',
                    DRAFT: 'bg-gray-100 text-gray-600',
                    REVIEW: 'bg-amber-50 text-amber-700',
                    ARCHIVED: 'bg-red-50 text-red-600',
                  };
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            v{p.version} · {fmtDate(p.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {p.status}
                      </span>
                    </div>
                  );
                })
              )}
              <p className="text-xs text-gray-400 text-center pt-2">
                {t('controls.detail.showingPolicies')}
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
