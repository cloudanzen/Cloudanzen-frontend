/**
 * testDetail/EvidenceTab.tsx — attached evidence, uploads and policy documents.
 *
 * Split out of TestDetailPanel.tsx in Phase 4. Markup is unchanged; the values
 * this tab read from the panel's closure are now explicit props.
 */

import { ExternalLink, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtDate, fmtDateTime } from '@/lib/format-date';
import type { TestRecord, UnifiedTestEvidence } from '@/services/api/tests';
import {
  AttachEvidenceSection,
  MarkAsPassedPrompt,
  PolicyDocumentsSection,
  UploadEvidenceSection,
} from './AttachSections';
import { EvidenceSynthesisPanel } from './EvidenceSynthesisPanel';
import { Section } from './Section';

/** Only `mutate` is read here, so the panel can pass its react-query mutation
 * without this file depending on the mutation's generics. */
interface DetachMutation {
  mutate: (evidenceId: string) => void;
}

interface EvidenceTabProps {
  test: TestRecord;
  testId: string;
  canEditTest: boolean;
  detachEvidence: DetachMutation;
  firstControlId: string | null;
  handleEvidenceAttached: () => void;
  isPolicyLinked: boolean;
  isSystemDriven: boolean;
  showPassedPrompt: boolean;
  setShowPassedPrompt: (open: boolean) => void;
  unifiedEvidence: UnifiedTestEvidence[];
}

export function EvidenceTab({
  test,
  testId,
  canEditTest,
  detachEvidence,
  firstControlId,
  handleEvidenceAttached,
  isPolicyLinked,
  isSystemDriven,
  showPassedPrompt,
  setShowPassedPrompt,
  unifiedEvidence,
}: EvidenceTabProps) {
  const { t } = useTranslation('tests');

  return (
    <>
      <Section
        title={
          (isPolicyLinked
            ? t('testDetail.evidenceTab.supportingEvidence')
            : t('testDetail.evidenceTab.attachedEvidence')) +
          ` (${test.evidences.length})`
        }
        icon={<Shield className="w-4 h-4 text-gray-500" />}
      >
        {test.evidences.length === 0 ? (
          <p className="text-sm text-gray-400">
            {t('testDetail.evidenceTab.noEvidence')}
          </p>
        ) : (
          <ul className="space-y-2">
            {test.evidences.map(({ id, evidenceId, evidence }) => (
              <li
                key={id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {evidence.fileName ?? evidence.type}
                  </p>
                  {evidence.fileUrl && (
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />{' '}
                      {t('testDetail.evidenceTab.viewEvidence')}
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtDate(evidence.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => detachEvidence.mutate(evidenceId)}
                  disabled={!canEditTest}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title={t('testDetail.evidenceTab.detach')}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {canEditTest && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <UploadEvidenceSection
              testId={testId}
              controlId={firstControlId}
              onUploaded={handleEvidenceAttached}
            />
            <span className="text-xs text-gray-300">|</span>
            <AttachEvidenceSection
              testId={testId}
              existingIds={new Set(test.evidences.map((e) => e.evidenceId))}
              controlIds={test.controls.map((c) => c.controlId)}
              onAttached={handleEvidenceAttached}
            />
          </div>
        )}
        {canEditTest && !isSystemDriven && !isPolicyLinked && (
          <MarkAsPassedPrompt
            testId={testId}
            show={showPassedPrompt}
            onDismiss={() => setShowPassedPrompt(false)}
          />
        )}
        <PolicyDocumentsSection
          controlIds={test.controls.map((c) => c.controlId)}
        />
      </Section>

      <Section
        title={
          t('testDetail.evidenceTab.unifiedEvidence') +
          ` (${unifiedEvidence.length})`
        }
        icon={<Shield className="w-4 h-4 text-gray-500" />}
      >
        {unifiedEvidence.length === 0 ? (
          <p className="text-sm text-gray-400">
            {t('testDetail.evidenceTab.noUnifiedEvidence')}
          </p>
        ) : (
          <div className="space-y-2">
            {unifiedEvidence.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-100 p-3 bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">
                    {item.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {item.sourceType}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {item.provider} · {fmtDateTime(item.capturedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* AI-2: Evidence synthesis panel — suggest control mappings */}
      {test.evidences.length > 0 && (
        <EvidenceSynthesisPanel evidences={test.evidences} testId={testId} />
      )}
    </>
  );
}
