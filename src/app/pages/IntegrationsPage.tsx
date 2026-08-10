import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_DURATION_LONG_MS } from '@/lib/constants';
import { useSearchParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ShieldCheck } from 'lucide-react';
import { frameworksService } from '@/services/api/frameworks';
import { RequestToolModal } from '@/app/pages/integrations/integrations';
import { useIntegrationsData } from '@/app/pages/integrations/useIntegrationsData';
import { ENGINEER_A_CARDS } from '@/app/pages/integrations/engineerACards';
import { IntegrationsCardGrid } from '@/app/pages/integrations/IntegrationsCardGrid';

const PAGE_SIZE = 24;

export function IntegrationsPage() {
  const { t } = useTranslation('integrations');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Phase 7 UX: detect whether any frameworks are active so we can show a
  // contextual banner when tools are connected but no framework is in scope.
  const { data: orgFrameworksData } = useQuery({
    queryKey: ['frameworks', 'org'],
    queryFn: () => frameworksService.listOrgFrameworks(),
  });
  const hasActiveFrameworks = (orgFrameworksData?.data?.length ?? 0) > 0;

  const integrationsData = useIntegrationsData();
  const { loading, loadStatus, hasLoadedDeferred } = integrationsData;

  const [activeTab, setActiveTab] = useState<'connected' | 'available'>(
    'connected',
  );
  const [showRequestToolModal, setShowRequestToolModal] = useState(false);
  const [engineerAConnectionCounts, setEngineerAConnectionCounts] = useState<
    Record<string, number>
  >({});
  const [visibleEngineerACount, setVisibleEngineerACount] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // F3: When switching to the Available tab for the first time, trigger
  // a full data load if it hasn't happened yet. This defers the ~25 extra
  // HTTP requests from mount time to when the user actually wants the list.
  const handleTabChange = useCallback(
    (v: string) => {
      setActiveTab(v as 'connected' | 'available');
      setVisibleEngineerACount(PAGE_SIZE);
      if (v === 'available' && !hasLoadedDeferred) {
        loadStatus();
      }
    },
    [hasLoadedDeferred, loadStatus],
  );

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), TOAST_DURATION_LONG_MS);
    },
    [],
  );

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'github') showToast('success', t('page.githubConnected'));
    if (connected === 'google_drive')
      showToast('success', t('page.googleDriveConnected'));
    if (connected === 'slack') showToast('success', t('page.slackConnected'));
    const intercomConnected = searchParams.get('intercom');
    if (intercomConnected === 'connected')
      showToast('success', t('page.intercomConnected'));
    if (error) showToast('error', decodeURIComponent(error));
    loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- legacy mount-only integration status loader

  // Memoize derived connection flags to compute the tab counts
  const baseConnectedCount = useMemo(() => {
    const {
      githubIntegration,
      driveIntegration,
      slackIntegration,
      nrConnected,
      notionConnected,
      mdmOverview,
      awsAccounts,
      cloudflareAccounts,
      bamboohrAccounts,
      redashAccounts,
      workspaceAccounts,
      fleetAccounts,
      intercomAccounts,
      bigIdAccounts,
      pagerdutyAccounts,
      opsgenieAccounts,
      servicenowAccounts,
      datadogAccounts,
      gcpAccounts,
      azureAccounts,
      wizAccounts,
      laceworkAccounts,
      snykAccounts,
      sonarqubeAccounts,
      veracodeAccounts,
      checkmarxAccounts,
      vaultAccounts,
      secretsManagerAccounts,
      certManagerAccounts,
      oktaAccounts,
      azureAdAccounts,
      jumpCloudAccounts,
    } = integrationsData;
    return [
      !!githubIntegration,
      !!driveIntegration,
      !!slackIntegration,
      nrConnected,
      notionConnected,
      (mdmOverview?.total ?? 0) > 0,
      awsAccounts.length > 0,
      cloudflareAccounts.length > 0,
      bamboohrAccounts.length > 0,
      redashAccounts.length > 0,
      workspaceAccounts.length > 0,
      fleetAccounts.length > 0,
      intercomAccounts.length > 0,
      bigIdAccounts.length > 0,
      pagerdutyAccounts.length > 0,
      opsgenieAccounts.length > 0,
      servicenowAccounts.length > 0,
      datadogAccounts.length > 0,
      gcpAccounts.length > 0,
      azureAccounts.length > 0,
      wizAccounts.length > 0,
      laceworkAccounts.length > 0,
      snykAccounts.length > 0,
      sonarqubeAccounts.length > 0,
      veracodeAccounts.length > 0,
      checkmarxAccounts.length > 0,
      vaultAccounts.length > 0,
      secretsManagerAccounts.length > 0,
      certManagerAccounts.length > 0,
      oktaAccounts.length > 0,
      azureAdAccounts.length > 0,
      jumpCloudAccounts.length > 0,
    ].filter(Boolean).length;
  }, [integrationsData]);

  const engineerAConnectedCount = useMemo(
    () =>
      Object.values(engineerAConnectionCounts).filter((count) => count > 0)
        .length,
    [engineerAConnectionCounts],
  );
  const connectedCount = baseConnectedCount + engineerAConnectedCount;
  const totalToolCount = 32 + ENGINEER_A_CARDS.length;
  const availableCount = Math.max(totalToolCount - connectedCount, 0);

  const shouldShowTile = useCallback(
    (connected: boolean) =>
      activeTab === 'connected' ? connected : !connected,
    [activeTab],
  );

  return (
    <PageTemplate
      title="Integrations"
      description="Connect third-party tools and services to your ISMS."
    >
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Phase 7 UX: Capabilities detected but no framework active banner */}
      {!hasActiveFrameworks && connectedCount > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900">
              Capabilities detected — no compliance framework active
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Connected tools are syncing data, but no compliance tests will be
              generated until a framework is activated. Activate a framework to
              start generating tests from your integrations.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-blue-200 text-blue-700 hover:bg-blue-100"
            onClick={() => navigate('/compliance/frameworks')}
          >
            Activate Framework
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="connected">
              Connected Tools&nbsp;
              {loading ? (
                <span className="inline-block w-5 h-3.5 rounded bg-current opacity-20 animate-pulse align-middle" />
              ) : (
                `(${connectedCount})`
              )}
            </TabsTrigger>
            <TabsTrigger value="available">
              Available Tools&nbsp;
              {loading ? (
                <span className="inline-block w-5 h-3.5 rounded bg-current opacity-20 animate-pulse align-middle" />
              ) : (
                `(${availableCount})`
              )}
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRequestToolModal(true)}
            className="shrink-0 gap-1.5 text-xs"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Request a Tool
          </Button>
        </div>

        <IntegrationsCardGrid
          {...integrationsData}
          shouldShowTile={shouldShowTile}
          showToast={showToast}
          activeTab={activeTab}
          visibleEngineerACount={visibleEngineerACount}
          setVisibleEngineerACount={setVisibleEngineerACount}
          engineerAConnectionCounts={engineerAConnectionCounts}
          setEngineerAConnectionCounts={setEngineerAConnectionCounts}
        />
      </Tabs>

      {showRequestToolModal && (
        <RequestToolModal
          onClose={() => setShowRequestToolModal(false)}
          onSubmitted={() => {
            setShowRequestToolModal(false);
            showToast(
              'success',
              'Tool request submitted! The team will review it shortly.',
            );
          }}
        />
      )}
    </PageTemplate>
  );
}
