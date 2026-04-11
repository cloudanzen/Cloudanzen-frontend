import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Database, FileSearch, Play, RefreshCw, ShieldAlert, HeartPulse, History } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { riskEngineService } from '@/services/api/riskEngine';
import { riskLevelVariant, riskStatusVariant } from '@/services/api/riskFormatting';

const ENGINE_QUERY_KEYS = {
  snapshot: ['risk-engine', 'snapshot'] as const,
  signals: ['risk-engine', 'signals'] as const,
  testResults: ['risk-engine', 'test-results'] as const,
  evidence: ['risk-engine', 'evidence'] as const,
  risks: ['risk-engine', 'generated-risks'] as const,
  providerStatuses: ['risk-engine', 'provider-statuses'] as const,
  scanRuns: ['risk-engine', 'scan-runs'] as const,
  events: ['risk-engine', 'events'] as const,
};

function providerStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'HEALTHY') return 'default';
  if (status === 'DEGRADED') return 'secondary';
  if (status === 'ERROR') return 'destructive';
  return 'outline';
}

export function RiskEnginePage() {
  const { t } = useTranslation('risk');
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  const snapshotQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.snapshot, queryFn: async () => (await riskEngineService.getFoundationSnapshot()).data });
  const signalsQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.signals, queryFn: async () => (await riskEngineService.getSignals()).data });
  const testResultsQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.testResults, queryFn: async () => (await riskEngineService.getTestResults()).data });
  const evidenceQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.evidence, queryFn: async () => (await riskEngineService.getEvidenceSnapshots()).data });
  const risksQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.risks, queryFn: async () => (await riskEngineService.getGeneratedRisks()).data });
  const providerStatusesQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.providerStatuses, queryFn: async () => (await riskEngineService.getProviderStatuses()).data });
  const scanRunsQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.scanRuns, queryFn: async () => (await riskEngineService.getScanRuns()).data });
  const eventsQuery = useQuery({ queryKey: ENGINE_QUERY_KEYS.events, queryFn: async () => (await riskEngineService.getEvents()).data });

  const isLoading = snapshotQuery.isLoading || signalsQuery.isLoading || testResultsQuery.isLoading || evidenceQuery.isLoading || risksQuery.isLoading || providerStatusesQuery.isLoading || scanRunsQuery.isLoading || eventsQuery.isLoading;

  function eventVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (severity === 'critical') return 'destructive';
    if (severity === 'warning') return 'secondary';
    return 'outline';
  }

  const metrics = useMemo(() => {
    const snapshot = snapshotQuery.data;
    if (!snapshot) return [];
    return [
      { label: t('engine.metrics.signals'), value: snapshot.signals, icon: Activity },
      { label: t('engine.metrics.tests'), value: snapshot.tests, icon: FileSearch },
      { label: t('engine.metrics.evidence'), value: snapshot.evidenceSnapshots, icon: Database },
      { label: t('engine.metrics.openRisks'), value: snapshot.openRisks, icon: ShieldAlert },
    ];
  }, [snapshotQuery.data]);

  async function handleRun() {
    setIsRunning(true);
    try {
      await riskEngineService.runEvaluation();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ENGINE_QUERY_KEYS.snapshot }),
        queryClient.invalidateQueries({ queryKey: ENGINE_QUERY_KEYS.testResults }),
        queryClient.invalidateQueries({ queryKey: ENGINE_QUERY_KEYS.risks }),
        queryClient.invalidateQueries({ queryKey: ENGINE_QUERY_KEYS.scanRuns }),
        queryClient.invalidateQueries({ queryKey: ENGINE_QUERY_KEYS.events }),
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <PageTemplate
      title={t('engine.title')}
      description={t('engine.description')}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="mr-2 h-4 w-4" />{t('engine.refresh')}
          </Button>
          <Button size="sm" onClick={handleRun} disabled={isRunning}>
            <Play className="mr-2 h-4 w-4" />{isRunning ? t('engine.running') : t('engine.runEvaluation')}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <Card className="p-10 text-center text-sm text-gray-500">{t('engine.loading')}</Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">{metric.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2 text-gray-900">
                <HeartPulse className="h-4 w-4" />
                <h3 className="text-base font-semibold">{t('engine.providerSync')}</h3>
              </div>
              <div className="space-y-3">
                {providerStatusesQuery.data?.map((status) => (
                  <div key={status.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium capitalize text-gray-900">{status.provider.replace('-', ' ')}</p>
                        <p className="mt-1 text-xs text-gray-500">{status.integrationId}</p>
                      </div>
                      <Badge variant={providerStatusVariant(status.status)}>{status.status}</Badge>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
                      <span>{t('engine.signalsCount', { count: status.signalsCollected })}</span>
                      <span>{t('engine.testsCount', { count: status.testsEvaluated })}</span>
                      <span>{t('engine.openRisksCount', { count: status.openRisks })}</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">{t('engine.lastSuccess', { date: new Date(status.lastSuccessAt).toLocaleString() })}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2 text-gray-900">
                <History className="h-4 w-4" />
                <h3 className="text-base font-semibold">{t('engine.scanHistory')}</h3>
              </div>
              <div className="space-y-3">
                {scanRunsQuery.data?.slice(0, 6).map((run) => (
                  <div key={run.id} className="rounded-xl bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium capitalize text-gray-900">{run.provider.replace('-', ' ')}</p>
                        <p className="mt-1 text-xs text-gray-500">{t('engine.trigger', { trigger: run.trigger })}</p>
                      </div>
                      <Badge variant={run.status === 'FAILED' ? 'destructive' : run.status === 'RUNNING' ? 'secondary' : 'default'}>{run.status}</Badge>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
                      <span>{t('engine.ingested', { count: run.signalsIngested })}</span>
                      <span>{t('engine.executed', { count: run.testsExecuted })}</span>
                      <span>{t('engine.risksCount', { count: run.risksGenerated })}</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">{t('engine.completed', { date: new Date(run.completedAt).toLocaleString() })}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Tabs defaultValue="signals" className="gap-4">
            <TabsList>
              <TabsTrigger value="signals">{t('engine.tabs.signals')}</TabsTrigger>
              <TabsTrigger value="tests">{t('engine.tabs.tests')}</TabsTrigger>
              <TabsTrigger value="evidence">{t('engine.tabs.evidence')}</TabsTrigger>
              <TabsTrigger value="risks">{t('engine.tabs.risks')}</TabsTrigger>
              <TabsTrigger value="events">{t('engine.tabs.events')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signals">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {(t('engine.signalColumns', { returnObjects: true }) as string[]).map((header) => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {signalsQuery.data?.map((signal) => (
                        <tr key={signal.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{signal.signalType}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{signal.provider}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{signal.resourceName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{String(signal.value)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(signal.observedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{signal.integrationId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tests">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {(t('engine.testColumns', { returnObjects: true }) as string[]).map((header) => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {testResultsQuery.data?.map((result) => (
                        <tr key={result.id}>
                          <td className="px-6 py-4 text-sm text-gray-600">{result.testId}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{result.signalId}</td>
                          <td className="px-6 py-4"><Badge variant={result.status === 'FAIL' ? 'destructive' : result.status === 'PASS' ? 'default' : 'outline'}>{result.status}</Badge></td>
                          <td className="px-6 py-4"><Badge variant={riskLevelVariant(result.severity)}>{result.severity}</Badge></td>
                          <td className="px-6 py-4 text-sm text-gray-600">{result.reason}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(result.executedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="evidence">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {(t('engine.evidenceColumns', { returnObjects: true }) as string[]).map((header) => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {evidenceQuery.data?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4"><Badge variant="outline">{item.kind}</Badge></td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.provider}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.resourceId}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">{item.hash}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.capturedAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">{JSON.stringify(item.payload)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="risks">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {(t('engine.riskColumns', { returnObjects: true }) as string[]).map((header) => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {risksQuery.data?.map((risk) => (
                        <tr key={risk.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{risk.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{risk.category}</td>
                          <td className="px-6 py-4"><Badge variant={riskLevelVariant(risk.severity)}>{risk.severity}</Badge></td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{risk.score}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{risk.ownerTeam}</td>
                          <td className="px-6 py-4"><Badge variant={riskStatusVariant(risk.status)}>{risk.status}</Badge></td>
                          <td className="px-6 py-4 text-sm text-gray-600">{risk.resourceName}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(risk.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {(t('engine.eventColumns', { returnObjects: true }) as string[]).map((header) => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {eventsQuery.data?.map((event) => (
                        <tr key={event.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{event.eventType}</td>
                          <td className="px-6 py-4"><Badge variant={eventVariant(event.severity)}>{event.severity}</Badge></td>
                          <td className="px-6 py-4 text-sm text-gray-600">{event.provider}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{event.resourceId}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{event.message}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(event.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageTemplate>
  );
}
