import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { testsService } from '@/services/api/tests';
import { evidenceService } from '@/services/api/evidence';
import { complianceDocumentService } from '@/services/api/compliance-documents';
import type { TestRecord } from '@/services/api/tests';

interface DocumentUploadModalProps {
  test: TestRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUploadModal({
  test,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collect all unique policies linked through controls
  const linkedPolicies = React.useMemo(() => {
    const seen = new Set<string>();
    const policies: Array<{ id: string; name: string; documentUrl: string }> =
      [];
    for (const cl of test.controls) {
      for (const pm of cl.control.policyMappings ?? []) {
        if (!seen.has(pm.policy.id)) {
          seen.add(pm.policy.id);
          policies.push(pm.policy);
        }
      }
    }
    return policies;
  }, [test.controls]);

  const hasPolicies = linkedPolicies.length > 0;
  const [tab, setTab] = useState<'upload' | 'policy'>(
    hasPolicies ? 'policy' : 'upload',
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    linkedPolicies[0]?.id ?? '',
  );
  const [error, setError] = useState<string | null>(null);

  // Pick the first linked controlId for evidence creation
  const controlId = test.controls[0]?.controlId ?? null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!controlId) throw new Error(t('documentUpload.noControlLinked'));

      let evidenceId: string;

      if (tab === 'upload') {
        if (!selectedFile) throw new Error(t('documentUpload.selectFileError'));
        if (test.type === 'Document') {
          const docsRes = await complianceDocumentService.list({
            testId: test.id,
          });
          const linkedDoc = (docsRes.data ?? []).find(
            (doc) => doc.testId === test.id,
          );

          if (!linkedDoc) {
            throw new Error(t('documentUpload.noComplianceDoc'));
          }

          const uploadRes = await complianceDocumentService.uploadDocument(
            linkedDoc.id,
            selectedFile,
          );

          if (!uploadRes.success)
            throw new Error(t('documentUpload.uploadDocFailed'));

          const refreshedDoc = await complianceDocumentService.getById(
            linkedDoc.id,
          );

          if (!refreshedDoc.success || !refreshedDoc.data?.currentEvidenceId) {
            throw new Error(t('documentUpload.noEvidenceReturned'));
          }

          evidenceId = refreshedDoc.data.currentEvidenceId;
        } else {
          const res = await evidenceService.uploadEvidenceFile(
            selectedFile,
            controlId,
          );
          if (!res.success || !res.data)
            throw new Error(t('testDetail.evidenceTab.uploadFailed'));
          evidenceId = res.data.id;
        }
      } else {
        const policy = linkedPolicies.find((p) => p.id === selectedPolicyId);
        if (!policy) throw new Error(t('documentUpload.noPolicyDocument'));
        const res = await evidenceService.createLinkEvidence({
          controlId,
          fileUrl: policy.documentUrl,
          fileName: policy.name,
        });
        if (!res.success || !res.data)
          throw new Error(t('documentUpload.linkPolicyFailed'));
        evidenceId = res.data.id;
      }

      await testsService.attachEvidence(test.id, evidenceId);
      await testsService.completeTest(test.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(test.id) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['compliance-documents'] });
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              {t('documentUpload.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {hasPolicies && (
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('policy')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === 'policy'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('documentUpload.fromPolicy')}
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('documentUpload.uploadNew')}
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-4">
          {tab === 'policy' && hasPolicies ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {t('documentUpload.selectLinkedPolicy')}
              </p>
              <div className="space-y-2">
                {linkedPolicies.map((policy) => (
                  <label
                    key={policy.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedPolicyId === policy.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="policy"
                      value={policy.id}
                      checked={selectedPolicyId === policy.id}
                      onChange={() => setSelectedPolicyId(policy.id)}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {policy.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400 truncate">
                        {policy.documentUrl}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {t('documentUpload.selectFile')}
                {!controlId && (
                  <span className="block mt-1 text-amber-600 font-medium">
                    {t('documentUpload.noControlLinked')}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 transition-colors text-sm text-gray-500"
              >
                <Upload className="w-8 h-8 text-gray-300" />
                {selectedFile ? (
                  <span className="font-medium text-gray-800">
                    {t('documentUpload.fileSelected', {
                      name: selectedFile.name,
                    })}
                  </span>
                ) : (
                  <span>{t('documentUpload.browse')}</span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  setError(null);
                  setSelectedFile(e.target.files?.[0] ?? null);
                }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={submitMutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {t('documentUpload.cancel')}
          </button>
          <button
            onClick={() => {
              setError(null);
              submitMutation.mutate();
            }}
            disabled={
              submitMutation.isPending ||
              !controlId ||
              (tab === 'upload' && !selectedFile) ||
              (tab === 'policy' && !selectedPolicyId)
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {submitMutation.isPending
              ? t('documentUpload.uploadingFile')
              : t('documentUpload.uploadAndAttach')}
          </button>
        </div>
      </div>
    </div>
  );
}
