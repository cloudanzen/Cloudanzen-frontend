/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Bell, Loader2 } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { NotificationRow } from '@/app/components/notifications/NotificationRow';
import { notificationEventDefinitions, getNotificationTargetPath } from '@/app/features/notifications/notificationHelpers';
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '@/app/features/notifications/useNotifications';
import { notificationsService } from '@/services/api/notifications';
import { QK } from '@/lib/queryKeys';
import { useNavigate } from 'react-router';

const PAGE_SIZE = 25;

export function NotificationsPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'unread' | 'critical'>('all');
  const [eventType, setEventType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const filters = useMemo(() => ({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    unreadOnly: tab === 'unread',
    severity: tab === 'critical' ? 'critical' as const : undefined,
    eventType: eventType === 'all' ? undefined : eventType,
  }), [eventType, page, tab]);

  const inboxQuery = useQuery({
    queryKey: QK.notificationsInbox(filters),
    queryFn: () => notificationsService.listInbox(filters),
  });

  const totalPages = Math.max(1, Math.ceil((inboxQuery.data?.total ?? 0) / PAGE_SIZE));

  async function handleOpen(notification: any) {
    await markRead.mutateAsync(notification.id);
    navigate(getNotificationTargetPath(notification));
  }

  return (
    <PageTemplate
      title={t('notifications.pageTitle')}
      description={t('notifications.pageDescription')}
      actions={<Button variant="outline" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>{t('notifications.markAllRead')}</Button>}
    >
      <div className="space-y-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={tab} onValueChange={(value) => { setTab(value as any); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all">{t('notifications.tabs.all')}</TabsTrigger>
                <TabsTrigger value="unread">{t('notifications.tabs.unread')}</TabsTrigger>
                <TabsTrigger value="critical">{t('notifications.tabs.critical')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="w-full lg:w-64">
              <Select value={eventType} onValueChange={(value) => { setEventType(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('notifications.filterPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('notifications.allEventTypes')}</SelectItem>
                  {notificationEventDefinitions.map((definition) => (
                    <SelectItem key={definition.eventType} value={definition.eventType}>{definition.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {inboxQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : (inboxQuery.data?.notifications.length ?? 0) === 0 ? (
          <Card className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">{t('notifications.emptyPageTitle')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('notifications.emptyPageDesc')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {inboxQuery.data?.notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onClick={handleOpen} />
            ))}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((current) => Math.max(1, current - 1));
                    }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem className="px-3 text-sm text-gray-500">{t('notifications.pageOf', { page, total: totalPages })}</PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((current) => Math.min(totalPages, current + 1));
                    }}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
