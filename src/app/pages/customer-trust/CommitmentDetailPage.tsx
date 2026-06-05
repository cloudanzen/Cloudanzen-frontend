import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  customerTrustApi,
  type TrustCommitmentEventType,
  type TrustCommitmentStatus,
} from '@/services/api/customerTrust';

const STATUS_STYLE: Record<TrustCommitmentStatus, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  AT_RISK: 'border-amber-200 bg-amber-50 text-amber-700',
  BREACHED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXPIRED: 'border-slate-200 bg-slate-50 text-slate-600',
};

const EVENT_STYLE: Record<
  TrustCommitmentEventType,
  { tone: string; icon: React.ElementType }
> = {
  ATTESTED: { tone: 'bg-sky-50 text-sky-700', icon: CheckCircle2 },
  BREACHED: { tone: 'bg-rose-50 text-rose-700', icon: XCircle },
  REMEDIATED: { tone: 'bg-emerald-50 text-emerald-700', icon: Award },
  RENEWED: { tone: 'bg-amber-50 text-amber-700', icon: Clock },
};

export default function CommitmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [logging, setLogging] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['trust-commitment', id],
    queryFn: () => customerTrustApi.getCommitment(id!),
    enabled: !!id,
  });

  if (!id) return null;
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error instanceof Error ? error.message : 'Failed to load'}
        </div>
      </div>
    );
  }
  const c = data?.data;
  if (!c) return null;

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/customer-trust/commitments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> All commitments
      </Link>

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">{c.title}</h1>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[c.status]}`}
          >
            {c.status.replace('_', ' ').toLowerCase()}
          </span>
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">
            {c.category}
          </span>
        </div>
        {c.description && (
          <p className="mt-2 text-slate-600 max-w-3xl">{c.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Source">
          <span className="text-foreground">{c.source.toLowerCase()}</span>
          {c.sourceDocumentUrl && (
            <a
              href={c.sourceDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs mt-1 text-blue-600 hover:underline truncate"
            >
              View source document →
            </a>
          )}
        </Card>
        <Card label="Account">
          {c.account ? (
            <Link
              to={`/customer-trust/accounts/${c.account.id}`}
              className="text-foreground hover:underline"
            >
              {c.account.companyName ?? c.account.domain}
            </Link>
          ) : (
            <span className="text-muted-foreground">Global commitment</span>
          )}
        </Card>
        <Card label="Effective window">
          {new Date(c.effectiveFrom).toLocaleDateString()}{' '}
          {c.effectiveUntil
            ? `→ ${new Date(c.effectiveUntil).toLocaleDateString()}`
            : '→ no end date'}
        </Card>
      </div>

      <div className="rounded-xl border border-slate-200 bg-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">Timeline</h2>
          <Button size="sm" onClick={() => setLogging(true)}>
            Log event
          </Button>
        </div>
        {logging && (
          <div className="border-b border-slate-200 p-4">
            <EventLogger
              commitmentId={c.id}
              onCancel={() => setLogging(false)}
              onSaved={() => {
                setLogging(false);
                qc.invalidateQueries({ queryKey: ['trust-commitment', id] });
                qc.invalidateQueries({ queryKey: ['trust-commitments'] });
              }}
            />
          </div>
        )}
        <ul className="divide-y divide-slate-100">
          {c.events.map((ev) => {
            const m = EVENT_STYLE[ev.eventType];
            const Icon = m.icon;
            return (
              <li key={ev.id} className="px-5 py-3 flex items-start gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${m.tone}`}
                >
                  <Icon className="w-3 h-3" />
                  {ev.eventType.toLowerCase()}
                </span>
                <div className="flex-1">
                  {ev.notes && (
                    <p className="text-sm text-foreground">{ev.notes}</p>
                  )}
                  {ev.evidenceUrl && (
                    <a
                      href={ev.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Evidence →
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(ev.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
          {c.events.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              No events yet. Log an attestation, breach, remediation, or renewal
              to start the timeline.
            </li>
          )}
        </ul>
      </div>

      {(c.controlIds.length > 0 || c.policyIds.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {c.controlIds.length > 0 && (
            <Card label="Linked controls">
              <ul className="text-xs space-y-0.5">
                {c.controlIds.map((cid) => (
                  <li key={cid} className="font-mono text-muted-foreground">
                    {cid}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {c.policyIds.length > 0 && (
            <Card label="Linked policies">
              <ul className="text-xs space-y-0.5">
                {c.policyIds.map((pid) => (
                  <li key={pid} className="font-mono text-muted-foreground">
                    {pid}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function EventLogger({
  commitmentId,
  onCancel,
  onSaved,
}: {
  commitmentId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [eventType, setEventType] =
    useState<TrustCommitmentEventType>('ATTESTED');
  const [notes, setNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const mutation = useMutation({
    mutationFn: () =>
      customerTrustApi.logCommitmentEvent(commitmentId, {
        eventType,
        notes: notes || undefined,
        evidenceUrl: evidenceUrl || undefined,
      }),
    onSuccess: onSaved,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            'ATTESTED',
            'BREACHED',
            'REMEDIATED',
            'RENEWED',
          ] as TrustCommitmentEventType[]
        ).map((t) => {
          const m = EVENT_STYLE[t];
          const Icon = m.icon;
          return (
            <button
              key={t}
              onClick={() => setEventType(t)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                eventType === t
                  ? `${m.tone} ring-2 ring-offset-1 ring-fuchsia-300`
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.toLowerCase()}
            </button>
          );
        })}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Notes (optional)"
        className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
      />
      <input
        type="url"
        value={evidenceUrl}
        onChange={(e) => setEvidenceUrl(e.target.value)}
        placeholder="https://… (evidence link, optional)"
        className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Log event'}
        </Button>
      </div>
      {/* Unused but exported indirectly: ensure breach icon doesn't get
          tree-shaken in any future split. */}
      <AlertTriangle className="hidden" />
    </div>
  );
}
