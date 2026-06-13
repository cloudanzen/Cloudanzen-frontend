import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import {
  customerTrustApi,
  type TrustActivityInsights,
  type TrustEventRow,
} from '@/services/api/customerTrust';

const ACTION_OPTIONS = [
  { label: 'All actions', value: '' },
  { label: 'Page view', value: 'PAGE_VIEW' },
  { label: 'Download', value: 'DOC_DOWNLOAD' },
  { label: 'Access request', value: 'ACCESS_REQUEST' },
  { label: 'Questionnaire', value: 'QUESTIONNAIRE_REQUEST' },
  { label: 'Subscribe', value: 'SUBSCRIBE' },
  { label: 'NDA accepted', value: 'NDA_ACCEPTED' },
];

type Tab = 'events' | 'insights';

export default function CustomerTrustActivityPage() {
  const [tab, setTab] = useState<Tab>('events');
  const [rows, setRows] = useState<TrustEventRow[]>([]);
  const [action, setAction] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    customerTrustApi
      .activity({ action: action || undefined, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setNextCursor(res.nextCursor);
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
  }, [action]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await customerTrustApi.activity({
        action: action || undefined,
        cursor: nextCursor,
        limit: 50,
      });
      setRows((prev) => [...prev, ...res.data]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load more failed');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground">
            Every page view, download, and access request on your public Trust
            Center.
          </p>
        </div>
        {tab === 'events' && (
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-md border border-slate-300 bg-card px-3 py-2 text-sm focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex border-b border-slate-200 text-sm">
        <TabButton
          active={tab === 'events'}
          onClick={() => setTab('events')}
          label="Events"
        />
        <TabButton
          active={tab === 'insights'}
          onClick={() => setTab('insights')}
          label="AI insights"
          icon={<Sparkles className="h-3.5 w-3.5" />}
        />
      </div>

      {tab === 'insights' && <InsightsPanel />}

      {tab === 'events' && error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {tab === 'events' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Viewer</Th>
                <Th>Location</Th>
                <Th>Action</Th>
                <Th>Resource</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <Td>
                    {row.viewer?.email ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {row.viewer.name ?? row.viewer.email}
                        </span>
                        {row.account?.domain && (
                          <span className="text-xs text-muted-foreground">
                            {row.account.companyName ?? row.account.domain}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Public view</span>
                    )}
                  </Td>
                  <Td>
                    {row.session?.country ? (
                      <span className="text-foreground">
                        {row.session.country}
                        {row.session.city ? ` · ${row.session.city}` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                      {row.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </Td>
                  <Td>
                    {row.resourceType ? (
                      <span className="text-foreground">
                        {row.resourceType.toLowerCase()}
                        {row.resourceId
                          ? ` · ${row.resourceId.slice(0, 8)}…`
                          : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>{new Date(row.createdAt).toLocaleString()}</Td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No activity yet. Visit your public Trust Center to generate
                    events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'events' && nextCursor && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-md border border-slate-300 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-foreground">{children}</td>;
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-2 font-medium transition-colors ${
        active
          ? 'border-fuchsia-500 text-fuchsia-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InsightsPanel() {
  const [windowDays, setWindowDays] = useState(30);
  const [data, setData] = useState<TrustActivityInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = refreshTick > 0;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    customerTrustApi
      .activityInsights(windowDays, refresh)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load insights',
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [windowDays, refreshTick]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setWindowDays(d)}
              className={`rounded-md border px-3 py-1.5 ${
                windowDays === d
                  ? 'border-fuchsia-400 bg-fuchsia-50 font-semibold text-fuchsia-700'
                  : 'border-slate-300 bg-card text-slate-700 hover:bg-slate-50'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRefreshTick((n) => n + 1)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-card px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Generating insights…</p>
      )}

      {data && (
        <div className="space-y-4">
          <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/50 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-fuchsia-600" />
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-foreground">
                  {data.summary}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {data.cached ? 'Cached · ' : ''}
                  Generated {new Date(data.generatedAt).toLocaleString()} ·{' '}
                  {data.model}
                </p>
              </div>
            </div>
          </div>

          {data.suggestions.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-card p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Suggested actions
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {data.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.accounts.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-card">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Account</Th>
                    <Th>Visits</Th>
                    <Th>Downloads</Th>
                    <Th>Narrative</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.accounts.map((a) => (
                    <tr key={a.accountId} className="hover:bg-slate-50">
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {a.companyName ?? a.domain}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {a.domain}
                          </span>
                        </div>
                      </Td>
                      <Td>{a.visits}</Td>
                      <Td>{a.downloads}</Td>
                      <Td>
                        <span className="text-sm text-muted-foreground">
                          {a.narrative}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
