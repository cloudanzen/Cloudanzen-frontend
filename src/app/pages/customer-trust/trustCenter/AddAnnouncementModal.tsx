import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  trustCenterService,
  TrustAnnouncementType,
  CreateAnnouncementPayload,
} from '@/services/api/trustCenter';

// ── Add Announcement Modal ────────────────────────────────────────────────────

export function AddAnnouncementModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('common');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<TrustAnnouncementType>('GENERAL');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputCls =
    'w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  async function handleSubmit() {
    if (!title.trim())
      return setError(t('customerTrust.addAnnouncement.titleRequired'));
    if (!content.trim())
      return setError(t('customerTrust.addAnnouncement.contentRequired'));
    setError('');
    setSaving(true);
    try {
      const payload: CreateAnnouncementPayload = {
        title: title.trim(),
        content: content.trim(),
        type,
        published,
      };
      await trustCenterService.createAnnouncement(payload);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : t('customerTrust.addAnnouncement.failedToCreate'),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {t('customerTrust.addAnnouncement.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('customerTrust.addAnnouncement.titleLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('customerTrust.addAnnouncement.titlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('customerTrust.addAnnouncement.typeLabel')}
            </label>
            <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as TrustAnnouncementType)}
            >
              <option value="GENERAL">
                {t('customerTrust.addAnnouncement.typeGeneral')}
              </option>
              <option value="SECURITY_UPDATE">
                {t('customerTrust.addAnnouncement.typeSecurityUpdate')}
              </option>
              <option value="INCIDENT">
                {t('customerTrust.addAnnouncement.typeIncident')}
              </option>
              <option value="CERTIFICATION">
                {t('customerTrust.addAnnouncement.typeCertification')}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('customerTrust.addAnnouncement.contentLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t(
                'customerTrust.addAnnouncement.contentPlaceholder',
              )}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-blue-600 w-4 h-4"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              {t('customerTrust.addAnnouncement.publishImmediately')}
            </span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('customerTrust.addAnnouncement.cancel')}
          </button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? t('customerTrust.addAnnouncement.saving')
              : t('customerTrust.addAnnouncement.postAnnouncement')}
          </Button>
        </div>
      </div>
    </div>
  );
}
