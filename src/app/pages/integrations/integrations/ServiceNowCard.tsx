import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  servicenowIncidentService,
  ServiceNowIntegrationRecord,
} from '@/services/api/servicenow-incident';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function ServiceNowConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: ServiceNowIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [instanceUrl, setInstanceUrl] = useState('');
  const [authMethod, setAuthMethod] = useState('basic');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [label, setLabel] = useState('');
  const [slaHours, setSlaHours] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!instanceUrl.trim()) {
      setError(t('cards.serviceNow.instanceUrlRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        instanceUrl: instanceUrl.trim(),
        authMethod,
        label: label.trim() || undefined,
        slaHours: Number(slaHours) || 4,
        ...(authMethod === 'token' ? { token } : { username, password }),
      };
      const res = await servicenowIncidentService.connect(payload);
      onConnected(res.data);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.serviceNow.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.serviceNow.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.serviceNow.connectDescription')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.serviceNow.instanceUrl')}
            </label>
            <input
              type="url"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://yourinstance.service-now.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.serviceNow.authMethod')}
            </label>
            <select
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="basic">
                {t('cards.serviceNow.authMethods.basic')}
              </option>
              <option value="token">
                {t('cards.serviceNow.authMethods.token')}
              </option>
            </select>
          </div>
          {authMethod === 'basic' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('cards.shared.username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('cards.shared.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('cards.serviceNow.bearerToken')}
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.serviceNow.slaHours')}{' '}
              <span className="text-gray-400 font-normal">
                ({t('cards.serviceNow.slaHint')})
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
              placeholder="e.g. Production ServiceNow"
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
                : t('cards.serviceNow.connect')}
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

export function ServiceNowIncidentCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: ServiceNowIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: ServiceNowIntegrationRecord) => void;
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
      await servicenowIncidentService.runScan(id);
      onToast('success', t('cards.serviceNow.scanStarted'));
    } catch {
      onToast('error', t('cards.serviceNow.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(
    id: string,
    label: string | null,
    instanceUrl: string,
  ) {
    const name = label ?? instanceUrl;
    const confirmed = await confirm({
      title: t('cards.serviceNow.disconnectTitle'),
      description: t('cards.serviceNow.disconnectDescription', {
        target: name,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try {
      await servicenowIncidentService.disconnect(id);
      onAccountRemoved(id);
      onToast('success', t('cards.serviceNow.disconnected'));
    } catch {
      onToast('error', t('cards.serviceNow.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#81B5A1] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6"
                viewBox="0 0 32 32"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 8h24v4H4zM4 14h18v4H4zM4 20h20v4H4z" fill="white" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ServiceNow
              </h3>
              <p className="text-sm text-gray-500">
                {t('cards.serviceNow.subtitle')}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.serviceNow.instancesConnected', {
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
                  {t('cards.serviceNow.incidents', {
                    count: account.incidentCount,
                  })}
                  {account.lastSyncAt &&
                    ` · ${t('cards.serviceNow.lastSync', { date: new Date(account.lastSyncAt).toLocaleString() })}`}
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
                    : t('cards.serviceNow.scanNow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDisconnect(
                      account.id,
                      account.label,
                      account.instanceUrl,
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
          ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#62A0A0] hover:bg-[#4f8686] text-white text-sm font-medium"
            >
              {isConnected
                ? t('cards.serviceNow.addInstance')
                : t('cards.serviceNow.connect')}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <ServiceNowConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.serviceNow.connected'));
          }}
        />
      )}
    </>
  );
}
