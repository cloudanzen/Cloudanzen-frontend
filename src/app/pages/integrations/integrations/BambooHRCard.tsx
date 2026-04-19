import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { bamboohrService, HRIntegrationRecord } from '@/services/api/bamboohr';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function BambooHRIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="18" fill="#73AC27" />
      <path
        d="M28 75V25h10c0 0 0 12 12 12s12-12 12-12h10v50h-10V50c0 0-2 10-12 10S38 50 38 50v25H28z"
        fill="white"
      />
    </svg>
  );
}

function BambooHRConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: HRIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [subdomain, setSubdomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subdomain.trim() || !apiKey.trim()) {
      setError(t('cards.bambooHr.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await bamboohrService.connect({
        subdomain: subdomain.trim(),
        apiKey: apiKey.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        const accountsRes = await bamboohrService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(
          (a) => a.subdomain === subdomain.trim(),
        );
        if (newAccount) onConnected(newAccount);
        else
          onConnected({
            id: res.data.id,
            subdomain: res.data.subdomain,
            label: res.data.label,
            status: res.data.status,
            lastSyncAt: null,
            createdAt: res.data.createdAt,
            personnel: [],
          });
        onClose();
      }
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.bambooHr.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.bambooHr.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          {t('cards.bambooHr.connectDescription')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.bambooHr.companySubdomain')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.bambooHr.companySubdomainHint')})
              </span>
            </label>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="mycompany"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73AC27]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.shared.apiKey')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.bambooHr.readOnly')})
              </span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="BambooHR API Key"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73AC27] font-mono"
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
              placeholder="e.g. Production HR"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73AC27]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#73AC27] hover:bg-[#5e8e1f] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t('cards.shared.connecting')
                : t('cards.bambooHr.connect')}
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

export function BambooHRCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: HRIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: HRIntegrationRecord) => void;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleSync(integrationId: string) {
    setSyncingId(integrationId);
    try {
      await bamboohrService.syncEmployees(integrationId);
      onToast('success', t('cards.bambooHr.syncStarted'));
    } catch {
      onToast('error', t('cards.bambooHr.syncStartFailed'));
    } finally {
      setSyncingId(null);
    }
  }

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await bamboohrService.runScan(integrationId);
      onToast('success', t('cards.bambooHr.scanStarted'));
    } catch {
      onToast('error', t('cards.bambooHr.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(integrationId: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.bambooHr.disconnectTitle'),
      description: t('cards.bambooHr.disconnectDescription', {
        target: label ?? 'BambooHR',
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await bamboohrService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', t('cards.bambooHr.disconnected'));
    } catch {
      onToast('error', t('cards.bambooHr.disconnectFailed'));
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
              <BambooHRIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">BambooHR</h3>
              <p className="text-sm text-gray-500">
                {t('cards.bambooHr.subtitle')}
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
            const active = account.personnel.filter(
              (p) => p.status === 'ACTIVE',
            ).length;
            const total = account.personnel.length;
            return (
              <div
                key={account.id}
                className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {account.label ?? account.subdomain}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {account.subdomain}.bamboohr.com
                    {total > 0 &&
                      ` · ${t('cards.bambooHr.employeeSummary', { active, total })}`}
                    {account.lastSyncAt &&
                      ` · ${t('cards.bambooHr.lastSync', { date: new Date(account.lastSyncAt).toLocaleString() })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(account.id)}
                    disabled={syncingId === account.id}
                  >
                    {syncingId === account.id
                      ? t('cards.bambooHr.syncing')
                      : t('cards.bambooHr.sync')}
                  </Button>
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
            );
          })}

        {/* Action button */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#73AC27] hover:bg-[#5e8e1f] text-white text-sm font-medium"
            >
              <BambooHRIcon className="w-4 h-4" />
              {isConnected
                ? t('cards.bambooHr.addAccount')
                : t('cards.bambooHr.connect')}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <BambooHRConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.bambooHr.connected'));
          }}
        />
      )}
    </>
  );
}
