/**
 * ActivationSummaryPage
 *
 * Shown immediately after a user activates a framework.
 * Receives the activation summary via router state (passed by FrameworksPage after mutation).
 * Provides a guided next-steps workflow.
 */

import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ListChecks,
  AlertTriangle,
  Link2,
  Target,
  Info,
  SkipForward,
  Clock,
} from 'lucide-react';
import type {
  ActivationSummaryDto,
  OrgFrameworkDto,
} from '@/services/api/frameworks';

// ── Framework color catalog (matches FrameworksPage) ─────────────────────────

const FRAMEWORK_COLORS: Record<string, string> = {
  'iso-27001': 'bg-blue-600',
  'soc-2': 'bg-violet-600',
  'nist-csf': 'bg-emerald-600',
  hipaa: 'bg-rose-600',
};

function frameworkColor(slug: string) {
  return FRAMEWORK_COLORS[slug] ?? 'bg-gray-600';
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  color,
  processing = false,
  processingLabel = 'Processing',
}: {
  value: number | string | null;
  label: string;
  color: string;
  /** Shows a pulsing clock when true or when value is null (async not yet resolved) */
  processing?: boolean;
  processingLabel?: string;
}) {
  const showPending = processing || value === null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm text-center">
      {showPending ? (
        <div className="flex items-center justify-center gap-1.5 py-1">
          <Clock className="w-4 h-4 text-gray-300 animate-pulse" />
          <span className="text-sm text-gray-400">{processingLabel}</span>
        </div>
      ) : (
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ── Next step card ────────────────────────────────────────────────────────────

function NextStepCard({
  stepNum,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  optional,
  optionalLabel = 'Optional',
}: {
  stepNum: number;
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  optional?: boolean;
  optionalLabel?: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
        {stepNum}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {optional && (
            <Badge
              variant="outline"
              className="text-xs text-gray-400 border-gray-200"
            >
              {optionalLabel}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onAction}
        className="flex-shrink-0"
      >
        {actionLabel} <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ActivationSummaryPage() {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  // Summary and orgFramework are passed via router state from FrameworksPage
  const state = location.state as {
    summary?: ActivationSummaryDto;
    orgFramework?: OrgFrameworkDto;
  } | null;

  const summary = state?.summary;
  const orgFw = state?.orgFramework;

  // If navigated directly without state, redirect to the detail page
  if (!slug) {
    navigate('/compliance/frameworks');
    return null;
  }

  const frameworkName = orgFw?.frameworkName ?? slug;
  const frameworkVersion = orgFw?.frameworkVersion;

  return (
    <PageTemplate
      title={t('activationSummary.title')}
      description={
        frameworkName + (frameworkVersion ? ` v${frameworkVersion}` : '')
      }
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ── Success header ── */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl ${frameworkColor(slug)} flex items-center justify-center flex-shrink-0`}
              >
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {summary?.isReactivation
                      ? t('activationSummary.reactivatedTitle')
                      : t('activationSummary.title')}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {t('activationSummary.scopeMessage', { name: frameworkName })}
                  {summary?.isReactivation && t('activationSummary.reactivationNote')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Setup summary stats ── */}
        {summary && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('activationSummary.setupSummary')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                value={summary.requirementsLoaded}
                label={t('activationSummary.requirementsLoaded')}
                color="text-blue-700"
                processingLabel={t('activationSummary.processing')}
              />
              <StatCard
                value={summary.mappingsSuggested}
                label={t('activationSummary.mappingsSuggested')}
                color="text-violet-700"
                processing={summary.mappingsProcessing}
                processingLabel={t('activationSummary.processing')}
              />
              <StatCard
                value={summary.testsLinkedOrCreated}
                label={t('activationSummary.testsLinkedOrCreated')}
                color="text-indigo-700"
                processing={summary.mappingsProcessing}
                processingLabel={t('activationSummary.processing')}
              />
              <StatCard
                value={summary.requirementsNeedingReview}
                label={t('activationSummary.needingReview')}
                color="text-amber-700"
                processingLabel={t('activationSummary.processing')}
              />
            </div>

            {/* Async processing notice */}
            {summary.mappingsProcessing && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  {t('activationSummary.mappingsProcessingNote')}
                </p>
              </div>
            )}

            {/* Other warnings */}
            {summary.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                    {t('activationSummary.notes')}
                  </p>
                </div>
                <ul className="space-y-1">
                  {summary.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-700">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* ── Next steps workflow ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('activationSummary.nextSteps')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 text-xs"
              onClick={() => navigate(`/compliance/frameworks/${slug}`)}
            >
              <SkipForward className="w-3.5 h-3.5 mr-1" />
              {t('activationSummary.doThisLater')}
            </Button>
          </div>

          <div className="space-y-2">
            <NextStepCard
              stepNum={1}
              icon={ListChecks}
              title={t('activationSummary.step1Title')}
              description={t('activationSummary.step1Desc')}
              actionLabel={t('activationSummary.review')}
              optionalLabel={t('activationSummary.optional')}
              onAction={() =>
                navigate(`/compliance/frameworks/${slug}`, {
                  state: { tab: 'requirements' },
                })
              }
            />
            <NextStepCard
              stepNum={2}
              icon={Link2}
              title={t('activationSummary.step2Title')}
              description={t('activationSummary.step2Desc')}
              actionLabel={t('activationSummary.review')}
              optionalLabel={t('activationSummary.optional')}
              onAction={() =>
                navigate(`/compliance/frameworks/${slug}`, {
                  state: { tab: 'controls' },
                })
              }
            />
            <NextStepCard
              stepNum={3}
              icon={Target}
              title={t('activationSummary.step3Title')}
              description={t('activationSummary.step3Desc')}
              actionLabel={t('activationSummary.review')}
              optionalLabel={t('activationSummary.optional')}
              onAction={() =>
                navigate(`/compliance/frameworks/${slug}`, {
                  state: { tab: 'policies' },
                })
              }
            />
            <NextStepCard
              stepNum={4}
              icon={AlertTriangle}
              title={t('activationSummary.step4Title')}
              description={t('activationSummary.step4Desc')}
              actionLabel={t('activationSummary.reviewGaps')}
              optionalLabel={t('activationSummary.optional')}
              onAction={() =>
                navigate(`/compliance/frameworks/${slug}`, {
                  state: { tab: 'gaps' },
                })
              }
            />
          </div>
        </div>

        {/* ── Primary CTA ── */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => navigate('/compliance/frameworks')}
          >
            {t('activationSummary.backToFrameworks')}
          </Button>
          <Button onClick={() => navigate(`/compliance/frameworks/${slug}`)}>
            {t('activationSummary.openFrameworkDetail')} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </PageTemplate>
  );
}
