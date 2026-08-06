/**
 * AiTrustDashboardPage.tsx — AI TrustOps dashboard (Phase 3).
 *
 * Lands at `/ai-trust` for AI-native orgs (the Phase 2 redirect to
 * `/ai-trust/chat` is replaced by this page). Reads the aggregate
 * posture from `GET /api/ai/trust/dashboard`: a weighted readiness
 * score, a grid of cards, and the onboarding checklist.
 *
 * Cards whose telemetry lands in Phase 4+ report `status: 'coming_soon'`
 * and render as disabled tiles. `proxy` cards read from an existing
 * generic register (Vendor / Risk) that has no AI-specific tag yet.
 */

import { useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Circle,
  FileText,
  GitBranch,
  Loader2,
  Activity,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Store,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  aiTrustService,
  type DashboardCard,
  type TrustDashboard,
} from '@/services/api/aiTrust';

interface CardMeta {
  /** i18n key under `trustDashboard.cards`. */
  labelKey: string;
  icon: LucideIcon;
}

// Ordered — drives the grid layout. Keys must match the BE `cards` map.
const CARD_META: Array<[string, CardMeta]> = [
  ['aiSystems', { labelKey: 'aiSystems', icon: Boxes }],
  ['aiVendors', { labelKey: 'aiVendors', icon: Store }],
  ['modelsWithCards', { labelKey: 'modelsWithCards', icon: FileText }],
  ['runtimeRisk', { labelKey: 'runtimeRisk', icon: Activity }],
  ['driftThreshold', { labelKey: 'driftThreshold', icon: AlertTriangle }],
  ['agentTraceCoverage', { labelKey: 'agentTraceCoverage', icon: RouteIcon }],
  ['ragHygiene', { labelKey: 'ragHygiene', icon: Workflow }],
  ['openAiRisks', { labelKey: 'openAiRisks', icon: ShieldCheck }],
  [
    'openUseCaseApprovals',
    { labelKey: 'openUseCaseApprovals', icon: GitBranch },
  ],
  [
    'trustCenterReadiness',
    { labelKey: 'trustCenterReadiness', icon: ShieldCheck },
  ],
  [
    'questionnaireCoverage',
    { labelKey: 'questionnaireCoverage', icon: Sparkles },
  ],
];

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

const TONE_COLORS: Record<string, string> = {
  positive: 'text-emerald-600',
  warning: 'text-amber-600',
  critical: 'text-rose-600',
  neutral: 'text-muted-foreground',
};

function MetricCard({
  meta,
  card,
}: {
  meta: CardMeta;
  card: DashboardCard | undefined;
}) {
  const { t } = useTranslation('ai');
  const Icon = meta.icon;
  const comingSoon = card?.status === 'coming_soon';
  const hasLabel = !comingSoon && typeof card?.label === 'string';
  return (
    <Card
      className={`p-4 flex flex-col gap-2 ${comingSoon ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {comingSoon ? (
          <Badge variant="outline" className="text-xs">
            {t('trustDashboard.comingSoon')}
          </Badge>
        ) : card?.proxy ? (
          <Badge
            variant="outline"
            className="text-xs"
            title={t('trustDashboard.proxyTooltip')}
          >
            {t('trustDashboard.proxy')}
          </Badge>
        ) : null}
      </div>
      {hasLabel ? (
        <div
          className={`text-2xl font-semibold ${TONE_COLORS[card?.tone ?? 'neutral']}`}
        >
          {card?.label}
        </div>
      ) : (
        <div className="text-2xl font-semibold">
          {comingSoon ? '—' : (card?.value ?? 0)}
        </div>
      )}
      <div className="text-sm text-muted-foreground">
        {t(`trustDashboard.cards.${meta.labelKey}`)}
      </div>
    </Card>
  );
}

function Checklist({ items }: { items: TrustDashboard['checklist'] }) {
  const { t } = useTranslation('ai');

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3">
        {t('trustDashboard.gettingStarted')}
      </h2>
      <ul className="divide-y">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between py-2.5"
          >
            <div className="flex items-center gap-2.5">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span
                className={
                  item.done ? 'text-muted-foreground line-through' : ''
                }
              >
                {item.label}
              </span>
            </div>
            {item.comingSoon ? (
              <Badge variant="outline" className="text-xs">
                {t('trustDashboard.soon')}
              </Badge>
            ) : item.done ? null : (
              <Button asChild variant="ghost" size="sm">
                <Link to={item.href}>{t('trustDashboard.start')}</Link>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AiTrustDashboardPage() {
  const { t } = useTranslation('ai');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-trust', 'dashboard'],
    queryFn: () => aiTrustService.getDashboard(),
  });

  return (
    <PageTemplate
      title={t('trustDashboard.title')}
      description={t('trustDashboard.description')}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : isError || !data ? (
        <Card className="p-6 text-center text-muted-foreground">
          {t('trustDashboard.loadError')}
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span
                className={`text-5xl font-bold ${scoreColor(data.readinessScore)}`}
              >
                {data.readinessScore}
                <span className="text-2xl">%</span>
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {t('trustDashboard.readiness')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              <Trans
                i18nKey="trustDashboard.readinessNote"
                ns="ai"
                components={[<em key="0" />]}
              />
            </p>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CARD_META.map(([key, meta]) => (
              <MetricCard key={key} meta={meta} card={data.cards[key]} />
            ))}
          </div>

          <Checklist items={data.checklist} />
        </div>
      )}
    </PageTemplate>
  );
}
