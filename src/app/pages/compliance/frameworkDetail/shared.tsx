/**
 * frameworkDetail/shared.tsx — badge renderers, requirement-progress helpers
 * and the filter type used across the framework detail sections.
 *
 * Extracted verbatim from FrameworkDetailPage.tsx during the Phase 4 split.
 */

import type { TFunction } from 'i18next';
import { Badge } from '@/app/components/ui/badge';
import { type RequirementDetailRow } from '@/services/api/frameworks';

export type FilterMode = 'all' | 'gaps' | 'excluded';

export function controlStatusBadge(status: string, t: TFunction) {
  if (status === 'IMPLEMENTED')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.implemented')}
      </Badge>
    );
  if (status === 'PARTIALLY_IMPLEMENTED')
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
        {t('frameworkDetail.badge.partial')}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-gray-400 text-[11px]">
      {t('frameworkDetail.badge.notImplemented')}
    </Badge>
  );
}

export function testStatusBadge(status: string, t: TFunction) {
  if (status === 'OK')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.ok')}
      </Badge>
    );
  if (status === 'Overdue')
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px]">
        {t('frameworkDetail.badge.overdue')}
      </Badge>
    );
  if (status === 'Due_soon')
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
        {t('frameworkDetail.badge.dueSoon')}
      </Badge>
    );
  if (status === 'Needs_remediation')
    return (
      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[11px]">
        {t('frameworkDetail.badge.needsRemediation')}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-gray-400 text-[11px]">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

export function policyStatusBadge(status: string, t: TFunction) {
  if (status === 'PUBLISHED')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.published')}
      </Badge>
    );
  if (status === 'DRAFT')
    return (
      <Badge variant="outline" className="text-gray-400 text-[11px]">
        {t('frameworkDetail.badge.draft')}
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
      {status}
    </Badge>
  );
}

export function riskLevelBadge(level: string | null, t: TFunction) {
  if (level === 'CRITICAL')
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px]">
        {t('frameworkDetail.badge.critical')}
      </Badge>
    );
  if (level === 'HIGH')
    return (
      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[11px]">
        {t('frameworkDetail.badge.high')}
      </Badge>
    );
  if (level === 'MEDIUM')
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[11px]">
        {t('frameworkDetail.badge.medium')}
      </Badge>
    );
  if (level === 'LOW')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.low')}
      </Badge>
    );
  return null;
}

export function getRequirementProgress(req: RequirementDetailRow) {
  const completedControls = req.controls.filter(
    (control) => control.controlStatus === 'IMPLEMENTED',
  ).length;
  const completedTests = req.tests.filter(
    (test) => test.testStatus === 'OK',
  ).length;
  const completedPolicies = req.policies.filter(
    (policy) => policy.policyStatus === 'PUBLISHED',
  ).length;
  const total = req.controls.length + req.tests.length + req.policies.length;

  return {
    completed: completedControls + completedTests + completedPolicies,
    total,
  };
}

export function requirementProgressLabel(
  req: RequirementDetailRow,
  t: TFunction,
) {
  const progress = getRequirementProgress(req);
  if (progress.total === 0) {
    return t('frameworkDetail.requirement.noMappedItems');
  }
  return t('frameworkDetail.requirement.progress', progress);
}

export function mappingTypeBadge(type: string, t: TFunction) {
  if (type === 'direct')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5">
        {t('frameworkDetail.badge.confirmed')}
      </Badge>
    );
  if (type === 'inherited')
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5">
        {t('frameworkDetail.badge.inherited')}
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5">
      {t('frameworkDetail.badge.suggested')}
    </Badge>
  );
}

// ── Coverage Tiles ───────────────────────────────────────────────────────────
