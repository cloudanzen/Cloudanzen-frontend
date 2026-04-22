import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  FlaskConical,
  Link2,
  Rocket,
  Shield,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { type Policy } from '@/services/api/types';
import { frameworksService, type FrameworkDto } from '@/services/api/frameworks';
import { integrationsService, type Integration } from '@/services/api/integrations';
import { type TestSummary } from '@/services/api/tests';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

interface RiskOverview {
  total: number;
}

interface ComplianceLaunchpadProps {
  policies: Policy[];
  riskOverview: RiskOverview | null;
  testSummary: TestSummary | null;
  loadingPolicies: boolean;
  loadingRisks: boolean;
  loadingTests: boolean;
}

type StepStatus = 'not_started' | 'in_progress' | 'done';

function statusBadge(status: StepStatus, label: string) {
  if (status === 'done') {
    return (
      <Badge className="border-green-200 bg-green-50 text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        {label}
      </Badge>
    );
  }

  if (status === 'in_progress') {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700">
        {label}
      </Badge>
    );
  }

  return <Badge variant="outline" className="border-gray-200 text-muted-foreground">{label}</Badge>;
}

export function ComplianceLaunchpad({
  policies,
  riskOverview,
  testSummary,
  loadingPolicies,
  loadingRisks,
  loadingTests,
}: ComplianceLaunchpadProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const { data: integrations = [] } = useQuery({
    queryKey: QK.integrationsStatus(),
    queryFn: async () => {
      try {
        const res = await integrationsService.getStatus();
        return ((res as { integrations?: Integration[] })?.integrations ?? []) as Integration[];
      } catch {
        return [] as Integration[];
      }
    },
    staleTime: STALE.DASHBOARD,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: QK.frameworkCatalog(),
    queryFn: async () => {
      try {
        const res = await frameworksService.listCatalog();
        return ((res as { data?: FrameworkDto[] })?.data ?? []) as FrameworkDto[];
      } catch {
        return [] as FrameworkDto[];
      }
    },
    staleTime: STALE.DASHBOARD,
  });

  const safeCatalog = Array.isArray(catalog) ? catalog : [];
  const safeIntegrations = Array.isArray(integrations) ? integrations : [];
  const safePolicies = Array.isArray(policies) ? policies : [];

  const featuredFrameworks = useMemo(
    () => safeCatalog.filter((fw) => ['soc-2', 'iso-27001', 'hipaa'].includes(fw.slug)),
    [safeCatalog],
  );

  const hasActiveIntegration = safeIntegrations.some((integration) => integration.status === 'ACTIVE');
  const policyStatus: StepStatus = loadingPolicies
    ? 'not_started'
    : safePolicies.some((policy) => policy.status === 'PUBLISHED')
      ? 'done'
      : safePolicies.length > 0
        ? 'in_progress'
        : 'not_started';
  const riskStatus: StepStatus = loadingRisks
    ? 'not_started'
    : (riskOverview?.total ?? 0) > 0
      ? 'in_progress'
      : 'not_started';
  const testStatus: StepStatus = loadingTests
    ? 'not_started'
    : (testSummary?.completed ?? 0) > 0
      ? 'done'
      : (testSummary?.total ?? 0) > 0
        ? 'in_progress'
        : 'not_started';

  const steps = [
    {
      key: 'activateFramework',
      icon: Shield,
      path: '/compliance/frameworks',
      status: 'not_started' as StepStatus,
    },
    {
      key: 'connectSystems',
      icon: Link2,
      path: '/integrations',
      status: (hasActiveIntegration ? 'done' : 'not_started') as StepStatus,
    },
    {
      key: 'reviewAccess',
      icon: Users,
      path: '/personnel/access',
      status: 'not_started' as StepStatus,
    },
    {
      key: 'createPolicies',
      icon: FileText,
      path: '/compliance/policies',
      status: policyStatus,
    },
    {
      key: 'reviewRisks',
      icon: AlertTriangle,
      path: '/risk/risks',
      status: riskStatus,
    },
    {
      key: 'startTests',
      icon: FlaskConical,
      path: '/tests',
      status: testStatus,
    },
  ];

  const frameworkMeta: Record<string, { icon: typeof Target; className: string }> = {
    'soc-2': { icon: Target, className: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40' },
    'iso-27001': { icon: ShieldCheck, className: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40' },
    hipaa: { icon: ClipboardList, className: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' },
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:border-indigo-900/40 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t('launchpad.title')}
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                {t('launchpad.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <Button onClick={() => navigate('/compliance/frameworks')}>
              {t('launchpad.activateCta')}
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('launchpad-setup-path')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              {t('launchpad.setupPathTitle')}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section id="launchpad-setup-path" className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t('launchpad.setupPathTitle')}
            </h2>
          </div>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.key} className="p-4 transition-shadow duration-200 hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {index + 1}
                          </span>
                          <h3 className="text-sm font-semibold text-foreground">
                            {t(`launchpad.steps.${step.key}.title`)}
                          </h3>
                          {statusBadge(step.status, t(`launchpad.status.${step.status}`))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t(`launchpad.steps.${step.key}.description`)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(step.path)}>
                      {t(`launchpad.steps.${step.key}.cta`)}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t('launchpad.recommendedTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            {featuredFrameworks.map((framework) => {
              const meta = frameworkMeta[framework.slug] ?? {
                icon: Target,
                className: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40',
              };
              const Icon = meta.icon;
              return (
                <Card key={framework.slug} className="p-5 transition-shadow duration-200 hover:shadow-md">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.className}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{framework.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {framework.description ?? framework.version}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('launchpad.bestFor')}
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {t(`launchpad.frameworks.${framework.slug}.bestFor`)}
                      </p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/compliance/frameworks')}>
                      {t('launchpad.activate')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
