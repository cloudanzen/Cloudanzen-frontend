import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  azureAdService,
  AzureAdIntegrationRecord,
} from '@/services/api/azuread';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function AzureAdIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.867 7.282l-4.733 9.533 8.333 9.66L8 28.23l24 .25zm-.934-3.762L8.067 12.613 0 26.223l6.867-.7z"
        fill="#035BDA"
      />
    </svg>
  );
}

function AzureAdConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: AzureAdIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setError(t('cards.azureAd.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await azureAdService.connect({
        tenantId: tenantId.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        onConnected(res.data);
        onClose();
      }
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.azureAd.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.azureAd.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.azureAd.connectDescription')}
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">
            User.Read.All
          </code>
          ,
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">
            Policy.Read.All
          </code>
          ,
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">
            Directory.Read.All
          </code>{' '}
          (application permissions).
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.azureAd.tenantId')}
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.azureAd.clientId')}
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.azureAd.clientSecret')}
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Client secret value"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono"
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
              placeholder="e.g. Production Tenant"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#0078D4] hover:bg-[#006abc] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t('cards.shared.connecting')
                : t('cards.azureAd.connect')}
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

export function AzureAdCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: AzureAdIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: AzureAdIntegrationRecord) => void;
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
      await azureAdService.runScan(id);
      onToast('success', t('cards.azureAd.scanStarted'));
    } catch {
      onToast('error', t('cards.azureAd.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.azureAd.disconnectTitle'),
      description: t('cards.azureAd.disconnectDescription', {
        target: label ?? 'Azure AD',
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await azureAdService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.azureAd.disconnected'));
    } catch {
      onToast('error', t('cards.azureAd.disconnectFailed'));
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
              <AzureAdIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Azure AD (Entra ID)
              </h3>
              <p className="text-sm text-gray-500">
                {t('cards.azureAd.subtitle')}
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
                  {account.label ?? account.tenantId}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.tenantId}
                  {account.lastSyncAt &&
                    ` · ${t('cards.azureAd.lastSync', { date: new Date(account.lastSyncAt).toLocaleString() })}`}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0078D4] hover:bg-[#006abc] text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.azureAd.addTenant')
                : t('cards.azureAd.connect')}
            </button>
          )}
        </div>
      </Card>
      {showModal && (
        <AzureAdConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.azureAd.connected'));
          }}
        />
      )}
    </>
  );
}
