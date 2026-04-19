import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  opsgenieService,
  OpsgenieIntegrationRecord,
} from '@/services/api/opsgenie';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function OpsgenieConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: OpsgenieIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState('us');
  const [label, setLabel] = useState('');
  const [slaHours, setSlaHours] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError(t('cards.opsgenie.apiKeyRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await opsgenieService.connect({
        apiKey: apiKey.trim(),
        region,
        label: label.trim() || undefined,
        slaHours: Number(slaHours) || 4,
      });
      onConnected(res.data);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.opsgenie.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.opsgenie.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.opsgenie.connectDescription')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.shared.apiKey')}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.opsgenie.region')}
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="us">US</option>
              <option value="eu">EU</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.opsgenie.slaHours')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.opsgenie.slaHint')})
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="72"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
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
              placeholder="e.g. Production Opsgenie"
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
                : t('cards.opsgenie.connect')}
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

export function OpsgenieCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: OpsgenieIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: OpsgenieIntegrationRecord) => void;
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
      await opsgenieService.runScan(id);
      onToast('success', t('cards.opsgenie.scanStarted'));
    } catch {
      onToast('error', t('cards.opsgenie.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.opsgenie.disconnectTitle'),
      description: t('cards.opsgenie.disconnectDescription', {
        target: label ?? id,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await opsgenieService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.opsgenie.disconnected'));
    } catch {
      onToast('error', t('cards.opsgenie.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2D6AE7] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6"
                viewBox="0 0 32 32"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="16" cy="16" r="8" fill="white" opacity="0.9" />
                <path
                  d="M16 8a8 8 0 1 0 0 16A8 8 0 0 0 16 8zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"
                  fill="#2D6AE7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Opsgenie</h3>
              <p className="text-sm text-gray-500">
                {t('cards.opsgenie.subtitle')}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.opsgenie.instancesConnected', {
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
                  {account.label ??
                    `Opsgenie (${account.region.toUpperCase()})`}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.incidentCount} alert
                  {account.incidentCount !== 1 ? 's' : ''}
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
                    : t('cards.opsgenie.scanNow')}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#2D6AE7] hover:bg-[#2158c4] text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.opsgenie.addAccount')
                : t('cards.opsgenie.connect')}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <OpsgenieConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.opsgenie.connected'));
          }}
        />
      )}
    </>
  );
}
