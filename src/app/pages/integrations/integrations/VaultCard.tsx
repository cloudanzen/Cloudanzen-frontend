import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { vaultService, VaultIntegrationRecord } from '@/services/api/vault';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function VaultConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: VaultIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [vaultAddr, setVaultAddr] = useState('');
  const [token, setToken] = useState('');
  const [namespace, setNamespace] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await vaultService.connect({
        vaultAddr: vaultAddr.trim(),
        token: token.trim(),
        namespace: namespace.trim() || undefined,
        label: label.trim() || undefined,
      });
      onConnected(res.data);
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.vault.connectFailed'),
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
          {t('cards.vault.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.vault.connectDescription')}
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.vault.address')}
            </label>
            <input
              type="url"
              value={vaultAddr}
              onChange={(e) => setVaultAddr(e.target.value)}
              placeholder="https://vault.example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.vault.token')}
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="hvs.XXXXXXXXXXXX"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.vault.namespace')}{' '}
              <span className="text-gray-400 font-normal">
                {t('cards.vault.namespaceHint')}
              </span>
            </label>
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="admin/team"
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
              placeholder="e.g. Production Vault"
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
            className="bg-[#1C1C1C] hover:bg-black text-white"
          >
            {loading ? t('cards.shared.connecting') : t('cards.vault.connect')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function VaultCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: VaultIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: VaultIntegrationRecord) => void;
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
      await vaultService.runScan(id);
      onToast('success', t('cards.vault.scanStarted'));
    } catch {
      onToast('error', t('cards.vault.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.vault.disconnectTitle'),
      description: t('cards.vault.disconnectDescription', {
        target: label ?? id,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await vaultService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.vault.disconnected'));
    } catch {
      onToast('error', t('cards.vault.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93C9.33 17.79 7 14.5 7 11V7.18L12 5z"
                  opacity="0.9"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                HashiCorp Vault
              </h3>
              <p className="text-sm text-gray-500">
                {t('cards.vault.subtitle')}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.vault.instancesConnected', {
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
                  {account.label ?? account.vaultAddr}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.vaultAddr}
                  {account.namespace && ` · ns: ${account.namespace}`}
                  {` · ${t('cards.vault.findings', { count: account.findingCount })}`}
                  {account.lastSyncAt &&
                    ` · ${t('cards.vault.lastSync', { date: new Date(account.lastSyncAt).toLocaleString() })}`}
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
                    : t('cards.vault.scanNow')}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1C1C1C] hover:bg-black text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.vault.addInstance')
                : t('cards.vault.connect')}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <VaultConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.vault.connected'));
            setShowConnectModal(false);
          }}
        />
      )}
    </>
  );
}
