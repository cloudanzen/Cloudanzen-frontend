/**
 * testDetail/EvidenceSynthesisPanel.tsx — AI evidence-synthesis suggestions
 * for attached evidence. Split out of TestDetailPanel.tsx in Phase 4.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { aiService } from '@/services/api/ai';
import { CitationViewer } from '@/app/components/CitationViewer';

// ─── Evidence Synthesis Panel (AI-2) ─────────────────────────────────────────
// Inline panel for the evidence tab — allows triggering AI control-mapping
// suggestions for any attached evidence item without leaving the test detail.

interface EvidenceSynthesisPanelProps {
  evidences: Array<{
    evidenceId: string;
    evidence: { fileName?: string | null; type: string };
  }>;
  testId: string;
}

export function EvidenceSynthesisPanel({
  evidences,
}: EvidenceSynthesisPanelProps) {
  const { t } = useTranslation('tests');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  );
  const [generationId, setGenerationId] = useState<string | null>(null);

  const synthesisMutation = useMutation({
    mutationFn: (evidenceId: string) =>
      aiService.synthesizeEvidence(evidenceId, ''),
    onSuccess: (resp) => {
      setGenerationId(resp.data.generationId);
    },
  });

  const generationQuery = useQuery({
    queryKey: ['ai-generation', generationId],
    queryFn: () => aiService.getGeneration(generationId!),
    enabled: !!generationId,
    refetchInterval: (query) =>
      query.state.data?.data?.status === 'PENDING_REVIEW' ? false : 3000,
  });

  const acceptMutation = useMutation({
    mutationFn: () => aiService.acceptSuggestion(generationId!),
    onSuccess: () => setGenerationId(null),
  });

  const dismissMutation = useMutation({
    mutationFn: () => aiService.dismissSuggestion(generationId!),
    onSuccess: () => {
      setGenerationId(null);
      setSelectedEvidenceId(null);
    },
  });

  const generation = generationQuery.data?.data;

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <span className="text-sm font-semibold text-violet-800">
          {t('testDetail.evidenceTab.aiSynthesis')}
        </span>
        <span className="ml-auto text-xs text-violet-500">
          {t('testDetail.evidenceTab.suggestMappings')}
        </span>
      </div>

      {!generationId && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            {t('testDetail.evidenceTab.selectEvidence')}
          </p>
          <div className="flex flex-wrap gap-2">
            {evidences.map(({ evidenceId, evidence }) => (
              <button
                key={evidenceId}
                type="button"
                onClick={() => {
                  setSelectedEvidenceId(evidenceId);
                  synthesisMutation.mutate(evidenceId);
                }}
                disabled={synthesisMutation.isPending}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors
                  ${
                    selectedEvidenceId === evidenceId
                      ? 'border-violet-400 bg-violet-100 text-violet-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50'
                  }`}
              >
                {evidence.fileName ?? evidence.type}
              </button>
            ))}
          </div>
          {synthesisMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-violet-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('testDetail.evidenceTab.synthesizing')}
            </div>
          )}
          {synthesisMutation.isError && (
            <p className="text-xs text-red-600">
              {t('testDetail.evidenceTab.synthesisFailed')}{' '}
              {(synthesisMutation.error as Error)?.message ??
                t('testDetail.evidenceTab.unknownError')}
            </p>
          )}
        </div>
      )}

      {generationId && generation && (
        <div className="space-y-3 bg-white rounded-xl border border-violet-100 p-3">
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {generation.outputText || (
              <span className="text-gray-400 italic">
                {t('testDetail.evidenceTab.generating')}
              </span>
            )}
          </div>
          {generation.citationsJson && generation.citationsJson.length > 0 && (
            <CitationViewer
              citations={generation.citationsJson}
              label={t('testDetail.evidenceTab.sourceDocuments')}
              className="pt-1"
            />
          )}
          {generation.status === 'PENDING_REVIEW' && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ThumbsUp className="h-3.5 w-3.5" />
                )}
                {t('testDetail.evidenceTab.acceptSuggestion')}
              </button>
              <button
                type="button"
                onClick={() => dismissMutation.mutate()}
                disabled={dismissMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {t('testDetail.evidenceTab.dismiss')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
