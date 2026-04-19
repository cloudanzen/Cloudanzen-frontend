/**
 * QuestionnaireAssistantPage.tsx — AI-3: Security questionnaire answer generation
 *
 * Allows users to:
 * 1. Enter a security questionnaire question
 * 2. Generate a draft answer with cited sources (powered by the RAG pipeline)
 * 3. Review, edit, and approve the answer for reuse
 * 4. View and reuse previously approved answers
 *
 * Design rules:
 * - All AI output is PENDING_REVIEW — users must approve before an answer is "official"
 * - Approved answers are stored and reused for similar future questions
 * - Citations are shown so users can verify sources
 * - AI failure never blocks the workflow — fallback to manual entry is always available
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  WandSparkles,
  X,
} from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  aiService,
  QuestionnaireAnswerResult,
  ApprovedQuestionnaireAnswer,
} from '@/services/api/ai';
import { CitationViewer } from '@/app/components/CitationViewer';
import { COPY_FEEDBACK_MS } from '@/lib/constants';

const CONFIDENCE_META: Record<
  'HIGH' | 'MEDIUM' | 'LOW',
  {
    labelKey: string;
    tone: string;
    chip: string;
    panel: string;
    hintKey: string;
  }
> = {
  HIGH: {
    labelKey: 'questionnaire.confidence.high.label',
    tone: 'text-emerald-800',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    panel: 'border-emerald-200 bg-emerald-50/80',
    hintKey: 'questionnaire.confidence.high.hint',
  },
  MEDIUM: {
    labelKey: 'questionnaire.confidence.medium.label',
    tone: 'text-amber-800',
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    panel: 'border-amber-200 bg-amber-50/80',
    hintKey: 'questionnaire.confidence.medium.hint',
  },
  LOW: {
    labelKey: 'questionnaire.confidence.low.label',
    tone: 'text-rose-800',
    chip: 'border-rose-200 bg-rose-50 text-rose-700',
    panel: 'border-rose-200 bg-rose-50/80',
    hintKey: 'questionnaire.confidence.low.hint',
  },
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>
    </div>
  );
}

function WorkflowHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function GenerationPanel({
  result,
  onApprove,
  onDismiss,
  isApproving,
  isDismissing,
}: {
  result: QuestionnaireAnswerResult;
  onApprove: (editedText: string) => void;
  onDismiss: () => void;
  isApproving: boolean;
  isDismissing: boolean;
}) {
  const { t } = useTranslation('ai');
  const [editedText, setEditedText] = useState(result.draftAnswer);
  const [copied, setCopied] = useState(false);
  const confidenceMeta = CONFIDENCE_META[result.confidence];

  function handleCopy() {
    navigator.clipboard.writeText(editedText).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border px-4 py-4 shadow-sm ${confidenceMeta.panel}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/80 p-2.5 shadow-sm">
              <Sparkles className={`h-4 w-4 ${confidenceMeta.tone}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  AI draft ready for review
                </p>
                <Badge className={confidenceMeta.chip} variant="outline">
                  {t(confidenceMeta.labelKey)}
                </Badge>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t(confidenceMeta.hintKey)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-56">
            <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Sources
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {result.citations.length}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Status
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                Pending review
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Draft answer</p>
            <p className="mt-1 text-sm text-slate-500">
              Edit tone, scope, and specificity before approving for reuse.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-slate-200 text-slate-700"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy draft'}
          </Button>
        </div>
        <div className="px-5 py-5">
          <Textarea
            className="min-h-[240px] resize-y rounded-2xl border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-7 text-slate-700"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Edit the draft answer before approving..."
          />
          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Approved answers are saved for future questionnaires and response
              reuse.
            </p>
            <p>{editedText.trim().length} characters</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-full bg-white p-2 shadow-sm">
            <BookOpen className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Evidence trace
            </p>
            <p className="text-sm text-slate-500">
              Open the cited excerpts and confirm they support the response.
            </p>
          </div>
        </div>
        <CitationViewer
          citations={result.citations}
          label="Sources used"
          className="pt-1"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Only approved answers become part of your reusable response library.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onDismiss}
            disabled={isApproving || isDismissing}
            className="border-slate-200 text-slate-700"
          >
            {isDismissing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsDown className="h-4 w-4" />
            )}
            Dismiss draft
          </Button>
          <Button
            onClick={() => onApprove(editedText)}
            disabled={isApproving || isDismissing || !editedText.trim()}
            className="bg-slate-950 text-white hover:bg-slate-800"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
            Approve and save
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApprovedAnswerItem({
  answer,
}: {
  answer: ApprovedQuestionnaireAnswer;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(answer.approvedAnswer).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              Approved answer
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock3 className="h-3 w-3" />
              {new Date(answer.approvedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-900">
            {answer.question}
          </p>
        </button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="size-8 text-slate-500 hover:text-slate-900"
            title="Copy answer"
          >
            <Copy className="h-4 w-4" />
            {copied && <span className="sr-only">Copied</span>}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((prev) => !prev)}
            className="size-8 text-slate-500 hover:text-slate-900"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {answer.approvedAnswer}
          </p>
        </div>
      )}
    </div>
  );
}

export function QuestionnaireAssistantPage() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentGeneration, setCurrentGeneration] =
    useState<QuestionnaireAnswerResult | null>(null);
  const [generationDismissed, setGenerationDismissed] = useState(false);
  const [generationApproved, setGenerationApproved] = useState(false);

  const approvedQuery = useQuery({
    queryKey: ['ai-approved-answers'],
    queryFn: () => aiService.listApprovedAnswers(),
  });

  const generateMutation = useMutation({
    mutationFn: ({ q, ctx }: { q: string; ctx?: string }) =>
      aiService.generateQuestionnaireAnswer(q, ctx),
    onSuccess: (data) => {
      setCurrentGeneration(data.data);
      setGenerationDismissed(false);
      setGenerationApproved(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approvedText }: { id: string; approvedText: string }) =>
      aiService.approveQuestionnaireAnswer(id, approvedText),
    onSuccess: () => {
      setGenerationApproved(true);
      queryClient.invalidateQueries({ queryKey: ['ai-approved-answers'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => aiService.dismissQuestionnaireAnswer(id),
    onSuccess: () => {
      setGenerationDismissed(true);
    },
  });

  function handleGenerate() {
    if (!question.trim()) return;
    setCurrentGeneration(null);
    generateMutation.mutate({
      q: question.trim(),
      ctx: context.trim() || undefined,
    });
  }

  function handleApprove(editedText: string) {
    if (!currentGeneration) return;
    approveMutation.mutate({
      id: currentGeneration.generationId,
      approvedText: editedText,
    });
  }

  function handleDismiss() {
    if (!currentGeneration) return;
    dismissMutation.mutate(currentGeneration.generationId);
  }

  const approvedAnswers = approvedQuery.data?.data ?? [];
  const filteredAnswers = searchQuery.trim()
    ? approvedAnswers.filter(
        (a) =>
          a.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.approvedAnswer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : approvedAnswers;

  return (
    <PageTemplate
      title="Questionnaire Assistant"
      description="Produce polished, evidence-backed customer responses with review controls your security team can trust."
    >
      <div className="space-y-6">
        <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_42%,#eef4ff_100%)] shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1.5fr_0.9fr]">
              <div className="border-b border-slate-200/80 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-slate-950 text-white">
                    AI Workspace
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-sky-200 bg-sky-50 text-sky-700"
                  >
                    Evidence-backed drafts
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700"
                  >
                    Human approval required
                  </Badge>
                </div>

                <div className="mt-6 max-w-3xl">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                    Customer due diligence
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Turn security questionnaires into a fast, reviewable
                    workflow.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                    Draft consistent answers from your policies and documents,
                    inspect the cited evidence, then save the approved response
                    for future reuse.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <StatCard
                    label="Approved answers"
                    value={String(approvedAnswers.length)}
                    hint="Reusable responses already curated by your team"
                  />
                  <StatCard
                    label="Current citations"
                    value={String(currentGeneration?.citations.length ?? 0)}
                    hint="Evidence surfaced for the active draft"
                  />
                  <StatCard
                    label="Review model"
                    value="Manual"
                    hint="Nothing is published until a reviewer approves it"
                  />
                </div>
              </div>

              <div className="bg-slate-950 px-6 py-7 text-slate-50 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <ShieldCheck className="h-5 w-5 text-sky-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Response standards</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Keep answers concise, factual, and scoped to verified
                      controls.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <WorkflowHint
                    title="Ground every answer"
                    body="Use the draft as a starting point, then confirm every claim against the cited evidence before approval."
                  />
                  <WorkflowHint
                    title="Capture buyer context"
                    body="Add renewal stage, framework references, or product boundaries to improve relevance and reviewer speed."
                  />
                  <WorkflowHint
                    title="Build institutional memory"
                    body="Approved answers become your response library, reducing repetitive work across future questionnaires."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.95fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-slate-950 p-2 text-white">
                        <WandSparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-950">
                          Draft workspace
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm leading-6 text-slate-500">
                          Ask one customer question at a time, enrich it with
                          context, and generate a reviewable answer.
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-600"
                    >
                      Cmd + Enter to generate
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-600"
                    >
                      Reusable approvals
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">
                        Questionnaire prompt
                      </label>
                      <Textarea
                        className="min-h-[180px] resize-y rounded-2xl border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-7 text-slate-700"
                        placeholder="e.g. Describe your access control approach, MFA coverage, and quarterly access review process for production systems."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                          Use the customer’s exact wording to improve
                          traceability and review speed.
                        </p>
                        <p>{question.trim().length} characters</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <button
                        className="flex w-full items-center justify-between gap-3 text-left"
                        onClick={() => setShowContextInput((prev) => !prev)}
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-white p-2 shadow-sm">
                            {showContextInput ? (
                              <X className="h-4 w-4 text-slate-600" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Add request context
                            </p>
                            <p className="text-sm text-slate-500">
                              Buyer stage, framework, product scope, or response
                              tone.
                            </p>
                          </div>
                        </div>
                        {showContextInput ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </button>

                      {showContextInput && (
                        <div className="mt-4">
                          <Textarea
                            className="min-h-[120px] resize-y rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700"
                            placeholder="Optional: This is for a SOC 2 renewal with an enterprise buyer who wants concise answers focused on production access controls and policy references."
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-500">
                        The assistant drafts an answer, but your team remains
                        the final approver.
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {(question || context) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setQuestion('');
                              setContext('');
                              setShowContextInput(false);
                            }}
                            className="border-slate-200 text-slate-700"
                          >
                            Clear
                          </Button>
                        )}
                        <Button
                          onClick={handleGenerate}
                          disabled={
                            !question.trim() || generateMutation.isPending
                          }
                          className="bg-slate-950 text-white hover:bg-slate-800"
                        >
                          {generateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Generate answer
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Review checklist
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Keep it buyer-ready
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Prefer crisp, declarative language over long policy
                          excerpts.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Verify every claim
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Open the cited excerpts before approving
                          customer-facing content.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Save strong responses
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Each approval improves consistency across future
                          diligence cycles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {generateMutation.isError && (
              <Card className="border-rose-200 bg-rose-50/80 shadow-sm">
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    <X className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-800">
                      Generation failed
                    </p>
                    <p className="mt-1 text-sm leading-6 text-rose-700">
                      Try again, adjust the question, or draft the response
                      manually.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentGeneration &&
              !generationDismissed &&
              !generationApproved && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-950 p-2 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-950">
                          Generated draft
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-slate-500">
                          Review the draft, verify its evidence, and approve
                          only when it reflects your controls accurately.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <GenerationPanel
                      result={currentGeneration}
                      onApprove={handleApprove}
                      onDismiss={handleDismiss}
                      isApproving={approveMutation.isPending}
                      isDismissing={dismissMutation.isPending}
                    />
                  </CardContent>
                </Card>
              )}

            {generationApproved && (
              <Card className="border-emerald-200 bg-emerald-50/70 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        Answer approved and saved to your library
                      </p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        This response can now be reused as a vetted starting
                        point for similar questionnaires.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
                    onClick={() => {
                      setQuestion('');
                      setContext('');
                      setCurrentGeneration(null);
                      setGenerationApproved(false);
                    }}
                  >
                    Ask another question
                  </Button>
                </CardContent>
              </Card>
            )}

            {generationDismissed && (
              <Card className="border-slate-200 bg-slate-50/80 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Draft dismissed
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Adjust the question, add more context, or draft a manual
                      response.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700"
                    onClick={() => {
                      setCurrentGeneration(null);
                      setGenerationDismissed(false);
                    }}
                  >
                    Try a different approach
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm xl:sticky xl:top-6">
              <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-950">
                        Answer library
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm leading-6 text-slate-500">
                        Approved answers your team can safely reuse and adapt.
                      </CardDescription>
                    </div>
                    <Badge className="bg-slate-950 text-white">
                      {approvedAnswers.length} saved
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Searchable
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Response memory
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Library size
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {approvedAnswers.length} answers
                      </p>
                    </div>
                  </div>

                  {approvedAnswers.length > 3 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        className="h-11 rounded-2xl border-slate-200 bg-white pl-10 pr-4 text-sm"
                        placeholder="Search approved answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {approvedQuery.isLoading && (
                  <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                )}

                {!approvedQuery.isLoading && filteredAnswers.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      {searchQuery
                        ? 'No matching answers found'
                        : 'No approved answers yet'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {searchQuery
                        ? 'Try a different phrase or search by control language.'
                        : 'Approve strong drafts to create a reusable response library.'}
                    </p>
                  </div>
                )}

                <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
                  {filteredAnswers.map((answer) => (
                    <ApprovedAnswerItem key={answer.id} answer={answer} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
