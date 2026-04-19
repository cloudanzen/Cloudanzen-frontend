import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { fleetService, FleetIntegrationRecord } from '@/services/api/fleet';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function FleetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="200" height="200" rx="40" fill="#192147" />
      <path
        d="M40 60h120v20H40zM40 90h80v20H40zM40 120h100v20H40z"
        fill="#6BA4FF"
      />
    </svg>
  );
}

function FleetConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: FleetIntegrationRecord) => void;
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
      setError(t('cards.fleet.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fleetService.connect({
        baseUrl: baseUrl.trim(),
        apiToken: apiToken.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        const accountsRes = await fleetService.getAccounts();
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
            hosts: [],
            findings: [],
          });
        onClose();
      }
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.fleet.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 my-4">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.fleet.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your Fleet server URL and a read-only API token. Generate a
          token in <strong>Fleet → Settings → Integrations → API Tokens</strong>{' '}
          or using the Fleet CLI:{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">
            fleetctl login
          </code>
          .
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.fleet.serverUrl')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.fleet.serverUrlHint')})
              </span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://fleet.company.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192147]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.fleet.apiToken')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.fleet.readOnly')})
              </span>
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Fleet API token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192147] font-mono"
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
              placeholder="e.g. Production Fleet"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192147]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#192147] hover:bg-[#0f1833] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t('cards.shared.connecting')
                : t('cards.fleet.connect')}
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

export function FleetCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: FleetIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: FleetIntegrationRecord) => void;
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
      await fleetService.runScan(integrationId);
      onToast('success', t('cards.fleet.scanStarted'));
    } catch {
      onToast('error', t('cards.fleet.scanStartFailed'));
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
      title: t('cards.fleet.disconnectTitle'),
      description: t('cards.fleet.disconnectDescription', {
        target: label ?? baseUrl,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await fleetService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', t('cards.fleet.disconnected'));
    } catch {
      onToast('error', t('cards.fleet.disconnectFailed'));
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
              <FleetIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fleet</h3>
              <p className="text-sm text-gray-500">
                {t('cards.fleet.subtitle')}
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

        {/* Connected instances */}
        {isConnected &&
          accounts.map((account) => {
            const totalHosts = account.hosts.length;
            const encryptedCount = account.hosts.filter(
              (h) => h.diskEncrypted === true,
            ).length;
            const mdmCount = account.hosts.filter(
              (h) => h.mdmEnrolled === true,
            ).length;
            const openFindings = account.findings.filter(
              (f) => f.severity === 'HIGH',
            ).length;
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
                    {totalHosts > 0 &&
                      ` · ${totalHosts} host${totalHosts !== 1 ? 's' : ''}`}
                    {totalHosts > 0 && ` · ${encryptedCount} encrypted`}
                    {totalHosts > 0 && ` · ${mdmCount} MDM`}
                    {openFindings > 0 &&
                      ` · ${openFindings} HIGH finding${openFindings !== 1 ? 's' : ''}`}
                    {account.lastScanAt &&
                      ` · Last scan: ${new Date(account.lastScanAt).toLocaleString()}`}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#192147] hover:bg-[#0f1833] text-white text-sm font-medium"
            >
              <FleetIcon className="w-4 h-4" />
              {isConnected
                ? t('cards.fleet.addInstance')
                : t('cards.fleet.connect')}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <FleetConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.fleet.connected'));
          }}
        />
      )}
    </>
  );
}
