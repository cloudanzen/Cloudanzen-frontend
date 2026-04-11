/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { COPY_FEEDBACK_MS, TOAST_DURATION_MS } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FileQuestion,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Loader2,
  ThumbsUp,
  Copy,
} from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import {
  trustCenterService,
  TrustQuestionnaireDraftResponse,
} from '@/services/api/trustCenter';
import { aiService } from '@/services/api/ai';
import { CitationViewer } from '@/app/components/CitationViewer';
import { fmt } from './helpers';

// ── AI Draft Response Panel ───────────────────────────────────────────────────

function AiDraftPanel({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('common');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [drafts, setDrafts] = useState<
    TrustQuestionnaireDraftResponse[] | null
  >(null);
  const [copied, setCopied] = useState<number | null>(null);

  const generateMutation = useMutation({
    mutationFn: () =>
      trustCenterService.generateAiResponse(
        requestId,
        questions.filter((q) => q.trim()),
      ),
    onSuccess: (resp) => {
      setDrafts(resp.draftResponses ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      aiService.approveQuestionnaireAnswer(id, text),
  });

  function addQuestion() {
    setQuestions((prev) => [...prev, '']);
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateQuestion(i: number, val: string) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? val : q)));
  }

  function handleCopy(text: string, i: number) {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(i);
    setTimeout(() => setCopied(null), COPY_FEEDBACK_MS);
  }

  const CONFIDENCE_COLORS = {
    HIGH: 'text-green-700 bg-green-50',
    MEDIUM: 'text-amber-700 bg-amber-50',
    LOW: 'text-red-700 bg-red-50',
  };

  return (
    <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold text-violet-800">
            {t('customerTrust.questionnaires.aiResponseAssistant')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-gray-600">
        {t('customerTrust.questionnaires.aiInstructions')}
      </p>

      {/* Question inputs */}
      {!drafts && (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={q}
                onChange={(e) => updateQuestion(i, e.target.value)}
                placeholder={t(
                  'customerTrust.questionnaires.questionPlaceholder',
                  { number: i + 1 },
                )}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('customerTrust.questionnaires.addQuestion')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={
              generateMutation.isPending || !questions.some((q) => q.trim())
            }
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t('customerTrust.questionnaires.generateDraftAnswers')}
          </button>
          {generateMutation.isError && (
            <p className="text-xs text-red-600">
              {(generateMutation.error as Error)?.message ??
                t('customerTrust.questionnaires.generationFailed')}
            </p>
          )}
        </div>
      )}

      {/* Draft answers */}
      {drafts && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">
              {t('customerTrust.questionnaires.draftAnswersGenerated', {
                count: drafts.length,
              })}
            </p>
            <button
              type="button"
              onClick={() => setDrafts(null)}
              className="text-xs text-violet-600 hover:text-violet-800"
            >
              {t('customerTrust.questionnaires.startOver')}
            </button>
          </div>

          {drafts.map((draft, i) => (
            <div
              key={draft.generationId || i}
              className="rounded-xl border border-gray-100 bg-white p-3 space-y-2"
            >
              <p className="text-xs font-semibold text-gray-700">
                Q{i + 1}: {draft.question}
              </p>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    CONFIDENCE_COLORS[
                      draft.confidence as keyof typeof CONFIDENCE_COLORS
                    ] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t('customerTrust.questionnaires.confidence', {
                    level: draft.confidence,
                  })}
                </span>
              </div>

              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {draft.draftAnswer}
              </p>

              {Array.isArray(draft.citations) && draft.citations.length > 0 && (
                <CitationViewer
                  citations={draft.citations as any}
                  label={t('customerTrust.questionnaires.sources')}
                  className="pt-1"
                />
              )}

              {draft.generationId && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      approveMutation.mutate({
                        id: draft.generationId,
                        text: draft.draftAnswer,
                      })
                    }
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {t('customerTrust.questionnaires.approveForReuse')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(draft.draftAnswer, i)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === i
                      ? t('customerTrust.questionnaires.copied')
                      : t('customerTrust.questionnaires.copy')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Questionnaires Tab ────────────────────────────────────────────────────────

export function QuestionnairesTab() {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [aiPanelId, setAiPanelId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-questionnaires'],
    queryFn: () => trustCenterService.listQuestionnaireRequests(),
  });
  const items = data?.data ?? [];

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  async function handleComplete(id: string) {
    if (!editUrl.trim())
      return showToast(
        'error',
        t('customerTrust.questionnaires.responseUrlRequired'),
      );
    setActing(id);
    try {
      await trustCenterService.updateQuestionnaireRequest(id, {
        status: 'COMPLETED',
        responseFileUrl: editUrl.trim(),
      });
      qc.invalidateQueries({ queryKey: ['trust-questionnaires'] });
      setEditId(null);
      setEditUrl('');
      showToast(
        'success',
        t('customerTrust.questionnaires.questionnaireCompleted'),
      );
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error ? e.message : t('errors.loadFailed'),
      );
    } finally {
      setActing(null);
    }
  }

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-green-50 text-green-700',
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.msg}
        </div>
      )}
      <p className="text-sm text-gray-500 mb-4">
        {t('customerTrust.questionnaires.subtitle')}
      </p>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {t('customerTrust.questionnaires.loading')}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileQuestion className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">
              {t('customerTrust.questionnaires.noRequests')}
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      t('customerTrust.questionnaires.columns.requester'),
                      t('customerTrust.questionnaires.columns.type'),
                      t('customerTrust.questionnaires.columns.status'),
                      t('customerTrust.questionnaires.columns.requested'),
                      t('customerTrust.questionnaires.columns.response'),
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <>
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">
                          {item.requesterEmail}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs capitalize">
                          {item.questionnaireType}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[item.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {fmt(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.responseFileUrl ? (
                            <a
                              href={item.responseFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {t('customerTrust.questionnaires.view')}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* AI Generate button */}
                            {item.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setAiPanelId(
                                    aiPanelId === item.id ? null : item.id,
                                  )
                                }
                                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
                                title={t(
                                  'customerTrust.questionnaires.generateAiDraft',
                                )}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {aiPanelId === item.id ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            )}

                            {/* Attach Response */}
                            {item.status !== 'COMPLETED' &&
                              (editId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder={t(
                                      'customerTrust.questionnaires.responsePlaceholder',
                                    )}
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleComplete(item.id)}
                                    disabled={acting === item.id}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {acting === item.id
                                      ? '…'
                                      : t('customerTrust.questionnaires.save')}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditId(null);
                                      setEditUrl('');
                                    }}
                                    className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditId(item.id);
                                    setEditUrl('');
                                  }}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {t(
                                    'customerTrust.questionnaires.attachResponse',
                                  )}
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>

                      {/* AI panel row */}
                      {aiPanelId === item.id && (
                        <tr key={`ai-${item.id}`}>
                          <td colSpan={6} className="px-4 pb-4">
                            <AiDraftPanel
                              requestId={item.id}
                              onClose={() => setAiPanelId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
