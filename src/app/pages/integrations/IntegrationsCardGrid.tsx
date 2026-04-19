import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { useTranslation } from 'react-i18next';
import {
  AwsCard,
  AzureAdCard,
  AzureCard,
  BambooHRCard,
  BigIdCard,
  CertManagerCard,
  CheckmarxCard,
  CloudflareCard,
  DatadogIncidentsCard,
  EngineerAIntegrationCard,
  FleetCard,
  GcpCard,
  GitHubCard,
  GoogleDriveCard,
  IntercomCard,
  JumpCloudCard,
  LaceworkCard,
  MdmCard,
  NewRelicCard,
  NotionCard,
  OktaCard,
  OpsgenieCard,
  PagerDutyCard,
  RedashCard,
  SecretsManagerCard,
  ServiceNowIncidentCard,
  SlackCard,
  SnykCard,
  SonarQubeCard,
  STATIC_INTEGRATIONS,
  StaticIcon,
  VaultCard,
  VeracodeCard,
  WizCard,
  WorkspaceCard,
} from './integrations';
import {
  ENGINEER_A_CARDS,
  workflowRuntimeConfigForEngineerACard,
} from './engineerACards';
import type { useIntegrationsData } from './useIntegrationsData';

const PAGE_SIZE = 24;

type IntegrationsCardGridProps = ReturnType<typeof useIntegrationsData> & {
  shouldShowTile: (connected: boolean) => boolean;
  showToast: (type: 'success' | 'error', message: string) => void;
  activeTab: 'connected' | 'available';
  visibleEngineerACount: number;
  setVisibleEngineerACount: React.Dispatch<React.SetStateAction<number>>;
  engineerAConnectionCounts: Record<string, number>;
  setEngineerAConnectionCounts: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
};

export function IntegrationsCardGrid({
  githubIntegration,
  setGithubIntegration,
  driveIntegration,
  setDriveIntegration,
  slackIntegration,
  setSlackIntegration,
  slackChannels,
  setSlackChannels,
  nrConnected,
  setNrConnected,
  nrStatus,
  setNrStatus,
  notionConnected,
  setNotionConnected,
  notionStatus,
  setNotionStatus,
  awsAccounts,
  setAwsAccounts,
  cloudflareAccounts,
  setCloudflareAccounts,
  bamboohrAccounts,
  setBamboohrAccounts,
  redashAccounts,
  setRedashAccounts,
  workspaceAccounts,
  setWorkspaceAccounts,
  fleetAccounts,
  setFleetAccounts,
  intercomAccounts,
  setIntercomAccounts,
  bigIdAccounts,
  setBigIdAccounts,
  pagerdutyAccounts,
  setPagerdutyAccounts,
  opsgenieAccounts,
  setOpsgenieAccounts,
  servicenowAccounts,
  setServicenowAccounts,
  datadogAccounts,
  setDatadogAccounts,
  gcpAccounts,
  setGcpAccounts,
  azureAccounts,
  setAzureAccounts,
  wizAccounts,
  setWizAccounts,
  laceworkAccounts,
  setLaceworkAccounts,
  snykAccounts,
  setSnykAccounts,
  sonarqubeAccounts,
  setSonarqubeAccounts,
  veracodeAccounts,
  setVeracodeAccounts,
  checkmarxAccounts,
  setCheckmarxAccounts,
  vaultAccounts,
  setVaultAccounts,
  secretsManagerAccounts,
  setSecretsManagerAccounts,
  certManagerAccounts,
  setCertManagerAccounts,
  oktaAccounts,
  setOktaAccounts,
  azureAdAccounts,
  setAzureAdAccounts,
  jumpCloudAccounts,
  setJumpCloudAccounts,
  repos,
  setRepos,
  mdmOverview,
  loading,
  shouldShowTile,
  showToast,
  activeTab,
  visibleEngineerACount,
  setVisibleEngineerACount,
  engineerAConnectionCounts,
  setEngineerAConnectionCounts,
}: IntegrationsCardGridProps) {
  const { t } = useTranslation('integrations');
  const isConnected = !!githubIntegration;
  const driveConnected = !!driveIntegration;
  const slackConnected = !!slackIntegration;
  const mdmConnected = (mdmOverview?.total ?? 0) > 0;
  const awsConnected = awsAccounts.length > 0;
  const cloudflareConnected = cloudflareAccounts.length > 0;
  const bamboohrConnected = bamboohrAccounts.length > 0;
  const redashConnected = redashAccounts.length > 0;
  const workspaceConnected = workspaceAccounts.length > 0;
  const fleetConnected = fleetAccounts.length > 0;
  const intercomConnected = intercomAccounts.length > 0;
  const bigIdConnected = bigIdAccounts.length > 0;
  const pagerdutyConnected = pagerdutyAccounts.length > 0;
  const opsgenieConnected = opsgenieAccounts.length > 0;
  const servicenowConnected = servicenowAccounts.length > 0;
  const datadogConnected = datadogAccounts.length > 0;
  const gcpConnected = gcpAccounts.length > 0;
  const azureConnected = azureAccounts.length > 0;
  const wizConnected = wizAccounts.length > 0;
  const laceworkConnected = laceworkAccounts.length > 0;
  const snykConnected = snykAccounts.length > 0;
  const sonarqubeConnected = sonarqubeAccounts.length > 0;
  const veracodeConnected = veracodeAccounts.length > 0;
  const checkmarxConnected = checkmarxAccounts.length > 0;
  const vaultConnected = vaultAccounts.length > 0;
  const secretsManagerConnected = secretsManagerAccounts.length > 0;
  const certManagerConnected = certManagerAccounts.length > 0;
  const oktaConnected = oktaAccounts.length > 0;
  const azureAdConnected = azureAdAccounts.length > 0;
  const jumpCloudConnected = jumpCloudAccounts.length > 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* ── GitHub ──────────────────────────────────────────────────────── */}
        {shouldShowTile(isConnected) && (
          <GitHubCard
            githubIntegration={githubIntegration}
            repos={repos}
            loading={loading}
            onDisconnect={() => {
              setGithubIntegration(null);
              setRepos([]);
            }}
            onToast={showToast}
          />
        )}

        {/* ── Google Drive ────────────────────────────────────────────────── */}
        {shouldShowTile(driveConnected) && (
          <GoogleDriveCard
            driveIntegration={driveIntegration}
            loading={loading}
            onToast={showToast}
            onDisconnect={() => setDriveIntegration(null)}
          />
        )}

        {/* ── Slack ──────────────────────────────────────────────────────── */}
        {shouldShowTile(slackConnected) && (
          <SlackCard
            slackIntegration={slackIntegration}
            channels={slackChannels}
            loadingStatus={loading}
            onDisconnect={() => {
              setSlackIntegration(null);
              setSlackChannels([]);
            }}
            onChannelsChange={setSlackChannels}
            onToast={showToast}
          />
        )}

        {/* ── Manzen MDM Agent ─────────────────────────────────────────────── */}
        {shouldShowTile(mdmConnected) && <MdmCard onToast={showToast} />}

        {/* ── BambooHR ─────────────────────────────────────────────────────── */}
        {shouldShowTile(bamboohrConnected) && (
          <BambooHRCard
            accounts={bamboohrAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setBamboohrAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setBamboohrAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Notion ───────────────────────────────────────────────────────── */}
        {shouldShowTile(notionConnected) && (
          <NotionCard
            notionStatus={notionStatus}
            connected={notionConnected}
            loadingStatus={loading}
            onConnected={(status) => {
              setNotionConnected(true);
              setNotionStatus(status);
            }}
            onDisconnected={() => {
              setNotionConnected(false);
              setNotionStatus(null);
            }}
            onToast={showToast}
          />
        )}

        {/* ── AWS ──────────────────────────────────────────────────────────── */}
        {shouldShowTile(awsConnected) && (
          <AwsCard
            accounts={awsAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setAwsAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(accountId) =>
              setAwsAccounts((prev) => prev.filter((a) => a.id !== accountId))
            }
            onToast={showToast}
          />
        )}

        {/* ── Cloudflare ───────────────────────────────────────────────────── */}
        {shouldShowTile(cloudflareConnected) && (
          <CloudflareCard
            accounts={cloudflareAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setCloudflareAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(accountId) =>
              setCloudflareAccounts((prev) =>
                prev.filter((a) => a.id !== accountId),
              )
            }
            onToast={showToast}
          />
        )}

        {/* ── New Relic ────────────────────────────────────────────────────── */}
        {shouldShowTile(nrConnected) && (
          <NewRelicCard
            nrStatus={nrStatus}
            connected={nrConnected}
            loadingStatus={loading}
            onConnected={(status) => {
              setNrConnected(true);
              setNrStatus(status);
            }}
            onDisconnected={() => {
              setNrConnected(false);
              setNrStatus(null);
            }}
            onToast={showToast}
          />
        )}

        {/* ── Redash ───────────────────────────────────────────────────────── */}
        {shouldShowTile(redashConnected) && (
          <RedashCard
            accounts={redashAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setRedashAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setRedashAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Google Workspace ─────────────────────────────────────────────── */}
        {shouldShowTile(workspaceConnected) && (
          <WorkspaceCard
            accounts={workspaceAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setWorkspaceAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setWorkspaceAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Fleet ────────────────────────────────────────────────────────── */}
        {shouldShowTile(fleetConnected) && (
          <FleetCard
            accounts={fleetAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setFleetAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setFleetAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Intercom ──────────────────────────────────────────────────────── */}
        {shouldShowTile(intercomConnected) && (
          <IntercomCard
            accounts={intercomAccounts}
            loadingStatus={loading}
            onAccountRemoved={(id) =>
              setIntercomAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── BigID ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(bigIdConnected) && (
          <BigIdCard
            accounts={bigIdAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setBigIdAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setBigIdAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── PagerDuty ─────────────────────────────────────────────────────── */}
        {shouldShowTile(pagerdutyConnected) && (
          <PagerDutyCard
            accounts={pagerdutyAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setPagerdutyAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setPagerdutyAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Opsgenie ──────────────────────────────────────────────────────── */}
        {shouldShowTile(opsgenieConnected) && (
          <OpsgenieCard
            accounts={opsgenieAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setOpsgenieAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setOpsgenieAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── ServiceNow Incident ───────────────────────────────────────────── */}
        {shouldShowTile(servicenowConnected) && (
          <ServiceNowIncidentCard
            accounts={servicenowAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setServicenowAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setServicenowAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Datadog Incidents ─────────────────────────────────────────────── */}
        {shouldShowTile(datadogConnected) && (
          <DatadogIncidentsCard
            accounts={datadogAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setDatadogAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setDatadogAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── GCP ───────────────────────────────────────────────────────────── */}
        {shouldShowTile(gcpConnected) && (
          <GcpCard
            accounts={gcpAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setGcpAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setGcpAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Azure ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(azureConnected) && (
          <AzureCard
            accounts={azureAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setAzureAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setAzureAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Wiz ───────────────────────────────────────────────────────────── */}
        {shouldShowTile(wizConnected) && (
          <WizCard
            accounts={wizAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setWizAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setWizAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Lacework ──────────────────────────────────────────────────────── */}
        {shouldShowTile(laceworkConnected) && (
          <LaceworkCard
            accounts={laceworkAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setLaceworkAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setLaceworkAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Snyk ──────────────────────────────────────────────────────────── */}
        {shouldShowTile(snykConnected) && (
          <SnykCard
            accounts={snykAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setSnykAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setSnykAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── SonarQube ─────────────────────────────────────────────────────── */}
        {shouldShowTile(sonarqubeConnected) && (
          <SonarQubeCard
            accounts={sonarqubeAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setSonarqubeAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setSonarqubeAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Veracode ──────────────────────────────────────────────────────── */}
        {shouldShowTile(veracodeConnected) && (
          <VeracodeCard
            accounts={veracodeAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setVeracodeAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setVeracodeAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Checkmarx ─────────────────────────────────────────────────────── */}
        {shouldShowTile(checkmarxConnected) && (
          <CheckmarxCard
            accounts={checkmarxAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setCheckmarxAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setCheckmarxAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── HashiCorp Vault ──────────────────────────────────────────────── */}
        {shouldShowTile(vaultConnected) && (
          <VaultCard
            accounts={vaultAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setVaultAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setVaultAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── AWS Secrets Manager ──────────────────────────────────────────── */}
        {shouldShowTile(secretsManagerConnected) && (
          <SecretsManagerCard
            accounts={secretsManagerAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setSecretsManagerAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setSecretsManagerAccounts((prev) =>
                prev.filter((a) => a.id !== id),
              )
            }
            onToast={showToast}
          />
        )}

        {/* ── Certificate Manager ──────────────────────────────────────────── */}
        {shouldShowTile(certManagerConnected) && (
          <CertManagerCard
            accounts={certManagerAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setCertManagerAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setCertManagerAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Okta ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(oktaConnected) && (
          <OktaCard
            accounts={oktaAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setOktaAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setOktaAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── Azure AD ─────────────────────────────────────────────────────── */}
        {shouldShowTile(azureAdConnected) && (
          <AzureAdCard
            accounts={azureAdAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setAzureAdAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setAzureAdAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {/* ── JumpCloud ────────────────────────────────────────────────────── */}
        {shouldShowTile(jumpCloudConnected) && (
          <JumpCloudCard
            accounts={jumpCloudAccounts}
            loadingStatus={loading}
            onAccountAdded={(account) =>
              setJumpCloudAccounts((prev) => [
                ...prev.filter((a) => a.id !== account.id),
                account,
              ])
            }
            onAccountRemoved={(id) =>
              setJumpCloudAccounts((prev) => prev.filter((a) => a.id !== id))
            }
            onToast={showToast}
          />
        )}

        {ENGINEER_A_CARDS.slice(0, visibleEngineerACount).map((card) => (
          <EngineerAIntegrationCard
            key={card.key}
            config={card}
            loading={loading}
            onToast={showToast}
            activeTab={activeTab}
            getWorkflowConfig={workflowRuntimeConfigForEngineerACard}
            onConnectionCountChange={(count) =>
              setEngineerAConnectionCounts((prev) => ({
                ...prev,
                [card.key]: count,
              }))
            }
          />
        ))}

        {/* ── Static coming-soon cards ─────────────────────────────────────── */}
        {activeTab === 'available' &&
          STATIC_INTEGRATIONS.map((integration) => (
            <Card key={integration.name} className="p-6 opacity-60 select-none">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
                    <StaticIcon name={integration.name} className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {integration.category}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{t('grid.comingSoon')}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {integration.description}
              </p>
              <Button variant="outline" size="sm" disabled>
                {t('grid.comingSoon')}
              </Button>
            </Card>
          ))}
      </div>

      {/* ── Show more (pagination for engineer-a cards) ──────────────────────── */}
      {(() => {
        if (visibleEngineerACount >= ENGINEER_A_CARDS.length) return null;
        // On connected tab, only show "show more" if there are connected cards beyond the visible slice
        if (activeTab === 'connected') {
          const connectedBeyond = ENGINEER_A_CARDS.slice(
            visibleEngineerACount,
          ).filter((c) => (engineerAConnectionCounts[c.key] ?? 0) > 0).length;
          if (connectedBeyond === 0) return null;
        }
        const remaining = ENGINEER_A_CARDS.length - visibleEngineerACount;
        return (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setVisibleEngineerACount((prev) => prev + PAGE_SIZE)
              }
              className="gap-1.5 text-sm"
            >
              {t('grid.showMore', { count: remaining })}
            </Button>
          </div>
        );
      })()}
    </>
  );
}
