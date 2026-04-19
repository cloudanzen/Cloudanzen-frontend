import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerService } from '@/services/api/partner';

export const TOOL_CATEGORIES = [
  'Cloud Provider',
  'Version Control',
  'Identity Provider',
  'Communication',
  'CRM',
  'HRIS',
  'MDM',
  'Observability',
  'Endpoint Security',
  'Vulnerability Scanner',
  'Security Training',
  'Password Manager',
  'Finance',
  'CI/CD',
  'Document Management',
  'Data Warehouse',
  'Datastore',
  'Task Management',
  'Other',
];

export function RequestToolModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation('integrations');
  const [toolName, setToolName] = useState('');
  const [category, setCategory] = useState('');
  const [useCase, setUseCase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toolName.trim()) {
      setError(t('requestTool.toolNameRequired'));
      return;
    }
    if (!useCase.trim()) {
      setError(t('requestTool.useCaseRequired'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await partnerService.submitToolRequest({
        toolName: toolName.trim(),
        category,
        useCase: useCase.trim(),
      });
      onSubmitted();
    } catch {
      setError(t('requestTool.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('requestTool.modalTitle')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('requestTool.modalDescription')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              {t('requestTool.toolIntegrationName')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder={t('requestTool.toolPlaceholder')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              {t('requestTool.category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="">{t('requestTool.selectCategory')}</option>
              {TOOL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              {t('requestTool.useCaseJustification')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder={t('requestTool.useCasePlaceholder')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              {t('requestTool.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting
                ? t('requestTool.submitting')
                : t('requestTool.submitRequest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
