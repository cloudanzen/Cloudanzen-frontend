import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  trustCenterService,
  TrustDocumentCategory,
  CreateDocumentPayload,
} from '@/services/api/trustCenter';
import { getDocCategoryLabels } from './helpers';

// ── Add Document Modal ────────────────────────────────────────────────────────

export function AddDocumentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TrustDocumentCategory>('POLICY');
  const [fileUrl, setFileUrl] = useState('');
  const [requiresNda, setRequiresNda] = useState(false);
  const [publicVisible, setPublicVisible] = useState(true);
  const [version, setVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const DOC_CATEGORY_LABELS = getDocCategoryLabels(t);

  const inputCls =
    'w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  async function handleSubmit() {
    if (!name.trim())
      return setError(t('customerTrust.addDocument.nameRequired'));
    if (!fileUrl.trim())
      return setError(t('customerTrust.addDocument.fileUrlRequired'));
    setError('');
    setSaving(true);
    try {
      const payload: CreateDocumentPayload = {
        name: name.trim(),
        category,
        fileUrl: fileUrl.trim(),
        requiresNda,
        publicVisible,
        version: version || null,
      };
      await trustCenterService.createDocument(payload);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : t('customerTrust.addDocument.failedToCreate'),
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
            {t('customerTrust.addDocument.title')}
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
              {t('customerTrust.addDocument.nameLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('customerTrust.addDocument.namePlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('customerTrust.addDocument.categoryLabel')}
              </label>
              <select
                className={inputCls}
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as TrustDocumentCategory)
                }
              >
                {(
                  Object.keys(DOC_CATEGORY_LABELS) as TrustDocumentCategory[]
                ).map((k) => (
                  <option key={k} value={k}>
                    {DOC_CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('customerTrust.addDocument.versionLabel')}
              </label>
              <input
                className={inputCls}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder={t('customerTrust.addDocument.versionPlaceholder')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('customerTrust.addDocument.fileUrlLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder={t('customerTrust.addDocument.fileUrlPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="accent-blue-600 w-4 h-4"
                checked={publicVisible}
                onChange={(e) => setPublicVisible(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                {t('customerTrust.addDocument.publicVisible')}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4"
                checked={requiresNda}
                onChange={(e) => setRequiresNda(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                {t('customerTrust.addDocument.requiresNda')}
              </span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('customerTrust.addDocument.cancel')}
          </button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? t('customerTrust.addDocument.saving')
              : t('customerTrust.addDocument.addDocumentBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
}
