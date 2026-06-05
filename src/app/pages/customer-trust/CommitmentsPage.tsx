import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  customerTrustApi,
  type TrustCommitmentCategory,
  type TrustCommitmentRow,
  type TrustCommitmentSource,
  type TrustCommitmentStatus,
} from '@/services/api/customerTrust';

const STATUS_STYLE: Record<TrustCommitmentStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  AT_RISK: 'bg-amber-50 text-amber-700',
  BREACHED: 'bg-rose-50 text-rose-700',
  EXPIRED: 'bg-slate-100 text-slate-600',
};

const STATUS_ICON: Record<TrustCommitmentStatus, React.ElementType> = {
  ACTIVE: CheckCircle2,
  AT_RISK: AlertTriangle,
  BREACHED: XCircle,
  EXPIRED: Clock,
};

export default function CustomerTrustCommitmentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<TrustCommitmentStatus | 'ALL'>('ALL');
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-commitments', filter],
    queryFn: () =>
      customerTrustApi.listCommitments(
        filter === 'ALL' ? {} : { status: filter },
      ),
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<TrustCommitmentStatus, number> = {
      ACTIVE: 0,
      AT_RISK: 0,
      BREACHED: 0,
      EXPIRED: 0,
    };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commitments</h1>
          <p className="text-sm text-muted-foreground">
            Per-customer SLAs and contractual promises. Log breach + remediation
            events to keep the timeline auditor-ready.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New commitment
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 text-sm">
        <StatusFilter
          label="Active"
          count={counts.ACTIVE}
          active={filter === 'ACTIVE'}
          tone="emerald"
          onClick={() => setFilter(filter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        />
        <StatusFilter
          label="At risk"
          count={counts.AT_RISK}
          active={filter === 'AT_RISK'}
          tone="amber"
          onClick={() => setFilter(filter === 'AT_RISK' ? 'ALL' : 'AT_RISK')}
        />
        <StatusFilter
          label="Breached"
          count={counts.BREACHED}
          active={filter === 'BREACHED'}
          tone="rose"
          onClick={() => setFilter(filter === 'BREACHED' ? 'ALL' : 'BREACHED')}
        />
        <StatusFilter
          label="Expired"
          count={counts.EXPIRED}
          active={filter === 'EXPIRED'}
          tone="slate"
          onClick={() => setFilter(filter === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
        />
      </div>

      {creating && (
        <CommitmentEditor
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ['trust-commitments'] });
          }}
        />
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading commitments…</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-card">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Account</Th>
              <Th>Effective until</Th>
              <Th>Source</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <CommitmentRow key={row.id} row={row} />
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No commitments yet. Click &quot;New commitment&quot; to track
                  an SLA or promise.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommitmentRow({ row }: { row: TrustCommitmentRow }) {
  const Icon = STATUS_ICON[row.status];
  return (
    <tr className="hover:bg-slate-50">
      <Td>
        <Link
          to={`/customer-trust/commitments/${row.id}`}
          className="font-medium text-foreground hover:text-fuchsia-700"
        >
          {row.title}
        </Link>
      </Td>
      <Td>
        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">
          {row.category}
        </span>
      </Td>
      <Td>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[row.status]}`}
        >
          <Icon className="w-3 h-3" />
          {row.status.replace('_', ' ').toLowerCase()}
        </span>
      </Td>
      <Td>
        {row.account ? (
          <Link
            to={`/customer-trust/accounts/${row.account.id}`}
            className="text-foreground hover:underline"
          >
            {row.account.companyName ?? row.account.domain}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">Global</span>
        )}
      </Td>
      <Td>
        {row.effectiveUntil ? (
          new Date(row.effectiveUntil).toLocaleDateString()
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </Td>
      <Td>
        <span className="text-xs text-muted-foreground">
          {row.source.toLowerCase()}
        </span>
      </Td>
    </tr>
  );
}

function StatusFilter({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  onClick: () => void;
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-shadow ${tones[tone]} ${
        active ? 'ring-2 ring-offset-2 ring-fuchsia-300' : ''
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{count}</p>
    </button>
  );
}

function CommitmentEditor({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TrustCommitmentCategory>('SLA');
  const [source, setSource] = useState<TrustCommitmentSource>('POLICY');
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      customerTrustApi.createCommitment({
        title,
        description: description || undefined,
        category,
        source,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveUntil: effectiveUntil
          ? new Date(effectiveUntil).toISOString()
          : null,
      }),
    onSuccess: onSaved,
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Save failed'),
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-card p-5 space-y-3">
      <h3 className="font-semibold">New commitment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="c-title">Title</Label>
          <Input
            id="c-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="99.9% uptime"
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="c-desc">Description (optional)</Label>
          <textarea
            id="c-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-cat">Category</Label>
          <select
            id="c-cat"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as TrustCommitmentCategory)
            }
            className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
          >
            <option>SLA</option>
            <option>SECURITY</option>
            <option>PRIVACY</option>
            <option>OPERATIONAL</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-src">Source</Label>
          <select
            id="c-src"
            value={source}
            onChange={(e) => setSource(e.target.value as TrustCommitmentSource)}
            className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
          >
            <option>CONTRACT</option>
            <option>POLICY</option>
            <option>MANUAL</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-from">Effective from</Label>
          <Input
            id="c-from"
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-until">Effective until (optional)</Label>
          <Input
            id="c-until"
            type="date"
            value={effectiveUntil}
            onChange={(e) => setEffectiveUntil(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !title.trim()}
        >
          {mutation.isPending ? 'Saving…' : 'Save commitment'}
        </Button>
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
