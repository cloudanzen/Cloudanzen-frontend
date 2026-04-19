import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { redashService, RedashIntegrationRecord } from '@/services/api/redash';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function RedashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="200" height="200" rx="36" fill="#FF6B35" />
      <path
        d="M40 155l30-60 30 30 25-45 35 75H40z"
        fill="white"
        opacity="0.9"
      />
      <circle cx="70" cy="95" r="8" fill="white" />
      <circle cx="100" cy="125" r="8" fill="white" />
      <circle cx="125" cy="80" r="8" fill="white" />
    </svg>
  );
}

function RedashConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: RedashIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!baseUrl.trim() || !apiKey.trim()) {
      setError(t('cards.redash.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await redashService.connect({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        const accountsRes = await redashService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(
          (a) => a.baseUrl === baseUrl.trim().replace(/\/$/, ''),
        );
        if (newAccount) onConnected(newAccount);
        else
          onConnected({
            id: res.data.id,
            baseUrl: res.data.baseUrl,
            label: res.data.label,
            status: res.data.status,
            lastScanAt: null,
            createdAt: res.data.createdAt,
            users: [],
            dataSources: [],
          });
        onClose();
      }
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.redash.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.redash.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          {t('cards.redash.connectDescription')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.redash.instanceUrl')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.redash.instanceUrlHint')})
              </span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://redash.example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.shared.apiKey')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.redash.adminUser')})
              </span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Redash API Key"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] font-mono"
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
              placeholder="e.g. Production Analytics"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#e55c28] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t('cards.shared.connecting')
                : t('cards.redash.connect')}
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

export function RedashCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: RedashIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: RedashIntegrationRecord) => void;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await redashService.runScan(integrationId);
      onToast('success', t('cards.redash.scanStarted'));
    } catch {
      onToast('error', t('cards.redash.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(
    integrationId: string,
    label: string | null,
    baseUrl: string,
  ) {
    const confirmed = await confirm({
      title: t('cards.redash.disconnectTitle'),
      description: t('cards.redash.disconnectDescription', {
        target: label ?? baseUrl,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await redashService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', t('cards.redash.disconnected'));
    } catch {
      onToast('error', t('cards.redash.disconnectFailed'));
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
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <RedashIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Redash</h3>
              <p className="text-sm text-gray-500">
                {t('cards.redash.subtitle')}
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

        {/* Connected accounts */}
        {isConnected &&
          accounts.map((account) => {
            const activeUsers = account.users.filter((u) => u.isActive).length;
            const totalUsers = account.users.length;
            const dsSources = account.dataSources.length;
            return (
              <div
                key={account.id}
                className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {account.label ?? account.baseUrl}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {account.baseUrl}
                    {totalUsers > 0 &&
                      ` · ${t('cards.redash.userSummary', { active: activeUsers, total: totalUsers })}`}
                    {dsSources > 0 &&
                      ` · ${t('cards.redash.dataSources', { count: dsSources })}`}
                    {account.lastScanAt &&
                      ` · ${t('cards.redash.lastScan', { date: new Date(account.lastScanAt).toLocaleString() })}`}
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
                    onClick={() =>
                      handleDisconnect(
                        account.id,
                        account.label,
                        account.baseUrl,
                      )
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
            );
          })}

        {/* Action button */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF6B35] hover:bg-[#e55c28] text-white text-sm font-medium"
            >
              <RedashIcon className="w-4 h-4" />
              {isConnected
                ? t('cards.redash.addInstance')
                : t('cards.redash.connect')}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <RedashConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.redash.connected'));
          }}
        />
      )}
    </>
  );
}
