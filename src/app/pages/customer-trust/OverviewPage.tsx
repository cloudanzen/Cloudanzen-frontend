import { useEffect, useState } from 'react';
import {
  Activity,
  Building2,
  CircleDollarSign,
  Download,
  Eye,
  FileSearch,
  PiggyBank,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  customerTrustApi,
  type TrustOverviewKpis,
} from '@/services/api/customerTrust';

const WINDOW_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function CustomerTrustOverviewPage() {
  const [windowDays, setWindowDays] = useState(30);
  const [kpis, setKpis] = useState<TrustOverviewKpis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    customerTrustApi
      .overviewKpis(windowDays)
      .then((res) => {
        if (cancelled) return;
        setKpis(res.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Customer Trust Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            How often prospects engage with your Trust Center and what they do
            there.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setWindowDays(opt.value)}
              className={`rounded-md border px-3 py-1.5 transition-colors ${
                windowDays === opt.value
                  ? 'border-fuchsia-400 bg-fuchsia-50 font-semibold text-fuchsia-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {kpis && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Eye} label="Page views" value={kpis.pageViews} />
          <Kpi icon={Activity} label="Sessions" value={kpis.sessions} />
          <Kpi icon={Download} label="Downloads" value={kpis.downloads} />
          <Kpi
            icon={FileSearch}
            label="Access requests"
            value={kpis.accessRequests}
          />
          <Kpi
            icon={Building2}
            label="Active accounts"
            value={kpis.activeAccounts}
          />
          <Kpi
            icon={TrendingUp}
            label="New accounts"
            value={kpis.newAccounts}
          />
          <Kpi
            icon={Users}
            label="Identified viewers"
            value={kpis.identifiedViewers}
          />
          <Kpi
            icon={UserCheck}
            label="Conversion rate"
            value={`${kpis.conversionRate}%`}
            hint="Identified viewers / sessions"
          />
          <Kpi
            icon={CircleDollarSign}
            label="Revenue influenced"
            value={formatUsd(kpis.revenueInfluencedUsd)}
            hint="Total ARR across CRM accounts active in window"
          />
          <Kpi
            icon={PiggyBank}
            label="Open pipeline"
            value={formatUsd(kpis.openPipelineUsd)}
            hint="Open opportunities on visited accounts"
          />
          <Kpi
            icon={Trophy}
            label="Closed-won"
            value={formatUsd(kpis.closedWonUsd)}
            hint="Closed-won ARR on visited accounts"
          />
        </div>
      )}
    </div>
  );
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
