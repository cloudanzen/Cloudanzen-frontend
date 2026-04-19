import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { auditsService, FindingSeverity } from '@/services/api/audits';

// ── Add Finding Modal ─────────────────────────────────────────────────────────

export function AddFindingModal({
  auditId,
  auditControlId: _auditControlId,
  controlId,
  controlRef,
  onClose,
  onSaved,
}: {
  auditId: string;
  auditControlId: string;
  controlId: string;
  controlRef: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('auditor');
  const [severity, setSeverity] = useState<FindingSeverity>('MINOR');
  const [description, setDescription] = useState('');
  const [remediation, setRemediation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!description.trim())
      return setError(t('addFinding.descriptionRequired'));
    setSaving(true);
    setError(null);
    try {
      await auditsService.createFinding(auditId, {
        controlId,
        severity,
        description: description.trim(),
        remediation: remediation.trim() || undefined,
        status: 'OPEN',
      });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('addFinding.failed'));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('addFinding.title')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('addFinding.control')}{' '}
              <span className="font-mono font-semibold text-blue-700">
                {controlRef}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('addFinding.severity')} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(['MINOR', 'MAJOR', 'OBSERVATION'] as FindingSeverity[]).map(
                (s) => (
                  <label
                    key={s}
                    className={`flex-1 flex items-center justify-center gap-1.5 border rounded-lg px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${
                      severity === s
                        ? s === 'MAJOR'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : s === 'MINOR'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={severity === s}
                      onChange={() => setSeverity(s)}
                    />
                    {s}
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('addFinding.description')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className={inputCls}
              placeholder={t('addFinding.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('addFinding.remediation')}
            </label>
            <textarea
              rows={2}
              className={inputCls}
              placeholder={t('addFinding.remediationPlaceholder')}
              value={remediation}
              onChange={(e) => setRemediation(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
          >
            {t('addFinding.cancel')}
          </button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('addFinding.saving') : t('addFinding.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
