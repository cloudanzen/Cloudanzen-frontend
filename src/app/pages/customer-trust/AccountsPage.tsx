import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Building2, Search } from 'lucide-react';
import {
  customerTrustApi,
  type TrustAccountRow,
} from '@/services/api/customerTrust';

export default function CustomerTrustAccountsPage() {
  const [rows, setRows] = useState<TrustAccountRow[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    customerTrustApi
      .accounts()
      .then((res) => {
        if (!cancelled) setRows(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = filter
    ? rows.filter((r) => {
        const f = filter.toLowerCase();
        return (
          r.domain.toLowerCase().includes(f) ||
          (r.companyName ?? '').toLowerCase().includes(f)
        );
      })
    : rows;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Every company that has interacted with your Trust Center.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by domain or company"
          className="w-full rounded-md border border-slate-300 bg-card py-2 pl-9 pr-3 text-sm focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-card">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>Name</Th>
              <Th>Auto-approval</Th>
              <Th>NDA bypass</Th>
              <Th>Active viewers</Th>
              <Th>Events</Th>
              <Th>Last active</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <Td>
                  <Link
                    to={`/customer-trust/accounts/${row.id}`}
                    className="flex items-center gap-3 font-medium text-foreground hover:text-fuchsia-700"
                  >
                    {row.logoUrl ? (
                      <img
                        src={row.logoUrl}
                        alt=""
                        className="h-6 w-6 rounded"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-slate-400" />
                    )}
                    <span className="flex flex-col">
                      <span>{row.companyName ?? row.domain}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.domain}
                      </span>
                    </span>
                  </Link>
                </Td>
                <Td>
                  <Pill on={row.autoApproveAll} />
                </Td>
                <Td>
                  <Pill on={row.bypassNda} />
                </Td>
                <Td>{row._count.viewers}</Td>
                <Td>{row._count.events}</Td>
                <Td>{formatRelative(row.lastActiveAt)}</Td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No accounts yet. Account rows appear when a public-portal
                  visitor identifies themselves (submits an access request,
                  signs an NDA, or subscribes to updates).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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

function Pill({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      On
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      Off
    </span>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}
