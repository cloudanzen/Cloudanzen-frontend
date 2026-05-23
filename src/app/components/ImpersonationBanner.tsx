import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api/client';
import { clearImpersonationSessionId } from '@/services/impersonationStorage';
import { useImpersonationContext } from '@/app/hooks/useImpersonationContext';
import { Button } from '@/app/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

// Persistent red banner mounted in the tenant shell. Visible only when the
// /api/auth/me response carries a non-null `impersonation` field (backend
// populates it from request.supportSession when the request arrived with
// a valid aud='tenant_impersonation' JWT). Customers don't see it — they
// don't have a SupportSession in their normal sessions.
export function ImpersonationBanner() {
  const ctx = useImpersonationContext();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ctx) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ctx]);

  if (!ctx) return null;

  const remainingMs = Math.max(0, ctx.expiresAt - now);
  const remainingMin = Math.floor(remainingMs / 60_000);
  const remainingSec = Math.floor((remainingMs % 60_000) / 1000);
  const countdown =
    remainingMs <= 0
      ? 'expired'
      : `${remainingMin}m ${String(remainingSec).padStart(2, '0')}s`;

  const handleExit = async () => {
    try {
      await apiClient.post('/api/auth/impersonation/end', {});
    } catch {
      // Best-effort — clear local state regardless so the tab stops
      // sending the impersonation header.
    }
    clearImpersonationSessionId();
    toast.success('Support session ended');
    // Reload to refresh auth state + dismiss the banner.
    window.location.href = '/';
  };

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold flex-shrink-0">
          Support session active
        </span>
        <span className="opacity-90 truncate">
          — <strong>{ctx.adminEmail}</strong> viewing as{' '}
          <strong>{ctx.effectiveRole}</strong>. Reason:{' '}
          <span className="italic">{ctx.reason}</span>
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-mono opacity-90">{countdown}</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExit}
          className="gap-1 bg-white text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-3 h-3" />
          Exit
        </Button>
      </div>
    </div>
  );
}
