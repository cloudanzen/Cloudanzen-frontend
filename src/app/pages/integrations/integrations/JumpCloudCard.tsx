import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  jumpCloudService,
  JumpCloudIntegrationRecord,
} from '@/services/api/jumpcloud';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function JumpCloudConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: JumpCloudIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiToken.trim()) {
      setError(t('cards.jumpCloud.apiTokenRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await jumpCloudService.connect({
        apiToken: apiToken.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        onConnected(res.data);
        onClose();
      }
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.jumpCloud.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.jumpCloud.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.jumpCloud.connectDescription')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.jumpCloud.apiToken')}
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="JumpCloud API token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009DDC] font-mono"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009DDC]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#009DDC] hover:bg-[#0089c0] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t('cards.shared.connecting')
                : t('cards.jumpCloud.connect')}
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

export function JumpCloudCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: JumpCloudIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: JumpCloudIntegrationRecord) => void;
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
      await jumpCloudService.runScan(id);
      onToast('success', t('cards.jumpCloud.scanStarted'));
    } catch {
      onToast('error', t('cards.jumpCloud.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.jumpCloud.disconnectTitle'),
      description: t('cards.jumpCloud.disconnectDescription', {
        target: label ?? 'JumpCloud',
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await jumpCloudService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.jumpCloud.disconnected'));
    } catch {
      onToast('error', t('cards.jumpCloud.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#009DDC' }}
            >
              <span className="text-white font-bold text-xs">JC</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">JumpCloud</h3>
              <p className="text-sm text-gray-500">
                {t('cards.jumpCloud.subtitle')}
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
                  {account.label ?? t('cards.jumpCloud.defaultAccount')}
                </p>
                <p className="text-xs text-gray-400">
                  {account.lastSyncAt
                    ? t('cards.jumpCloud.lastSync', {
                        date: new Date(account.lastSyncAt).toLocaleString(),
                      })
                    : t('cards.jumpCloud.notYetSynced')}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#009DDC] hover:bg-[#0089c0] text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.jumpCloud.addAccount')
                : t('cards.jumpCloud.connect')}
            </button>
          )}
        </div>
      </Card>
      {showModal && (
        <JumpCloudConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.jumpCloud.connected'));
          }}
        />
      )}
    </>
  );
}
