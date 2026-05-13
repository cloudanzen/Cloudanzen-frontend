import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  testsService,
  type WorkflowIntegrationProvider,
} from '@/services/api/tests';
import { EngineerAIntegrationRecord } from '@/services/api/engineer-a-factory';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

export type WorkflowConfigResult = {
  provider: WorkflowIntegrationProvider;
  values: Record<string, string | undefined>;
};

type EngineerAService = {
  getAccounts: () => Promise<{
    success: boolean;
    data: EngineerAIntegrationRecord[];
  }>;
  connect: (payload: {
    apiKey: string;
    accountId?: string;
    tenant?: string;
    baseUrl?: string;
    region?: string;
    label?: string;
  }) => Promise<{ success: boolean; data: EngineerAIntegrationRecord }>;
  disconnect: (integrationId: string) => Promise<{ success: boolean }>;
  runScan: (
    integrationId: string,
  ) => Promise<{ success: boolean; jobId: string; status: string }>;
};

export type EngineerACardConfig = {
  key: string;
  name: string;
  subtitle: string;
  category: string;
  description: string;
  brandColor: string;
  isoTags: string[];
  iconBg: string;
  iconText?: string;
  iconSvg?: React.ReactNode;
  service: EngineerAService;
};

export function EngineerAIntegrationCard({
  config,
  loading,
  onToast,
  activeTab,
  onConnectionCountChange,
  onWorkflowConfigUpdated,
  getWorkflowConfig,
}: {
  config: EngineerACardConfig;
  loading: boolean;
  onToast: (type: 'success' | 'error', msg: string) => void;
  activeTab: 'connected' | 'available';
  onConnectionCountChange: (count: number) => void;
  onWorkflowConfigUpdated?: () => Promise<void>;
  getWorkflowConfig: (input: {
    key: string;
    apiKey: string;
    accountId: string;
    tenant: string;
    baseUrl: string;
  }) => WorkflowConfigResult | null;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [accounts, setAccounts] = useState<EngineerAIntegrationRecord[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [tenant, setTenant] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const connected = accounts.length > 0;

  const load = async () => {
    try {
      const res = await config.service.getAccounts();
      const list = res.data ?? [];
      setAccounts(list);
      onConnectionCountChange(list.length);
    } catch {
      setAccounts([]);
      onConnectionCountChange(0);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- legacy mount-only connection loader

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) {
      onToast('error', t('cards.shared.apiKeyRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await config.service.connect({
        apiKey: apiKey.trim(),
        accountId: accountId.trim() || undefined,
        tenant: tenant.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        label: label.trim() || undefined,
      });

      const workflowConfig = getWorkflowConfig({
        key: config.key,
        apiKey,
        accountId,
        tenant,
        baseUrl,
      });
      if (workflowConfig) {
        try {
          await testsService.upsertWorkflowIntegrationConfig(
            workflowConfig.provider,
            workflowConfig.values,
          );
          await onWorkflowConfigUpdated?.();
        } catch {
          onToast(
            'error',
            t('cards.engineerA.workflowSyncFailed', { name: config.name }),
          );
        }
      }

      setShowConnect(false);
      setApiKey('');
      setAccountId('');
      setTenant('');
      setBaseUrl('');
      setLabel('');
      await load();
      onToast('success', t('cards.engineerA.connected', { name: config.name }));
    } catch (error: unknown) {
      onToast(
        'error',
        (error as { message?: string }).message ??
          t('cards.engineerA.failedToConnect', { name: config.name }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect(integrationId: string) {
    const confirmed = await confirm({
      title: t('cards.engineerA.disconnectTitle', { name: config.name }),
      description: t('cards.engineerA.disconnectDescription', {
        name: config.name,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await config.service.disconnect(integrationId);
      await load();
      onToast(
        'success',
        t('cards.engineerA.disconnected', { name: config.name }),
      );
    } catch {
      onToast(
        'error',
        t('cards.engineerA.failedToDisconnect', { name: config.name }),
      );
    } finally {
      setDisconnectingId(null);
    }
  }

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await config.service.runScan(integrationId);
      onToast(
        'success',
        t('cards.engineerA.scanQueued', { name: config.name }),
      );
    } catch {
      onToast(
        'error',
        t('cards.engineerA.failedToQueueScan', { name: config.name }),
      );
    } finally {
      setScanningId(null);
    }
  }

  const visible = activeTab === 'connected' ? connected : !connected;
  if (!visible) return null;

  return (
    <Card className="p-6 md:col-span-2">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full p-1 ${config.iconBg}`}
          >
            {config.iconSvg ?? (
              <span className="text-sm font-bold text-white">
                {config.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {config.name}
            </h3>
            <p className="text-sm text-gray-500">
              {t(`engineerA.${config.key}.subtitle`, {
                defaultValue: config.subtitle,
              })}
            </p>
          </div>
        </div>
        <Badge variant={connected ? 'default' : 'outline'}>
          {loading
            ? t('cards.shared.checking')
            : connected
              ? t('cards.shared.connectedCount', { count: accounts.length })
              : t('cards.shared.available')}
        </Badge>
      </div>

      {connected &&
        accounts.map((account) => (
          <div
            key={account.id}
            className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {(account.metadata?.['label'] as string | undefined) ||
                  config.name}
              </p>
              <p className="text-xs text-gray-400">
                {(account.metadata?.['accountId'] as string | undefined) ||
                  (account.metadata?.['tenant'] as string | undefined) ||
                  t('cards.engineerA.activeAccount')}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
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
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleDisconnect(account.id)}
                disabled={disconnectingId === account.id}
              >
                {disconnectingId === account.id
                  ? t('cards.shared.disconnecting')
                  : t('cards.shared.disconnect')}
              </Button>
            </div>
          </div>
        ))}

      <div className="flex flex-wrap gap-2">
        {!loading && (
          <button
            onClick={() => setShowConnect((value) => !value)}
            style={{ backgroundColor: config.brandColor }}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {connected
              ? t('cards.engineerA.addAccount', { name: config.name })
              : t('cards.engineerA.connect', { name: config.name })}
          </button>
        )}
      </div>

      {showConnect && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">
            {t('cards.engineerA.connect', { name: config.name })}
          </h4>
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('cards.shared.apiKey')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder={t('cards.shared.apiKey')}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('cards.shared.accountId')}{' '}
                <span className="font-normal text-gray-400">
                  {t('cards.shared.optional')}
                </span>
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder={t('cards.shared.accountId')}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('cards.shared.tenantSubdomain')}{' '}
                <span className="font-normal text-gray-400">
                  {t('cards.shared.optional')}
                </span>
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder={t('cards.shared.tenantSubdomainPlaceholder')}
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('cards.shared.baseUrl')}{' '}
                <span className="font-normal text-gray-400">
                  {t('cards.shared.optional')}
                </span>
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder={t('cards.shared.baseUrlPlaceholder')}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('cards.shared.label')}{' '}
                <span className="font-normal text-gray-400">
                  {t('cards.shared.optional')}
                </span>
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder={t('cards.shared.labelPlaceholder')}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting
                  ? t('cards.shared.connecting')
                  : t('cards.engineerA.connect', { name: config.name })}
              </button>
              <button
                type="button"
                onClick={() => setShowConnect(false)}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('cards.shared.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
