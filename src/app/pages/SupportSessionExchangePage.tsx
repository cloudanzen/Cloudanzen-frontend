import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { apiClient, ApiError } from '@/services/api/client';
import { writeImpersonationSessionId } from '@/services/impersonationStorage';
import { Card } from '@/app/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

// Mounted in the TENANT tree at /support-session/exchange. Platform admin
// gets here in a new tab via the exchangeUrl returned by
// POST /api/platform/support-sessions. We exchange the one-time code for
// an aud='tenant_impersonation' JWT (set as __Host-impersonation-token
// cookie by the backend) and the SupportSession id we stash in
// sessionStorage so the API client adds the X-Impersonation-Session header
// (per-tab opt-in — see services/impersonationStorage.ts).
interface ExchangeResponse {
  sessionId: string;
  orgName?: string | null;
  adminEmail: string;
  reason: string;
  expiresAt: number;
  organizationId: string;
}

export function SupportSessionExchangePage() {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<{ key: string } | { text: string } | null>(
    null,
  );
  const [status, setStatus] = useState<'exchanging' | 'success' | 'error'>(
    'exchanging',
  );

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError({ key: 'supportSessionExchange.missingCode' });
      setStatus('error');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.post<ExchangeResponse>(
          '/api/platform/support-sessions/exchange',
          { code },
        );
        if (cancelled) return;
        writeImpersonationSessionId(res.sessionId);
        setStatus('success');
        // Land the operator on the tenant home so the impersonation cookie +
        // sessionStorage flag are both in scope for subsequent requests.
        navigate('/', { replace: true });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? { text: err.message }
            : { key: 'supportSessionExchange.exchangeFailed' },
        );
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white">
        <div className="flex flex-col items-center text-center">
          {status === 'error' ? (
            <>
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <h1 className="text-lg font-semibold text-gray-900 mb-2">
                {t('supportSessionExchange.heading')}
              </h1>
              <p className="text-sm text-gray-600">
                {error && ('key' in error ? t(error.key) : error.text)}
              </p>
            </>
          ) : (
            <>
              <Shield className="w-10 h-10 text-blue-600 mb-3" />
              <h1 className="text-lg font-semibold text-gray-900 mb-2">
                {t('supportSessionExchange.starting')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('supportSessionExchange.waiting')}
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
