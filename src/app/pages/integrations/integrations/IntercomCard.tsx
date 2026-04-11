/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  intercomService,
  IntercomIntegrationRecord,
} from '@/services/api/intercom';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function IntercomIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#1F8DED" />
      <path
        d="M16 6C10.5 6 6 10.5 6 16v8.5l2.1-2.1C9.9 24.7 12.8 26 16 26c5.5 0 10-4.5 10-10S21.5 6 16 6zm-5 10.8c0 .4-.3.7-.7.7s-.7-.3-.7-.7V12c0-.4.3-.7.7-.7s.7.3.7.7v4.8zm3.5 2c0 .4-.3.7-.7.7s-.7-.3-.7-.7v-8c0-.4.3-.7.7-.7s.7.3.7.7v8zm3.5-2c0 .4-.3.7-.7.7s-.7-.3-.7-.7V12c0-.4.3-.7.7-.7s.7.3.7.7v4.8zm3.5-2c0 .4-.3.7-.7.7s-.7-.3-.7-.7V14c0-.4.3-.7.7-.7s.7.3.7.7v2.8z"
        fill="white"
      />
    </svg>
  );
}

export function IntercomCard({
  accounts,
  loadingStatus,
  onAccountRemoved,
  onToast,
}: {
  accounts: IntercomIntegrationRecord[];
  loadingStatus: boolean;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await intercomService.runScan(integrationId);
      onToast('success', t('cards.intercom.scanStarted'));
    } catch {
      onToast('error', t('cards.intercom.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleSync(integrationId: string) {
    setSyncingId(integrationId);
    try {
      const res = await intercomService.sync(integrationId);
      onToast(
        'success',
        t('cards.intercom.synced', { count: (res as any).synced ?? 0 }),
      );
    } catch {
      onToast('error', t('cards.intercom.syncFailed'));
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDisconnect(
    integrationId: string,
    workspaceName: string | null,
  ) {
    const confirmed = await confirm({
      title: t('cards.intercom.disconnectTitle'),
      description: t('cards.intercom.disconnectDescription', {
        target: workspaceName ?? 'Intercom',
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await intercomService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', t('cards.intercom.disconnected'));
    } catch {
      onToast('error', t('cards.intercom.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  function handleConnect() {
    // Redirect to backend OAuth initiation endpoint (which requires auth header via cookie won't work)
    // Instead, navigate with the token in the URL via a redirect handled by the backend
    window.location.href = intercomService.getConnectUrl();
  }

  return (
    <Card className="p-6 md:col-span-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
            <IntercomIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Intercom</h3>
            <p className="text-sm text-gray-500">
              {t('cards.intercom.subtitle')}
            </p>
          </div>
        </div>
        <Badge variant={isConnected ? 'default' : 'outline'}>
          {loadingStatus
            ? t('cards.shared.checking')
            : isConnected
              ? t('cards.intercom.workspacesConnected', {
                  count: accounts.length,
                })
              : t('cards.shared.available')}
        </Badge>
      </div>

      {/* Connected workspace rows */}
      {isConnected &&
        accounts.map((account) => (
          <div
            key={account.id}
            className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {account.workspaceName ?? account.workspaceId}
              </p>
              <p className="text-xs text-gray-400 font-mono">
                {t('cards.intercom.tickets', { count: account.ticketCount })}
                {' · '}
                {t('cards.intercom.open', { count: account.openConversations })}
                {account.lastSyncAt &&
                  ` · ${t('cards.intercom.lastSync', { date: new Date(account.lastSyncAt).toLocaleString() })}`}
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
                  : t('cards.intercom.scanNow')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync(account.id)}
                disabled={syncingId === account.id}
              >
                {syncingId === account.id
                  ? t('cards.intercom.syncing')
                  : t('cards.intercom.sync')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDisconnect(account.id, account.workspaceName)
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

      {/* Action button */}
      <div className="flex flex-wrap gap-2">
        {!loadingStatus && (
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1F8DED] hover:bg-[#1a7acb] text-white text-sm font-medium"
          >
            <IntercomIcon className="w-4 h-4" />
            {isConnected
              ? t('cards.intercom.addWorkspace')
              : t('cards.intercom.connect')}
          </button>
        )}
      </div>
    </Card>
  );
}
