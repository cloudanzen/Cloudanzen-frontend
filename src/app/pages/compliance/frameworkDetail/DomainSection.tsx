/**
 * frameworkDetail/DomainSection.tsx — split out of FrameworkDetailPage.tsx in
 * Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { type RequirementDetailRow } from '@/services/api/frameworks';
import { RequirementRow } from './RequirementRow';

export function DomainSection({
  domain,
  requirements,
  isExpanded,
  onToggle,
  expandedReqs,
  onToggleReq,
  onOwnerClick,
  onNAClick,
  onMarkApplicable,
  navigate,
}: {
  domain: string;
  requirements: RequirementDetailRow[];
  isExpanded: boolean;
  onToggle: () => void;
  expandedReqs: Set<string>;
  onToggleReq: (id: string) => void;
  onOwnerClick: (req: RequirementDetailRow) => void;
  onNAClick: (req: RequirementDetailRow) => void;
  onMarkApplicable: (req: RequirementDetailRow) => void;
  navigate: (path: string) => void;
}) {
  const { t } = useTranslation('compliance');
  const implemented = requirements.filter((r) =>
    r.controls.some((c) => c.controlStatus === 'IMPLEMENTED'),
  ).length;
  const applicable = requirements.filter(
    (r) => r.applicabilityStatus === 'applicable',
  ).length;
  const pct = applicable > 0 ? Math.round((implemented / applicable) * 100) : 0;

  return (
    <Card className="border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50/80 hover:bg-gray-100/80 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        <span className="text-sm font-semibold text-gray-700 flex-1">
          {domain}
        </span>
        <span className="text-xs text-gray-400 mr-3">
          {t('frameworkDetail.requirement.requirementsCount', {
            count: requirements.length,
          })}
        </span>
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 w-10 text-right shrink-0">
          {pct}%
        </span>
      </button>
      {isExpanded && (
        <div>
          {requirements.map((req) => (
            <RequirementRow
              key={req.id}
              req={req}
              isExpanded={expandedReqs.has(req.id)}
              onToggle={() => onToggleReq(req.id)}
              onOwnerClick={() => onOwnerClick(req)}
              onNAClick={() => onNAClick(req)}
              onMarkApplicable={() => onMarkApplicable(req)}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Export Button ─────────────────────────────────────────────────────────────
