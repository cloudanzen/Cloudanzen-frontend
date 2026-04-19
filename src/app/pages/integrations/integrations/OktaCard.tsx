import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { oktaService, OktaIntegrationRecord } from '@/services/api/okta';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function OktaIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 0C14.37 0 0 14.267 0 32s14.268 32 32 32 32-14.268 32-32S49.63 0 32 0zm0 48c-8.866 0-16-7.134-16-16s7.134-16 16-16 16 7.134 16 16-7.134 16-16 16z"
        fill="#007DC1"
      />
    </svg>
  );
}

function OktaConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: OktaIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [domain, setDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || !apiToken.trim()) {
      setError(t('cards.okta.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await oktaService.connect({
        domain: domain.trim(),
        apiToken: apiToken.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        onConnected(res.data);
        onClose();
      }
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ?? t('cards.okta.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.okta.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.okta.connectDescription')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.okta.domain')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.okta.domainHint')})
              </span>
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="mycompany.okta.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.okta.apiToken')}
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="SSWS token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1] font-mono"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.shared.label')}{' '}
              <span className="text-gray-400 font-normal">
                {t('cards.shared.optional')}
              </span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#007DC1] hover:bg-[#006aa8] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? t('cards.shared.connecting') : t('cards.okta.connect')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('cards.shared.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OktaCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: OktaIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: OktaIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try {
      await oktaService.runScan(id);
      onToast('success', t('cards.okta.scanStarted'));
    } catch {
      onToast('error', t('cards.okta.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.okta.disconnectTitle'),
      description: t('cards.okta.disconnectDescription', {
        target: label ?? 'Okta',
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await oktaService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.okta.disconnected'));
    } catch {
      onToast('error', t('cards.okta.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1">
              <OktaIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Okta</h3>
              <p className="text-sm text-gray-500">
                {t('cards.okta.subtitle')}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.shared.connectedCount', { count: accounts.length })
                : t('cards.shared.available')}
          </Badge>
        </div>
        {isConnected &&
          accounts.map((account) => (
            <div
              key={account.id}
              className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {account.label ?? account.domain}
                </p>
                <p className="text-xs text-gray-400">
                  {account.domain}
                  {account.lastSyncAt &&
                    ` · ${t('cards.okta.lastSync', { date: new Date(account.lastSyncAt).toLocaleString() })}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScan(account.id)}
                  disabled={scanningId === account.id}
                >
                  {scanningId === account.id
                    ? t('cards.shared.scanning')
                    : t('cards.shared.runScan')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(account.id, account.label)}
                  disabled={disconnectingId === account.id}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {disconnectingId === account.id
                    ? t('cards.shared.disconnecting')
                    : t('cards.shared.disconnect')}
                </Button>
              </div>
            </div>
          ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#007DC1] hover:bg-[#006aa8] text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.okta.addAccount')
                : t('cards.okta.connect')}
            </button>
          )}
        </div>
      </Card>
      {showModal && (
        <OktaConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.okta.connected'));
          }}
        />
      )}
    </>
  );
}
