/**
 * testDetail/ActivityTab.tsx — run history, security events and risk context.
 *
 * Split out of TestDetailPanel.tsx in Phase 4. Markup is unchanged; the values
 * this tab read from the panel's closure are now explicit props.
 */

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  History,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TestSecurityEvent } from '@/services/api/tests';
import { HistorySection } from './HistorySection';
import { RiskContextSection } from './RiskContextSection';
import { RunsSection, TrendSparkline } from './RunsSection';
import { Section } from './Section';

interface ActivityTabProps {
  testId: string;
  isSystemDriven: boolean;
  securityEvents: TestSecurityEvent[];
}

export function ActivityTab({
  testId,
  isSystemDriven,
  securityEvents,
}: ActivityTabProps) {
  const { t } = useTranslation('tests');

  return (
    <>
      <Section
        title={t('testDetail.activityTab.trendTitle')}
        icon={<Activity className="w-4 h-4 text-gray-500" />}
      >
        <TrendSparkline testId={testId} />
      </Section>

      {isSystemDriven && (
        <Section
          title={t('testDetail.activityTab.scanRuns')}
          icon={<Zap className="w-4 h-4 text-gray-500" />}
        >
          <RunsSection testId={testId} />
        </Section>
      )}

      <Section
        title={t('testDetail.activityTab.riskContext')}
        icon={<AlertTriangle className="w-4 h-4 text-gray-500" />}
      >
        <RiskContextSection testId={testId} />
      </Section>

      {securityEvents.length > 0 && (
        <Section
          title={t('testDetail.activityTab.securityWorkflow')}
          icon={<ArrowRight className="w-4 h-4 text-gray-500" />}
        >
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-700">
              {t('testDetail.activityTab.siemSoar')}
            </p>
            <div className="mt-2 space-y-1">
              {securityEvents.slice(0, 6).map((item) => (
                <p key={item.id} className="text-xs text-amber-900">
                  {t('testDetail.activityTab.securityEvent', {
                    eventType: item.eventType,
                    destination: item.destination,
                    status: item.status,
                  })}
                </p>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section
        title={t('testDetail.activityTab.history')}
        icon={<History className="w-4 h-4 text-gray-500" />}
      >
        <HistorySection testId={testId} />
      </Section>
    </>
  );
}
