import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { usePlatformAdmin } from '@/app/hooks/usePlatformAdmin';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
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
  ChevronRight,
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
  to,
  tone = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  to?: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const navigate = useNavigate();
  const clickable = Boolean(to);
  const toneClass =
    tone === 'danger'
      ? 'text-red-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : 'text-foreground';

  const openTarget = () => {
    if (to) navigate(to);
  };

  return (
    <Card
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={openTarget}
      onKeyDown={(event) => {
        if (!clickable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openTarget();
        }
      }}
      className={cn(
        'group p-4 bg-card transition-all',
        clickable &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
          )}
        </div>
        {clickable && (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
    </Card>
  );
}

function asNumberOrDash(v: number | null | undefined): string {
  return v == null ? '—' : String(v);
}

function IntegrationsCard({ data }: { data: PlatformHealthPayload }) {
  const providers = Object.entries(data.integrations.failingByProvider);
  return (
    <Card className="p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Integrations</span>
        <Plug className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex gap-6 mb-3">
        <div>
          <div className="text-2xl font-semibold text-green-600">
            {data.integrations.healthy}
          </div>
          <div className="text-xs text-muted-foreground">Healthy</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-red-600">
            {data.integrations.failing}
          </div>
          <div className="text-xs text-muted-foreground">Failing</div>
        </div>
      </div>
      {providers.length > 0 && (
        <div className="border-t border-border pt-2">
          <div className="text-xs text-muted-foreground mb-1">
            Failing by provider:
          </div>
          <ul className="text-xs space-y-0.5">
            {providers.map(([provider, count]) => (
              <li key={provider} className="flex justify-between">
                <span className="text-foreground">{provider}</span>
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
    <Card className="p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Job queues</span>
        <Briefcase className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-semibold text-foreground mb-2">
        {dlqTotal}{' '}
        <span className="text-sm font-normal text-muted-foreground">DLQ</span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Scan</span>
          <span className="text-foreground">
            queue {data.jobs.queueDepth.scan} / dlq {data.jobs.dlqDepth.scan}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Compliance</span>
          <span className="text-foreground">
            queue {data.jobs.queueDepth.compliance} / dlq{' '}
            {data.jobs.dlqDepth.compliance}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Risk evaluation</span>
          <span className="text-foreground">
            queue {data.jobs.queueDepth.riskEvaluation}
          </span>
        </div>
      </div>
    </Card>
  );
}

function IncidentsCard({ data }: { data: PlatformHealthPayload }) {
  const navigate = useNavigate();
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate('/activity')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate('/activity');
        }
      }}
      className="group p-4 bg-card col-span-full cursor-pointer transition-all hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">
          Recent platform activity
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      {data.recentIncidents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.recentIncidents.map((row, i) => (
            <li
              key={`${row.ts}-${i}`}
              className="py-2 flex items-center gap-3 text-sm"
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground w-40 flex-shrink-0">
                {new Date(row.ts).toLocaleString()}
              </span>
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                {row.action}
              </span>
              <span className="text-foreground truncate">
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
          <h1 className="text-2xl font-semibold text-foreground">
            Platform Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
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
        <Card className="p-6 bg-card text-sm text-muted-foreground">
          Loading…
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Organizations"
            value={data.orgs.total}
            icon={<Building2 className="w-4 h-4" />}
            to="/organizations"
          />
          <MetricCard
            title="Frameworks activated"
            value={asNumberOrDash(data.frameworks.activated)}
            subtitle="From framework pool (PR-X7.5)"
            icon={<Activity className="w-4 h-4" />}
            to="/frameworks"
          />
          <MetricCard
            title="Pending framework requests"
            value={asNumberOrDash(data.frameworks.pendingRequests)}
            subtitle="From framework pool (PR-X7.5)"
            icon={<AlertTriangle className="w-4 h-4" />}
            to="/framework-requests"
          />
          <MetricCard
            title="Active support sessions"
            value={data.supportSessions.activeNow}
            subtitle={`${data.supportSessions.openedLast24h} opened in last 24h`}
            icon={<Briefcase className="w-4 h-4" />}
            to="/support-sessions"
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
