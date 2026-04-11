import { Link, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { NotificationRow } from './NotificationRow';
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '@/app/features/notifications/useNotifications';
import { getNotificationTargetPath, notificationPageIcons } from '@/app/features/notifications/notificationHelpers';
import type { NotificationDto } from '@/services/api/notifications';
import { useTranslation } from 'react-i18next';

interface NotificationPanelProps {
  notifications: NotificationDto[];
  isLoading?: boolean;
  onClose?: () => void;
}

export function NotificationPanel({ notifications, isLoading, onClose }: NotificationPanelProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const EmptyIcon = notificationPageIcons.empty;

  async function handleOpen(notification: NotificationDto) {
    await markRead.mutateAsync(notification.id);
    onClose?.();
    navigate(getNotificationTargetPath(notification));
  }

  return (
    <div className="w-[min(92vw,26rem)] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('notifications.title')}</h3>
          <p className="text-xs text-gray-500">{t('notifications.description')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending || notifications.length === 0}>
          {t('notifications.markAllRead')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <EmptyIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-900">{t('notifications.emptyTitle')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('notifications.emptyDesc')}</p>
        </div>
      ) : (
        <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} compact onClick={handleOpen} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3">
        <Link to="/notifications" onClick={onClose} className="text-sm font-medium text-blue-600 hover:text-blue-700">
          {t('notifications.viewAll')}
        </Link>
        <Link to="/settings/notifications" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          {t('notifications.settings')}
        </Link>
      </div>
    </div>
  );
}
