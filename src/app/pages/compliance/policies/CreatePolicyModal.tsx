import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { policiesService } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import { POLICY_STATUSES } from './types';
import { X, Upload, Plus, Loader2 } from 'lucide-react';

export function CreatePolicyModal({
  onClose,
  onCreated,
  prefill,
}: {
  onClose: () => void;
  onCreated: (p: Policy) => void;
  prefill?: { name?: string; version?: string; status?: string };
}) {
  const { t } = useTranslation('compliance');
  const [form, setForm] = useState({
    name: prefill?.name ?? '',
    version: prefill?.version ?? '1.0',
    status: prefill?.status ?? 'DRAFT',
    approvedBy: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.version.trim()) {
      setError(t('policiesPage.createModal.nameVersionRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await policiesService.createPolicy({
        name: form.name,
        version: form.version,
        status: form.status,
        approvedBy: form.approvedBy || undefined,
      });
      const created: Policy = (res as { data: Policy }).data;

      if (file) {
        try {
          const uploadRes = await policiesService.uploadPolicyDocument(created.id, file);
          onCreated((uploadRes as { data: { policy: Policy } }).data.policy);
        } catch {
          onCreated(created);
        }
      } else {
        onCreated(created);
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('policiesPage.createModal.createFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">{t('policiesPage.createModal.title')}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('policiesPage.createModal.policyName')}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={t('policiesPage.createModal.policyNamePlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('policiesPage.createModal.version')}</label>
              <input
                type="text"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                placeholder={t('policiesPage.createModal.versionPlaceholder')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('policiesPage.createModal.status')}</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {POLICY_STATUSES.map(s => (
                  <option key={s} value={s}>{t(`policiesPage.statusLabels.${s}`, { defaultValue: s })}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('policiesPage.createModal.approvedBy')}</label>
            <input
              type="text"
              value={form.approvedBy}
              onChange={e => setForm(f => ({ ...f, approvedBy: e.target.value }))}
              placeholder={t('policiesPage.createModal.approvedByPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Optional document upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('policiesPage.createModal.attachDocument')}</label>
            <div
              onClick={() => inputRef.current?.click()}
              className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors text-sm ${
                file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {file ? (
                <span className="truncate text-blue-700 font-medium">{file.name}</span>
              ) : (
                <span className="text-gray-400">{t('policiesPage.createModal.clickToAttach')}</span>
              )}
              {file && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="ml-auto text-gray-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('policiesPage.createModal.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? t('policiesPage.createModal.creating') : t('policiesPage.createModal.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
