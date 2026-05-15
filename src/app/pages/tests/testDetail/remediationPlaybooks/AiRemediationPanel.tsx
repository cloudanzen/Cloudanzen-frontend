import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AlertTriangle, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { aiService } from '@/services/api/ai';
import { testsService, type AiRemediationGuide } from '@/services/api/tests';
import { ApiError } from '@/services/api/client';

/**
 * Tier 2 BYOK AI-tailored remediation panel.
 *
 * Rendering rules:
 *  - The panel hides itself entirely when `aiService.getConfig()` reports
 *    `!configured || !enabled`. The backend is still the source of truth
 *    (returns 412 BYOK_REQUIRED if hit directly), but the FE gate keeps
 *    the button out of sight when AI is clearly not set up.
 *  - The user must click to generate; we never auto-fire on render.
 *  - Force-regenerate requires a confirmation. The endpoint is rate
 *    limited per org by the backend, so confirmation guards against
 *    accidental clicks more than abuse.
 *  - The model is asked to return JSON. If parsing fails we fall back to
 *    rendering the raw outputText — the prompt contract requires JSON
 *    but we treat fallbacks defensively rather than crashing the panel.
 */

type ParsedGuide = {
  whatFailed?: string;
  whyItMatters?: string;
  fixPath?: string;
  steps?: string[];
  evidence?: string[];
  verify?: string[];
  pitfalls?: string[];
};

function tryParse(text: string): ParsedGuide | null {
  try {
    const obj = JSON.parse(text) as unknown;
    if (obj && typeof obj === 'object') return obj as ParsedGuide;
  } catch {
    /* fall through */
  }
  return null;
}

function ErrorBlock({ error }: { error: unknown }) {
  const { t } = useTranslation('tests');
  if (error instanceof ApiError) {
    if (error.statusCode === 412) {
      return (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-semibold">
            {t('remediation.ai.errors.byokRequired')}
          </p>
          <p className="mt-1 text-xs">
            <Link to="/settings/ai" className="underline">
              {t('remediation.ai.errors.byokRequiredCta')}
            </Link>
          </p>
        </div>
      );
    }
    if (error.statusCode === 409) {
      return (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {t('remediation.ai.errors.noPlaybook')}
        </div>
      );
    }
    if (error.statusCode === 503) {
      return (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t('remediation.ai.errors.providerUnavailable')}
        </div>
      );
    }
    if (error.statusCode === 429) {
      return (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t('remediation.ai.errors.rateLimited')}
        </div>
      );
    }
    if (error.statusCode === 403) {
      return (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t('remediation.ai.errors.forbidden')}
        </div>
      );
    }
  }
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {t('remediation.ai.errors.generic')}
    </div>
  );
}

function GeneratedGuide({ guide }: { guide: AiRemediationGuide }) {
  const { t } = useTranslation('tests');
  const parsed = tryParse(guide.outputText);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-purple-900/80">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-semibold">
          {t('remediation.ai.tailoredHeader')}
        </span>
        {guide.cached && (
          <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-800">
            {t('remediation.ai.cachedBadge')}
          </span>
        )}
        <span className="opacity-70">
          {guide.provider} / {guide.model}
          {guide.inputTokens !== null && guide.outputTokens !== null
            ? ` · ${guide.inputTokens + guide.outputTokens} ${t('remediation.ai.tokens')}`
            : null}
        </span>
      </div>

      {parsed ? (
        <div className="space-y-3 text-sm text-gray-800">
          {parsed.whatFailed && (
            <p>
              <strong className="text-gray-900">
                {t('remediation.playbook.whyItMatters')}:
              </strong>{' '}
              {parsed.whatFailed}
            </p>
          )}
          {parsed.fixPath && (
            <p>
              <strong className="text-gray-900">
                {t('remediation.playbook.fixPath')}:
              </strong>{' '}
              {parsed.fixPath}
            </p>
          )}
          {parsed.steps && parsed.steps.length > 0 && (
            <ol className="ml-4 list-decimal space-y-1">
              {parsed.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {parsed.evidence && parsed.evidence.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('remediation.playbook.evidence')}
              </p>
              <ul className="ml-4 list-disc">
                {parsed.evidence.map((ev) => (
                  <li key={ev}>{ev}</li>
                ))}
              </ul>
            </div>
          )}
          {parsed.verify && parsed.verify.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('remediation.playbook.verify')}
              </p>
              <ul className="ml-4 list-disc">
                {parsed.verify.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          )}
          {parsed.pitfalls && parsed.pitfalls.length > 0 && (
            <div>
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {t('remediation.playbook.pitfalls')}
              </p>
              <ul className="ml-4 list-disc text-amber-900">
                {parsed.pitfalls.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-xs text-gray-800">
          {guide.outputText}
        </pre>
      )}
    </div>
  );
}

export function AiRemediationPanel({ testId }: { testId: string }) {
  const { t } = useTranslation('tests');
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  const configQuery = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => aiService.getConfig(),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (forceRegenerate: boolean) =>
      testsService.generateAiRemediation(testId, { forceRegenerate }),
  });

  const cfg = configQuery.data;
  if (!cfg || !cfg.configured || !cfg.enabled) {
    return null;
  }

  const guide = mutation.data?.data ?? null;
  const isGenerating = mutation.isPending;

  function generate(force = false) {
    setConfirmingRegenerate(false);
    mutation.mutate(force);
  }

  return (
    <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-700" />
          <p className="text-sm font-semibold text-purple-900">
            {t('remediation.ai.title')}
          </p>
        </div>
        {!guide && !isGenerating && (
          <button
            type="button"
            onClick={() => generate(false)}
            className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
          >
            <Sparkles className="h-3 w-3" />
            {t('remediation.ai.generate')}
          </button>
        )}
        {guide && !isGenerating && !confirmingRegenerate && (
          <button
            type="button"
            onClick={() => setConfirmingRegenerate(true)}
            className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-white px-3 py-1.5 text-xs font-medium text-purple-800 hover:bg-purple-100"
          >
            <RefreshCw className="h-3 w-3" />
            {t('remediation.ai.regenerate')}
          </button>
        )}
        {confirmingRegenerate && (
          <div className="flex items-center gap-2 text-xs text-purple-900">
            <span>{t('remediation.ai.regenerateConfirm')}</span>
            <button
              type="button"
              onClick={() => generate(true)}
              className="rounded bg-purple-600 px-2 py-1 text-white hover:bg-purple-700"
            >
              {t('remediation.ai.regenerateConfirmYes')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRegenerate(false)}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-700 hover:bg-gray-50"
            >
              {t('remediation.ai.regenerateConfirmNo')}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-purple-900/80">
        {t('remediation.ai.description')}
      </p>

      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-purple-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('remediation.ai.generating')}
        </div>
      )}

      {mutation.isError && <ErrorBlock error={mutation.error} />}
      {guide && !isGenerating && <GeneratedGuide guide={guide} />}
    </div>
  );
}
