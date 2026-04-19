import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { gcpService, GcpIntegrationRecord } from '@/services/api/gcp';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function GcpConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: GcpIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [keyJson, setKeyJson] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await gcpService.connect({
        keyJson: keyJson.trim(),
        label: label.trim() || undefined,
      });
      onConnected(res.data);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ?? t('cards.gcp.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-1">{t('cards.gcp.connect')}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.gcp.connectDescription')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              {t('cards.shared.label')} {t('cards.shared.optional')}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('cards.gcp.labelPlaceholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              {t('cards.gcp.serviceAccountKeyJson')} *
            </label>
            <textarea
              value={keyJson}
              onChange={(e) => setKeyJson(e.target.value)}
              placeholder={t('cards.gcp.keyJsonPlaceholder')}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              {t('cards.shared.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
            >
              {loading ? t('cards.shared.connecting') : t('cards.gcp.connect')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GcpCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: GcpIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: GcpIntegrationRecord) => void;
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
      await gcpService.runScan(id);
      onToast('success', t('cards.gcp.scanStarted'));
    } catch {
      onToast('error', t('cards.gcp.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.gcp.disconnectTitle'),
      description: t('cards.gcp.disconnectDescription', {
        target: label ?? id,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await gcpService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.gcp.disconnected'));
    } catch {
      onToast('error', t('cards.gcp.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 6.5l3 5.2-3 5.2-3-5.2z" fill="#EA4335" />
                <path d="M6.5 17.5h11L15 12.5l-3 5.2-3-5.2z" fill="#FBBC05" />
                <path d="M15 12.5l2.5-4.5H6.5L9 12.5z" fill="#4285F4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Google Cloud (GCP)
              </h3>
              <p className="text-sm text-gray-500">{t('cards.gcp.subtitle')}</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.gcp.projectsConnected', { count: accounts.length })
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
                  {account.label ?? account.projectId}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {t('cards.gcp.findings', { count: account.findingCount })}
                  {account.lastSyncAt &&
                    ` · ${t('cards.gcp.lastSync', { date: new Date(account.lastSyncAt).toLocaleString() })}`}
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
                    : t('cards.gcp.scanNow')}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.gcp.connectAnotherProject')
                : t('cards.gcp.connect')}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <GcpConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.gcp.connected'));
            setShowConnectModal(false);
          }}
        />
      )}
    </>
  );
}
