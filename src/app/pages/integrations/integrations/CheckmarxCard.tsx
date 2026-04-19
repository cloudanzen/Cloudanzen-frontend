import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  checkmarxService,
  CheckmarxIntegrationRecord,
} from '@/services/api/checkmarx';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function CheckmarxConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: CheckmarxIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [instanceUrl, setInstanceUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await checkmarxService.connect({
        instanceUrl: instanceUrl.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        label: label.trim() || undefined,
      });
      onConnected(res.data);
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.checkmarx.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
      >
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.checkmarx.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.checkmarx.connectDescription')}
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.checkmarx.instanceUrl')}
            </label>
            <input
              type="url"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://your-tenant.checkmarx.net"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.checkmarx.clientId')}
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="OAuth2 Client ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.checkmarx.clientSecret')}
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="OAuth2 Client Secret"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.shared.label')} {t('cards.shared.optional')}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production Checkmarx"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cards.shared.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#FF6B35] hover:bg-[#e0551f] text-white"
          >
            {loading
              ? t('cards.shared.connecting')
              : t('cards.checkmarx.connect')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CheckmarxCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: CheckmarxIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: CheckmarxIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try {
      await checkmarxService.runScan(id);
      onToast('success', t('cards.checkmarx.scanStarted'));
    } catch {
      onToast('error', t('cards.checkmarx.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.checkmarx.disconnectTitle'),
      description: t('cards.checkmarx.disconnectDescription', {
        target: label ?? id,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await checkmarxService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.checkmarx.disconnected'));
    } catch {
      onToast('error', t('cards.checkmarx.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
                  opacity="0.9"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Checkmarx</h3>
              <p className="text-sm text-gray-500">
                {t('cards.checkmarx.subtitle')}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.checkmarx.accountsConnected', {
                    count: accounts.length,
                  })
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
                  {account.label ?? account.instanceUrl}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.findingCount} finding
                  {account.findingCount !== 1 ? 's' : ''}
                  {account.lastSyncAt &&
                    ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}
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
                    : t('cards.checkmarx.scanNow')}
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
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF6B35] hover:bg-[#e0551f] text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.checkmarx.addAccount')
                : t('cards.checkmarx.connect')}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <CheckmarxConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.checkmarx.connected'));
            setShowConnectModal(false);
          }}
        />
      )}
    </>
  );
}
