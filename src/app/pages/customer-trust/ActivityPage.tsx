import { useEffect, useState } from 'react';
import {
  customerTrustApi,
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

export default function CustomerTrustActivityPage() {
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
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

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

      {nextCursor && (
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
