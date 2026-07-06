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
  label: string;
  icon: LucideIcon;
}

// Ordered — drives the grid layout. Keys must match the BE `cards` map.
const CARD_META: Array<[string, CardMeta]> = [
  ['aiSystems', { label: 'AI systems registered', icon: Boxes }],
  ['aiVendors', { label: 'AI vendors reviewed', icon: Store }],
  ['modelsWithCards', { label: 'Models with model cards', icon: FileText }],
  ['runtimeRisk', { label: 'Runtime risk status', icon: Activity }],
  [
    'driftThreshold',
    { label: 'Drift / threshold status', icon: AlertTriangle },
  ],
  ['agentTraceCoverage', { label: 'Agent trace coverage', icon: RouteIcon }],
  ['ragHygiene', { label: 'RAG / pipeline hygiene', icon: Workflow }],
  ['openAiRisks', { label: 'Open AI risks', icon: ShieldCheck }],
  [
    'openUseCaseApprovals',
    { label: 'Open use-case approvals', icon: GitBranch },
  ],
  [
    'trustCenterReadiness',
    { label: 'Trust Center readiness', icon: ShieldCheck },
  ],
  [
    'questionnaireCoverage',
    { label: 'Questionnaire coverage', icon: Sparkles },
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
            Coming soon
          </Badge>
        ) : card?.proxy ? (
          <Badge
            variant="outline"
            className="text-xs"
            title="Derived from a general register until a dedicated AI source is connected"
          >
            Proxy
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
      <div className="text-sm text-muted-foreground">{meta.label}</div>
    </Card>
  );
}

function Checklist({ items }: { items: TrustDashboard['checklist'] }) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3">Getting started</h2>
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
                Soon
              </Badge>
            ) : item.done ? null : (
              <Button asChild variant="ghost" size="sm">
                <Link to={item.href}>Start</Link>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AiTrustDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-trust', 'dashboard'],
    queryFn: () => aiTrustService.getDashboard(),
  });

  return (
    <PageTemplate
      title="AI TrustOps"
      description="Your AI trust posture at a glance — readiness, evidence, and what to connect next."
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : isError || !data ? (
        <Card className="p-6 text-center text-muted-foreground">
          Could not load the AI TrustOps dashboard. Retry shortly, or confirm
          your organisation has the AI Governance bundle enabled.
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
                AI Trust Readiness
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Weighted across the trust tasks you can complete today. Cards
              marked <em>Coming soon</em> unlock as runtime, agent-trace, and
              RAG telemetry sources land.
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
