import { useQuery } from '@tanstack/react-query';
import { usePlatformAdmin } from '@/app/hooks/usePlatformAdmin';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  platformHealthService,
  type PlatformHealthPayload,
} from '@/services/api/platformHealth';
import {
  RefreshCw,
  Building2,
  Plug,
  AlertTriangle,
  Briefcase,
  Activity,
  Clock,
} from 'lucide-react';

// PR-X7: real cards backed by GET /api/platform/health. Polls at 60s
// matching the backend's 30s cache so the server hits Redis ~50% of the
// time. Force-refresh button bypasses the cache.
//
// Framework activation + pending-requests cards intentionally render "—"
// because the backend returns null until PR-X7.5 wires the framework_pool
// raw-pg counts.

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-red-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : 'text-gray-900';
  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </Card>
  );
}

function asNumberOrDash(v: number | null | undefined): string {
  return v == null ? '—' : String(v);
}

function IntegrationsCard({ data }: { data: PlatformHealthPayload }) {
  const providers = Object.entries(data.integrations.failingByProvider);
  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">Integrations</span>
        <Plug className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex gap-6 mb-3">
        <div>
          <div className="text-2xl font-semibold text-green-600">
            {data.integrations.healthy}
          </div>
          <div className="text-xs text-gray-500">Healthy</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-red-600">
            {data.integrations.failing}
          </div>
          <div className="text-xs text-gray-500">Failing</div>
        </div>
      </div>
      {providers.length > 0 && (
        <div className="border-t border-gray-200 pt-2">
          <div className="text-xs text-gray-600 mb-1">Failing by provider:</div>
          <ul className="text-xs space-y-0.5">
            {providers.map(([provider, count]) => (
              <li key={provider} className="flex justify-between">
                <span className="text-gray-700">{provider}</span>
                <span className="text-red-600 font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function JobsCard({ data }: { data: PlatformHealthPayload }) {
  const dlqTotal =
    data.jobs.dlqDepth.scan +
    data.jobs.dlqDepth.compliance +
    data.jobs.dlqDepth.riskEvaluation;
  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">Job queues</span>
        <Briefcase className="w-4 h-4 text-gray-400" />
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-2">
        {dlqTotal}{' '}
        <span className="text-sm font-normal text-gray-500">DLQ</span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Scan</span>
          <span className="text-gray-900">
            queue {data.jobs.queueDepth.scan} / dlq {data.jobs.dlqDepth.scan}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Compliance</span>
          <span className="text-gray-900">
            queue {data.jobs.queueDepth.compliance} / dlq{' '}
            {data.jobs.dlqDepth.compliance}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Risk evaluation</span>
          <span className="text-gray-900">
            queue {data.jobs.queueDepth.riskEvaluation}
          </span>
        </div>
      </div>
    </Card>
  );
}

function IncidentsCard({ data }: { data: PlatformHealthPayload }) {
  return (
    <Card className="p-4 bg-white col-span-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">
          Recent platform activity
        </span>
        <Activity className="w-4 h-4 text-gray-400" />
      </div>
      {data.recentIncidents.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.recentIncidents.map((row, i) => (
            <li
              key={`${row.ts}-${i}`}
              className="py-2 flex items-center gap-3 text-sm"
            >
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 w-40 flex-shrink-0">
                {new Date(row.ts).toLocaleString()}
              </span>
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {row.action}
              </span>
              <span className="text-gray-700 truncate">
                {row.targetType}
                {row.targetId ? ` · ${row.targetId.slice(0, 8)}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PlatformDashboardPage() {
  const { data: admin } = usePlatformAdmin();
  const { data, isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ['platform', 'health'],
    queryFn: () => platformHealthService.get(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Signed in as {admin?.email ?? '…'}
            {data?.generatedAt && (
              <span className="ml-2">
                · data from {new Date(data.generatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            platformHealthService.get({ force: true }).then(() => refetch())
          }
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {isError && (
        <Card className="p-4 bg-red-50 border border-red-200 text-sm text-red-700">
          Failed to load health data. Retry in 60 seconds.
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-6 bg-white text-sm text-gray-500">Loading…</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Organizations"
            value={data.orgs.total}
            icon={<Building2 className="w-4 h-4" />}
          />
          <MetricCard
            title="Frameworks activated"
            value={asNumberOrDash(data.frameworks.activated)}
            subtitle="From framework pool (PR-X7.5)"
            icon={<Activity className="w-4 h-4" />}
          />
          <MetricCard
            title="Pending framework requests"
            value={asNumberOrDash(data.frameworks.pendingRequests)}
            subtitle="From framework pool (PR-X7.5)"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <MetricCard
            title="Active support sessions"
            value={data.supportSessions.activeNow}
            subtitle={`${data.supportSessions.openedLast24h} opened in last 24h`}
            icon={<Briefcase className="w-4 h-4" />}
            tone={data.supportSessions.activeNow > 0 ? 'warning' : 'default'}
          />
          <IntegrationsCard data={data} />
          <JobsCard data={data} />
          <IncidentsCard data={data} />
        </div>
      )}
    </div>
  );
}
