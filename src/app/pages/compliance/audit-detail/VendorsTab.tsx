/**
 * audit-detail/VendorsTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Building2 } from 'lucide-react';
import { vendorsService, VendorRecord } from '@/services/api/vendors';
import { fmt } from '../AuditDetailPanel';

const VENDOR_STATUS_COLORS: Record<string, string> = {
  MONITORED: 'bg-green-50 text-green-700',
  ASSESSMENT_DUE: 'bg-amber-50 text-amber-700',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  BLOCKED: 'bg-red-50 text-red-700',
};

const VENDOR_TIER_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-700',
  HIGH: 'bg-orange-50 text-orange-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  LOW: 'bg-slate-100 text-slate-600',
};

export function VendorsTab() {
  const { t } = useTranslation('compliance');
  const { data, isLoading } = useQuery<VendorRecord[]>({
    queryKey: ['vendors'],
    queryFn: () => vendorsService.list(),
  });
  const vendors = data ?? [];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {t('auditDetail.vendors.loading')}
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        {t('auditDetail.vendors.noVendors')}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {t('auditDetail.vendors.rosterTitle')}
        </span>
        <Badge variant="secondary" className="ml-auto">
          {vendors.length}
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.vendor')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.tier')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.status')}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t('auditDetail.vendors.columns.securityScore')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.lastAssessment')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.nextDue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              // Vanta-parity rollout: legacy `tier`/`securityScore`/`openFindings`
              // were dropped from Vendor. Show effective tier (residual ?? inherent)
              // and inherent score; finding counts are now derived from a join
              // and intentionally omitted from this audit-side summary.
              const effectiveTier =
                v.residualTier ?? v.inherentTier ?? 'MEDIUM';
              return (
                <tr
                  key={v.id}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.category}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VENDOR_TIER_COLORS[effectiveTier] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {effectiveTier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VENDOR_STATUS_COLORS[v.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {v.inherentRiskScore ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmt(v.lastAssessmentAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmt(v.nextAssessmentAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
