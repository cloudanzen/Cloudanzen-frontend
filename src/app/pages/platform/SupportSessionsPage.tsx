import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  platformOpsService,
  type SupportSession,
  type SupportRole,
} from '@/services/api/platformOps';
import { adminService } from '@/services/api/admin';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Clock,
  Ban,
  AlertCircle,
  Plus,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/services/api/client';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function StatusBadge({ status }: { status: SupportSession['status'] }) {
  const cls =
    status === 'ACTIVE'
      ? 'bg-red-100 text-red-700'
      : status === 'EXPIRED'
        ? 'bg-gray-100 text-gray-600'
        : 'bg-blue-100 text-blue-700';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${cls}`}>
      {status}
    </span>
  );
}

function countdown(expiresAt: string, now: number): string {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  if (remaining === 0) return 'expired';
  const m = Math.floor(remaining / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

// Live tick once per second so the countdown column updates. Pauses when
// the document is hidden so the platform tab doesn't burn CPU when no
// operator is looking.
function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      stop();
      id = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    if (document.visibilityState === 'visible') start();
    const onVis = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      stop();
    };
  }, [intervalMs]);
  return now;
}

export function SupportSessionsPage() {
  const qc = useQueryClient();
  const confirm = useConfirmDialog();
  const [showActive, setShowActive] = useState(true);
  const now = useNow();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform', 'support-sessions'],
    queryFn: () => platformOpsService.listSessions(),
    refetchInterval: 30_000,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => platformOpsService.endSession(id),
    onSuccess: () => {
      toast.success('Session revoked');
      qc.invalidateQueries({ queryKey: ['platform', 'support-sessions'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Revoke failed');
    },
  });

  const sessions = data?.sessions ?? [];
  const visible = sessions.filter((s) =>
    showActive ? s.status === 'ACTIVE' : true,
  );

  const onRevokeClick = async (s: SupportSession) => {
    const ok = await confirm({
      title: 'Revoke this support session?',
      description: `Closes the impersonation cookie for ${s.platformAdminEmail} immediately. Cannot be undone.`,
      confirmLabel: 'Revoke',
      variant: 'destructive',
    });
    if (ok) revoke.mutate(s.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Support sessions
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Time-limited customer-org access. Open a session here or from
            Organizations → org detail.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showActive}
            onChange={(e) => setShowActive(e.target.checked)}
          />
          Active only
        </label>
      </div>

      <NewSessionLauncher />

      {isLoading ? (
        <Card className="p-6 bg-white text-sm text-gray-500">Loading…</Card>
      ) : isError ? (
        <Card className="p-4 bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Failed to load sessions.
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-6 bg-white text-sm text-gray-500">
          {showActive ? 'No active sessions.' : 'No sessions on record.'}
        </Card>
      ) : (
        <Card className="bg-white divide-y divide-gray-100">
          {visible.map((s) => (
            <div
              key={s.id}
              className="p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {s.platformAdminEmail}
                  </span>
                  <span className="text-xs text-gray-500">→</span>
                  <span className="font-mono text-xs text-gray-700">
                    {s.organizationId.slice(0, 8)}
                  </span>
                  <StatusBadge status={s.status} />
                  <span className="text-xs text-gray-500">
                    {s.effectiveRole}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Reason: <span className="italic">{s.reason}</span>
                </div>
                <div className="text-xs text-gray-500 flex gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    started {new Date(s.startedAt).toLocaleString()}
                  </span>
                  <span>·</span>
                  <span>
                    {s.status === 'ACTIVE' ? (
                      <>expires in {countdown(s.expiresAt, now)}</>
                    ) : s.endedAt ? (
                      <>ended {new Date(s.endedAt).toLocaleString()}</>
                    ) : (
                      <>expired {new Date(s.expiresAt).toLocaleString()}</>
                    )}
                  </span>
                </div>
              </div>
              {s.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                  onClick={() => onRevokeClick(s)}
                  disabled={revoke.isPending}
                >
                  <Ban className="w-3.5 h-3.5" />
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── New Session Launcher (with org picker) ────────────────────────────────────
//
// Same flow as the org-detail-dialog launcher, but the operator picks
// the org from a dropdown here (since they're not in org context).

const DURATIONS: Array<{ value: 900 | 3600 | 14400; label: string }> = [
  { value: 900, label: '15 min' },
  { value: 3600, label: '1 hour' },
  { value: 14400, label: '4 hours' },
];
const ROLES: SupportRole[] = [
  'ORG_ADMIN',
  'SECURITY_OWNER',
  'AUDITOR',
  'CONTRIBUTOR',
  'VIEWER',
];

function NewSessionLauncher() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [orgId, setOrgId] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<900 | 3600 | 14400>(3600);
  const [role, setRole] = useState<SupportRole>('ORG_ADMIN');

  // Reuses /api/admin/organizations — same endpoint Organizations page hits.
  // Loaded lazily so the dashboard payload stays small for users that
  // never click "New session".
  const { data: orgsRes, isLoading: orgsLoading } = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: () => adminService.listOrganizations(),
    enabled: expanded,
  });
  const orgs = orgsRes?.data ?? [];

  const create = useMutation({
    mutationFn: () =>
      platformOpsService.createSession({
        organizationId: orgId,
        reason: reason.trim(),
        durationSeconds: duration,
        effectiveRole: role,
      }),
    onSuccess: (res) => {
      toast.success('Session opened — opening tab');
      window.open(res.exchangeUrl, '_blank', 'noopener');
      setOrgId('');
      setReason('');
      setExpanded(false);
      qc.invalidateQueries({ queryKey: ['platform', 'support-sessions'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to open');
    },
  });

  if (!expanded) {
    return (
      <Card className="p-3 bg-white">
        <Button onClick={() => setExpanded(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          New support session
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-gray-900">New support session</h2>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setReason('');
            setOrgId('');
          }}
          className="text-xs text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Organization
        </label>
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 bg-white"
          disabled={orgsLoading}
        >
          <option value="">{orgsLoading ? 'Loading…' : 'Select an org'}</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Reason (required)
        </label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Customer ticket #1234 — investigating failed import"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Duration
          </label>
          <div className="flex gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className={`px-2 py-1 text-xs rounded border ${
                  duration === d.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Effective role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as SupportRole)}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Button
          size="sm"
          onClick={() => create.mutate()}
          disabled={create.isPending || !orgId || reason.trim().length === 0}
          className="gap-1"
        >
          {create.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ExternalLink className="w-3.5 h-3.5" />
          )}
          Open session
        </Button>
      </div>
    </Card>
  );
}
