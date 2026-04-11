/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Loader2, Upload, X, AlertCircle } from 'lucide-react';
import { evidenceService } from '@/services/api/evidence';
import { EvidenceItem, ControlOption } from './EvidenceDetailPanel';

// ── Upload Evidence Modal ────────────────────────────────────────────────────

export function UploadEvidenceModal({
  controls,
  onClose,
  onUploaded,
}: {
  controls: ControlOption[];
  onClose: () => void;
  onUploaded: (ev: EvidenceItem) => void;
}) {
  const { t } = useTranslation('compliance');
  const [file, setFile] = useState<File | null>(null);
  const [controlId, setControlId] = useState(controls[0]?.id ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) { setError(t('uploadEvidence.selectFile')); return; }
    if (!controlId) { setError(t('uploadEvidence.selectControl')); return; }
    setUploading(true);
    setError(null);
    try {
      const res = await evidenceService.uploadEvidenceFile(file, controlId) as any;
      onUploaded(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('uploadEvidence.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">{t('uploadEvidence.title')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Control picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
            {t('uploadEvidence.linkToControl')}
          </label>
          {controls.length === 0 ? (
            <p className="text-sm text-gray-400 italic">{t('uploadEvidence.noControls')}</p>
          ) : (
            <select
              value={controlId}
              onChange={e => setControlId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {controls.map(c => (
                <option key={c.id} value={c.id}>{c.isoReference} — {c.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.log,.json,.zip"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-blue-500" />
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-red-500 hover:text-red-700 mt-1"
              >
                {t('uploadEvidence.remove')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">{t('uploadEvidence.dragDrop')}</p>
              <p className="text-xs text-gray-400">{t('uploadEvidence.fileTypes')}</p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('uploadEvidence.cancel')}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !controlId || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? t('uploadEvidence.uploading') : t('uploadEvidence.upload')}
          </button>
        </div>
      </div>
    </div>
  );
}
