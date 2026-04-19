import { useState } from 'react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus, Globe, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import {
  trustCenterService,
  TrustAnnouncement,
} from '@/services/api/trustCenter';
import { getAnnouncementTypeMeta, fmt } from './helpers';
import { AddAnnouncementModal } from './AddAnnouncementModal';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

// ── Announcements Tab ─────────────────────────────────────────────────────────

export function AnnouncementsTab() {
  const { t } = useTranslation('common');
  const confirm = useConfirmDialog();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-announcements'],
    queryFn: () => trustCenterService.listAnnouncements(),
  });
  const items = data?.data ?? [];
  const ANNOUNCEMENT_TYPE_META = getAnnouncementTypeMeta(t);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  async function handleTogglePublish(item: TrustAnnouncement) {
    try {
      await trustCenterService.updateAnnouncement(item.id, {
        published: !item.published,
      });
      qc.invalidateQueries({ queryKey: ['trust-announcements'] });
    } catch {
      showToast('error', t('customerTrust.announcements.failedToUpdate'));
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: t('customerTrust.announcements.deleteTitle'),
      description: t('customerTrust.announcements.deleteDescription'),
      confirmLabel: t('actions.delete'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await trustCenterService.deleteAnnouncement(id);
      qc.invalidateQueries({ queryKey: ['trust-announcements'] });
      showToast('success', t('customerTrust.announcements.deleted'));
    } catch {
      showToast('error', t('customerTrust.announcements.failedToDelete'));
    }
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {t('customerTrust.announcements.subtitle')}
        </p>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('customerTrust.announcements.newAnnouncement')}
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-xl animate-pulse"
            />
          ))
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">
              {t('customerTrust.announcements.noAnnouncements')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t('customerTrust.announcements.noAnnouncementsHint')}
            </p>
          </Card>
        ) : (
          items.map((item) => {
            const meta = ANNOUNCEMENT_TYPE_META[item.type];
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                      {item.published ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          <Globe className="w-3 h-3" />
                          {t('customerTrust.announcements.published')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {t('customerTrust.announcements.draft')}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {fmt(item.createdAt)}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {item.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 font-medium text-gray-600"
                    >
                      {item.published
                        ? t('customerTrust.announcements.unpublish')
                        : t('customerTrust.announcements.publish')}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {showModal && (
        <AddAnnouncementModal
          onClose={() => setShowModal(false)}
          onSaved={() =>
            qc.invalidateQueries({ queryKey: ['trust-announcements'] })
          }
        />
      )}
    </div>
  );
}
