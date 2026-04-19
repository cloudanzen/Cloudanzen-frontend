import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { notionService, NotionStatus } from '@/services/api/notion';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="100"
        height="100"
        rx="15"
        fill="white"
        stroke="#e5e7eb"
        strokeWidth="2"
      />
      <path
        d="M12 12l53 3.5c6.3.4 7.8 1 10.2 3.8l8.3 11.3c1.4 1.9 1.9 3.2 1.9 8.5v43.7c0 5.9-2.2 9.4-9.7 9.9L17.4 95.5c-5.5.3-8.1-1.1-10.8-4.4L1.9 83.5C.3 81.3 0 79.8 0 77.6V21.8C0 16.3 2.8 12.4 12 12z"
        fill="white"
      />
      <path
        d="M65 19.5L18 16.2c-5.2-.3-7.6 2.5-7.6 6.9v52.8c0 4.6 1.4 7 5.7 7.4l56.4 3.3c4.5.3 6.9-1.8 6.9-6.7V27.2c0-4.5-2-7-14.4-7.7zM56 29.7L28 28v-.1c-1.2-.1-2.2-1.1-2.2-2.2 0-1.3 1.1-2.2 2.5-2.2l29.1 1.9c1.2.1 2 1 2 2.2 0 1.2-1.5 2.3-3.4 2.1zM22 72V38.3c0-1.8 1.6-2.8 3-1.9L59 56c1.2.7 1.2 2.3 0 3L25 72.7c-1.4.9-3-.1-3-1.7z"
        fill="#1a1a1a"
      />
    </svg>
  );
}

export function NotionCard({
  notionStatus,
  connected,
  loadingStatus,
  onConnected: _onConnected,
  onDisconnected,
  onToast,
}: {
  notionStatus: NotionStatus | null;
  connected: boolean;
  loadingStatus: boolean;
  onConnected: (status: NotionStatus) => void;
  onDisconnected: () => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [disconnecting, setDisconnecting] = useState(false);

  const handleConnect = async () => {
    try {
      window.location.href = notionService.getConnectUrl();
    } catch {
      onToast('error', t('cards.notion.connectUrlFailed'));
    }
  };

  const handleDisconnect = async () => {
    const confirmed = await confirm({
      title: t('cards.notion.disconnectTitle'),
      description: t('cards.notion.disconnectDescription'),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnecting(true);
    try {
      await notionService.disconnect();
      onDisconnected();
      onToast('success', t('cards.notion.disconnected'));
    } catch {
      onToast('error', t('cards.notion.disconnectFailed'));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
            <NotionIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notion</h3>
            <p className="text-sm text-gray-500">
              {t('cards.notion.subtitle')}
            </p>
          </div>
        </div>
        <Badge variant={connected ? 'default' : 'outline'}>
          {loadingStatus
            ? t('cards.shared.checking')
            : connected
              ? t('cards.shared.connected')
              : t('cards.shared.available')}
        </Badge>
      </div>

      {connected && notionStatus && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          {t('cards.notion.connectedWorkspace', {
            workspaceName: notionStatus.workspaceName,
          })}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!loadingStatus && !connected && (
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800"
          >
            <NotionIcon className="w-4 h-4" />
            {t('cards.notion.connect')}
          </button>
        )}
        {connected && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center px-4 py-2 rounded-md border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            {disconnecting
              ? t('cards.shared.disconnecting')
              : t('cards.shared.disconnect')}
          </button>
        )}
      </div>
    </Card>
  );
}
