import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  platformOpsService,
  type SupportSession,
} from '@/services/api/platformOps';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Clock, Ban, AlertCircle } from 'lucide-react';
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
            Time-limited customer-org access. Open sessions from Organizations →
            org detail → Open support session.
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
