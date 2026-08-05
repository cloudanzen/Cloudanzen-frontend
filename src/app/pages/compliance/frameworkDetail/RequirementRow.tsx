/**
 * frameworkDetail/RequirementRow.tsx — split out of FrameworkDetailPage.tsx in
 * Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  FlaskConical,
  FileText,
  AlertTriangle,
  User,
  Calendar,
} from 'lucide-react';
import { type RequirementDetailRow } from '@/services/api/frameworks';
import {
  controlStatusBadge,
  mappingTypeBadge,
  policyStatusBadge,
  requirementProgressLabel,
  riskLevelBadge,
  testStatusBadge,
} from './shared';

export function RequirementRow({
  req,
  isExpanded,
  onToggle,
  onOwnerClick,
  onNAClick,
  onMarkApplicable,
  navigate,
}: {
  req: RequirementDetailRow;
  isExpanded: boolean;
  onToggle: () => void;
  onOwnerClick: () => void;
  onNAClick: () => void;
  onMarkApplicable: () => void;
  navigate: (path: string) => void;
}) {
  const { t } = useTranslation('compliance');
  const hasControls = req.controls.length > 0;
  const hasTests = req.tests.length > 0;
  const hasPolicies = req.policies.length > 0;
  const hasRisks = req.risks.length > 0;
  const hasChildren = hasControls || hasTests || hasPolicies || hasRisks;

  const entityCount =
    req.controls.length +
    req.tests.length +
    req.policies.length +
    req.risks.length;

  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Summary row */}
      <div
        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 cursor-pointer group"
        onClick={hasChildren ? onToggle : undefined}
      >
        <div className="mt-0.5 w-4 shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )
          ) : (
            <span className="block w-4" />
          )}
        </div>
        <span className="font-mono text-xs text-gray-400 w-16 shrink-0 mt-0.5">
          {req.code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{req.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {(req.ownerName || req.ownerId) && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" /> {req.ownerName ?? req.ownerId}
              </span>
            )}
            {req.dueDate && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />{' '}
                {new Date(req.dueDate).toLocaleDateString()}
              </span>
            )}
            {entityCount > 0 && (
              <span className="text-xs text-gray-300">
                {t('frameworkDetail.requirement.linkedItems', {
                  count: entityCount,
                })}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-gray-500 sm:text-right whitespace-nowrap">
            {requirementProgressLabel(req, t)}
          </span>
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              title={t('frameworkDetail.requirement.assignOwner')}
              onClick={(e) => {
                e.stopPropagation();
                onOwnerClick();
              }}
            >
              {req.ownerId
                ? t('frameworkDetail.requirement.reassign')
                : t('frameworkDetail.requirement.assign')}
            </Button>
            {!req.isMandatory &&
              (req.applicabilityStatus === 'applicable' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  title={t('frameworkDetail.requirement.markNA')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNAClick();
                  }}
                >
                  {t('frameworkDetail.requirement.notApplicable')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs border-blue-200 text-blue-600 hover:text-blue-700"
                  title={t('frameworkDetail.requirement.markApplicable')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkApplicable();
                  }}
                >
                  {t('frameworkDetail.requirement.applicable')}
                </Button>
              ))}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && hasChildren && (
        <div className="pl-12 pr-4 pb-4 space-y-3">
          {/* N/A justification */}
          {req.applicabilityStatus === 'not_applicable' &&
            req.justification && (
              <div className="text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                {t('frameworkDetail.badge.notApplicable')} — {req.justification}
              </div>
            )}

          {/* Controls */}
          {hasControls && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />{' '}
                {t('frameworkDetail.requirement.controlsCount', {
                  count: req.controls.length,
                })}
              </p>
              <div className="space-y-1">
                {req.controls.map((c) => (
                  <div
                    key={c.controlId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() =>
                      navigate(`/compliance/controls?highlight=${c.controlId}`)
                    }
                  >
                    <span className="font-mono text-[11px] text-blue-600 shrink-0">
                      {c.isoReference}
                    </span>
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {c.controlTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {mappingTypeBadge(c.mappingType, t)}
                      {controlStatusBadge(c.controlStatus, t)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests */}
          {hasTests && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3" />{' '}
                {t('frameworkDetail.requirement.testsCount', {
                  count: req.tests.length,
                })}
              </p>
              <div className="space-y-1">
                {req.tests.map((test) => (
                  <div
                    key={test.testId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => navigate(`/validations/${test.testId}`)}
                  >
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {test.testName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {test.dueDate && !test.completedAt && (
                        <span className="text-[10px] text-gray-400">
                          {t('frameworkDetail.requirement.due', {
                            date: new Date(test.dueDate).toLocaleDateString(),
                          })}
                        </span>
                      )}
                      {testStatusBadge(test.testStatus, t)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies */}
          {hasPolicies && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />{' '}
                {t('frameworkDetail.requirement.policiesCount', {
                  count: req.policies.length,
                })}
              </p>
              <div className="space-y-1">
                {req.policies.map((p) => (
                  <div
                    key={p.policyId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() =>
                      navigate(`/compliance/policies?highlight=${p.policyId}`)
                    }
                  >
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {p.policyName}
                    </span>
                    {policyStatusBadge(p.policyStatus, t)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {hasRisks && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />{' '}
                {t('frameworkDetail.requirement.risksCount', {
                  count: req.risks.length,
                })}
              </p>
              <div className="space-y-1">
                {req.risks.map((r) => (
                  <div
                    key={r.riskId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => navigate(`/risk/risks/${r.riskId}`)}
                  >
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {r.riskTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {riskLevelBadge(r.riskLevel, t)}
                      <Badge
                        variant="outline"
                        className="text-[11px] text-gray-500"
                      >
                        {r.riskStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Domain Section ───────────────────────────────────────────────────────────
