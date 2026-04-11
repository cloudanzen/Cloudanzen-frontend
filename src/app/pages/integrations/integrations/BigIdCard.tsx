import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { bigIdService, BigIdIntegrationRecord } from '@/services/api/bigid';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function BigIdConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: BigIdIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!baseUrl.trim() || !apiToken.trim()) {
      setError(t('cards.bigId.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await bigIdService.connect({
        baseUrl: baseUrl.trim(),
        apiToken: apiToken.trim(),
        label: label.trim() || undefined,
      });
      onConnected(res.data);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.bigId.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.bigId.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.bigId.connectDescription')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.shared.baseUrl')}
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-bigid-instance.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.bigId.apiToken')}
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Bearer token from BigID Settings"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
              placeholder="e.g. Production BigID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t('cards.shared.connecting')
                : t('cards.bigId.connect')}
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

export function BigIdCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: BigIdIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: BigIdIntegrationRecord) => void;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const isConnected = accounts.length > 0;

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await bigIdService.runScan(integrationId);
      onToast('success', t('cards.bigId.scanStarted'));
    } catch {
      onToast('error', t('cards.bigId.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(
    integrationId: string,
    label: string | null,
    baseUrl: string,
  ) {
    const name = label ?? baseUrl;
    const confirmed = await confirm({
      title: t('cards.bigId.disconnectTitle'),
      description: t('cards.bigId.disconnectDescription', { target: name }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await bigIdService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', t('cards.bigId.disconnected'));
    } catch {
      onToast('error', t('cards.bigId.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A2B6D] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
              >
                <path d="M4 8h24v3H4zM4 14.5h16v3H4zM4 21h20v3H4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">BigID</h3>
              <p className="text-sm text-gray-500">
                {t('cards.bigId.subtitle')}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.bigId.instancesConnected', {
                    count: accounts.length,
                  })
                : t('cards.shared.available')}
          </Badge>
        </div>

        {/* Connected instance rows */}
        {isConnected &&
          accounts.map((account) => (
            <div
              key={account.id}
              className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {account.label ?? account.baseUrl}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.dataSourceCount} data source
                  {account.dataSourceCount !== 1 ? 's' : ''}
                  {account.latestSummary &&
                    ` · ${account.latestSummary.piiCount.toLocaleString()} PII records`}
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
                    : t('cards.bigId.scanNow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDisconnect(account.id, account.label, account.baseUrl)
                  }
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

        {/* Action button */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1A2B6D] hover:bg-[#14225a] text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.bigId.addInstance')
                : t('cards.bigId.connect')}
            </button>
          )}
        </div>
      </Card>

      {showConnectModal && (
        <BigIdConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.bigId.connected'));
          }}
        />
      )}
    </>
  );
}
