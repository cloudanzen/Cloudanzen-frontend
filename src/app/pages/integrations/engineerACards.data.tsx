/* eslint-disable @typescript-eslint/no-explicit-any -- integration card catalogue carries provider-specific service adapters */
import {
  type EngineerACardConfig,
  type WorkflowConfigResult,
} from '@/app/pages/integrations/integrations';
import { workspaceDirectoryService } from '@/services/api/workspace-directory';
import { oneLoginService } from '@/services/api/onelogin';
import { jamfService } from '@/services/api/jamf';
import { kandjiService } from '@/services/api/kandji';
import { intuneService } from '@/services/api/intune';
import { crowdstrikeService } from '@/services/api/crowdstrike';
import { workdayService } from '@/services/api/workday';
import { ripplingService } from '@/services/api/rippling';
import { hiBobService } from '@/services/api/hibob';
import { gitlabService } from '@/services/api/gitlab';
import { bitbucketService } from '@/services/api/bitbucket';
import { jiraService } from '@/services/api/jira';
import { linearService } from '@/services/api/linear';
import { asanaService } from '@/services/api/asana';
import { confluenceService } from '@/services/api/confluence';
import { sharepointService } from '@/services/api/sharepoint';
import { splunkService } from '@/services/api/splunk';
import { sumologicService } from '@/services/api/sumologic';
import { tenableService } from '@/services/api/tenable';
import { qualysService } from '@/services/api/qualys';
import { digitaloceanService } from '@/services/api/digitalocean';
import { herokuService } from '@/services/api/heroku';
import { renderService } from '@/services/api/render';
import { netlifyService } from '@/services/api/netlify';
import { vercelService } from '@/services/api/vercel';
import { scalewayService } from '@/services/api/scaleway';
import { gitlabSelfManagedService } from '@/services/api/gitlab-self-managed';
import { azureDevopsService } from '@/services/api/azure-devops';
import { auth0Service } from '@/services/api/auth0';
import { pingoneService } from '@/services/api/pingone';
import { tailscaleService } from '@/services/api/tailscale';
import { mondaycomService } from '@/services/api/mondaycom';
import { basecampService } from '@/services/api/basecamp';
import { smartsheetService } from '@/services/api/smartsheet';
import { zendeskService } from '@/services/api/zendesk';
import { sentineloneService } from '@/services/api/sentinelone';
import { grafanaService } from '@/services/api/grafana';
import { sentryService } from '@/services/api/sentry';
import { onepasswordService } from '@/services/api/onepassword';
import { snowflakeService } from '@/services/api/snowflake';
import { microsoftTeamsService } from '@/services/api/microsoft-teams';
import { zoomService } from '@/services/api/zoom';
import { webexService } from '@/services/api/webex';
import { hubspotService } from '@/services/api/hubspot';
import { salesforceService } from '@/services/api/salesforce';
import { pipedriveService } from '@/services/api/pipedrive';
import { copperService } from '@/services/api/copper';
import { apolloService } from '@/services/api/apollo';
import { gongService } from '@/services/api/gong';
import { zoominfoService } from '@/services/api/zoominfo';
import { gustoService } from '@/services/api/gusto';
import { trinetService } from '@/services/api/trinet';
import { humaansService } from '@/services/api/humaans';
import { personioService } from '@/services/api/personio';
import { adpWorkforceNowService } from '@/services/api/adp-workforce-now';
import { deelService } from '@/services/api/deel';
import { employmentHeroService } from '@/services/api/employment-hero';
import { justworksService } from '@/services/api/justworks';
import { factorialService } from '@/services/api/factorial';
import { alexishrService } from '@/services/api/alexishr';
import { addigyService } from '@/services/api/addigy';
import { workspaceOneService } from '@/services/api/workspace-one';
import { huntressService } from '@/services/api/huntress';
import { intruderService } from '@/services/api/intruder';
import { orcaSecurityService } from '@/services/api/orca-security';
import { hostedscanService } from '@/services/api/hostedscan';
import { aikidoSecurityService } from '@/services/api/aikido-security';
import { jitService } from '@/services/api/jit';
import { knowbe4Service } from '@/services/api/knowbe4';
import { cybereadyService } from '@/services/api/cybeready';
import { hookSecurityService } from '@/services/api/hook-security';
import { hoxhuntService } from '@/services/api/hoxhunt';
import { certnService } from '@/services/api/certn';
import { checkrService } from '@/services/api/checkr';
import { dashlaneService } from '@/services/api/dashlane';
import { boxService } from '@/services/api/box';
import { googleDriveService } from '@/services/api/google-drive';
import { docusignService } from '@/services/api/docusign';
import { mongodbAtlasService } from '@/services/api/mongodb-atlas';
import { supabaseService } from '@/services/api/supabase';
import { rocksetService } from '@/services/api/rockset';
import { envoyService } from '@/services/api/envoy';
import { launchdarklyService } from '@/services/api/launchdarkly';
import { buildkiteService } from '@/services/api/buildkite';
import { circleciService } from '@/services/api/circleci';
import { jenkinsService } from '@/services/api/jenkins';
import { harnessService } from '@/services/api/harness';
import { githubActionsService } from '@/services/api/github-actions';
import { manageengineService } from '@/services/api/manageengine';
import { teamworkService } from '@/services/api/teamwork';
import { comeetService } from '@/services/api/comeet';
import { leverService } from '@/services/api/lever';
import { fieldguideService } from '@/services/api/fieldguide';
import { rampService } from '@/services/api/ramp';
import { brexService } from '@/services/api/brex';
import { netsuiteService } from '@/services/api/netsuite';
import { xeroService } from '@/services/api/xero';

export function workflowRuntimeConfigForEngineerACard(input: {
  key: string;
  apiKey: string;
  accountId: string;
  tenant: string;
  baseUrl: string;
}): WorkflowConfigResult | null {
  const apiKey = input.apiKey.trim();
  const accountId = input.accountId.trim();
  const tenant = input.tenant.trim();
  const baseUrl = input.baseUrl.trim();

  const trimEmpty = (value: string) => (value ? value : undefined);

  if (input.key === 'jira') {
    return {
      provider: 'jira',
      values: {
        apiToken: trimEmpty(apiKey),
        projectKey: trimEmpty(accountId),
        email: trimEmpty(tenant),
        baseUrl: trimEmpty(baseUrl),
      },
    };
  }

  if (input.key === 'github-actions') {
    return {
      provider: 'github-actions',
      values: {
        token: trimEmpty(apiKey),
        repo: trimEmpty(accountId),
        owner: trimEmpty(tenant),
        apiUrl: trimEmpty(baseUrl),
      },
    };
  }

  if (input.key === 'splunk') {
    return {
      provider: 'siem',
      values: {
        splunkHecToken: trimEmpty(apiKey),
        splunkHecUrl: trimEmpty(baseUrl),
      },
    };
  }

  if (input.key === 'sumologic') {
    return {
      provider: 'siem',
      values: {
        webhookUrl: trimEmpty(baseUrl),
      },
    };
  }

  return null;
}

export const ENGINEER_A_CARDS: EngineerACardConfig[] = [
  {
    key: 'workspace-directory',
    name: 'Google Workspace Directory',
    subtitle: 'Identity · MFA, stale accounts & external sharing',
    category: 'Identity',
    description:
      'Verify MFA enforcement for admins, detect inactive users, control super-admin count, and restrict external sharing via the Google Workspace Admin SDK.',
    brandColor: '#1a73e8',
    iconBg: 'bg-white border border-gray-200',
    isoTags: [
      'A.5.17 MFA',
      'A.5.18 Stale Accounts',
      'A.5.3 Admin Control',
      'A.5.23 Sharing Policy',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 48 48"
        className="w-7 h-7"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#4285F4"
          d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z"
        />
        <path
          fill="white"
          d="M24 12a7 7 0 100 14 7 7 0 000-14zm0 22c-5 0-9.33 2.56-11.93 6.44A16 16 0 0024 40a16 16 0 0011.93-5.56C33.33 36.56 29 34 24 34z"
        />
      </svg>
    ),
    service: workspaceDirectoryService as any,
  },
  {
    key: 'onelogin',
    name: 'OneLogin',
    subtitle: 'Identity & SSO · MFA, stale accounts & app hygiene',
    category: 'Identity',
    description:
      'Verify MFA policy coverage, detect stale accounts, review privileged role assignments, and audit app assignment hygiene via the OneLogin API.',
    brandColor: '#00A1E0',
    iconBg: 'bg-[#00A1E0]',
    isoTags: [
      'A.5.17 MFA',
      'A.5.18 Stale Accounts',
      'A.5.2 Privileged Roles',
      'A.5.15 App Access',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="7" fill="white" />
        <circle cx="16" cy="16" r="3" fill="#00A1E0" />
        <path
          d="M16 2v4M16 26v4M2 16h4M26 16h4"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: oneLoginService as any,
  },
  {
    key: 'jamf',
    name: 'Jamf Pro',
    subtitle: 'Endpoint / MDM · Encryption, screen lock & EDR',
    category: 'Endpoint / MDM',
    description:
      'Verify disk encryption policy, screen lock baseline, OS update compliance, and EDR sensor coverage across your macOS fleet via the Jamf Pro API.',
    brandColor: '#004F9F',
    iconBg: 'bg-[#004F9F]',
    isoTags: [
      'A.8.24 Encryption',
      'A.5.15 Screen Lock',
      'A.8.8 OS Updates',
      'A.8.16 EDR Coverage',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 3L4 9v8c0 6.6 5.1 12.8 12 14.2C23.9 29.8 29 23.6 29 17V9L16 3z" />
        <path
          d="M13 16l2.5 2.5L20 13"
          stroke="#004F9F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
    service: jamfService as any,
  },
  {
    key: 'kandji',
    name: 'Kandji',
    subtitle: 'Endpoint / MDM · Encryption, blueprints & firewall',
    category: 'Endpoint / MDM',
    description:
      'Verify encryption baseline, compliance blueprint coverage, detect stale devices, and confirm firewall policy enforcement across your Apple device fleet.',
    brandColor: '#1B1B1B',
    iconBg: 'bg-gray-900',
    isoTags: [
      'A.8.24 Encryption',
      'A.8.9 Compliance Baseline',
      'A.8.1 Stale Devices',
      'A.8.20 Firewall',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="4"
          width="16"
          height="20"
          rx="3"
          fill="white"
          opacity="0.9"
        />
        <rect x="11" y="8" width="10" height="2" rx="1" fill="#1B1B1B" />
        <rect x="11" y="12" width="7" height="2" rx="1" fill="#1B1B1B" />
        <circle cx="16" cy="26" r="2" fill="white" />
      </svg>
    ),
    service: kandjiService as any,
  },
  {
    key: 'intune',
    name: 'Microsoft Intune',
    subtitle: 'Endpoint / MDM · Device compliance & conditional access',
    category: 'Endpoint / MDM',
    description:
      'Verify device compliance baseline, encryption policy, conditional access integration, and unmanaged device exceptions across your Windows and mobile fleet.',
    brandColor: '#0078D4',
    iconBg: 'bg-white border border-gray-200',
    isoTags: [
      'A.8.9 Device Compliance',
      'A.8.24 Encryption',
      'A.5.15 Conditional Access',
      'A.5.36 Exceptions',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M11.5 2L2 7v10l9.5 5 9.5-5V7L11.5 2z" fill="#0078D4" />
        <path
          d="M11.5 2v20M2 7l9.5 5 9.5-5"
          stroke="white"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
      </svg>
    ),
    service: intuneService as any,
  },
  {
    key: 'crowdstrike',
    name: 'CrowdStrike Falcon',
    subtitle: 'Endpoint Security · Sensor coverage & detections',
    category: 'Endpoint Security',
    description:
      'Verify sensor coverage across all hosts, confirm critical detections are triaged, check tamper protection policy, and review stale host quarantine status.',
    brandColor: '#E3003A',
    iconBg: 'bg-[#E3003A]',
    isoTags: [
      'A.8.16 Sensor Coverage',
      'A.5.24 Detections Triaged',
      'A.8.9 Tamper Protection',
      'A.8.15 Stale Hosts',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 4L6 9v7c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V9L16 4z"
          fill="white"
          opacity="0.15"
          stroke="white"
          strokeWidth="1.5"
        />
        <path
          d="M10 16l4 4 8-8"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
    service: crowdstrikeService as any,
  },
  {
    key: 'workday',
    name: 'Workday',
    subtitle: 'HRIS · Employee lifecycle & HR access governance',
    category: 'HRIS',
    description:
      'Verify the active employee roster is synced, terminated employee workflows complete on time, privileged HR roles are reviewed, and personal data fields are governed.',
    brandColor: '#F3741B',
    iconBg: 'bg-[#F3741B]',
    isoTags: [
      'A.6.2 Employee Roster',
      'A.6.5 Offboarding',
      'A.5.2 Privileged HR Roles',
      'A.5.34 Data Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="11" r="5" fill="white" />
        <path
          d="M6 26c0-5.5 4.5-10 10-10s10 4.5 10 10"
          fill="white"
          opacity="0.8"
        />
      </svg>
    ),
    service: workdayService as any,
  },
  {
    key: 'rippling',
    name: 'Rippling',
    subtitle: 'HRIS · Onboarding, offboarding & HR data retention',
    category: 'HRIS',
    description:
      'Verify employee lifecycle sync, onboarding/offboarding SLA compliance, admin access segmentation, and HR data retention controls via the Rippling API.',
    brandColor: '#FFC234',
    iconBg: 'bg-[#FFC234]',
    isoTags: [
      'A.6.2 Lifecycle Sync',
      'A.6.5 Offboarding SLA',
      'A.5.15 Access Segmentation',
      'A.5.33 Data Retention',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="13" r="4" fill="white" />
        <circle cx="22" cy="13" r="4" fill="white" opacity="0.7" />
        <path
          d="M4 27c0-4.4 2.7-8 6-8M18 27c0-4.4 2.7-8 6-8"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M13 27c0-4.4 1.3-8 3-8s3 3.6 3 8" fill="white" opacity="0.5" />
      </svg>
    ),
    service: ripplingService as any,
  },
  {
    key: 'hibob',
    name: 'HiBob',
    subtitle: 'HRIS · People ops lifecycle & PII controls',
    category: 'HRIS',
    description:
      'Verify user lifecycle consistency, role-based access hygiene, contractor account governance, and PII export controls via the HiBob API.',
    brandColor: '#FF6B6B',
    iconBg: 'bg-[#FF6B6B]',
    isoTags: [
      'A.6.2 Lifecycle',
      'A.5.15 Role-Based Access',
      'A.6.6 Contractor Governance',
      'A.5.34 PII Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6z"
          fill="white"
          opacity="0.2"
          stroke="white"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="13" r="3.5" fill="white" />
        <path d="M9 24c0-3.9 3.1-7 7-7s7 3.1 7 7" fill="white" opacity="0.8" />
      </svg>
    ),
    service: hiBobService as any,
  },
  {
    key: 'gitlab',
    name: 'GitLab',
    subtitle: 'DevOps · Source control & CI/CD security',
    category: 'DevOps',
    description:
      'Verify branch protection rules, pipeline security controls, merge request approvals, and repository access governance across GitLab groups and projects.',
    brandColor: '#FC6D26',
    iconBg: 'bg-[#FC6D26]',
    isoTags: [
      'A.8.4 Branch Protection',
      'A.8.25 Pipeline Security',
      'A.5.3 Merge Approvals',
      'A.5.15 Repo Access',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 27L6 11l3-8 3 8h8l3-8 3 8z" fill="white" opacity="0.9" />
      </svg>
    ),
    service: gitlabService as any,
  },
  {
    key: 'bitbucket',
    name: 'Bitbucket',
    subtitle: 'DevOps · Repository & pipeline access controls',
    category: 'DevOps',
    description:
      'Audit branch restrictions, deployment permissions, pipeline environment secrets, and repository-level access policies across Bitbucket workspaces.',
    brandColor: '#0052CC',
    iconBg: 'bg-[#0052CC]',
    isoTags: [
      'A.8.4 Branch Restrictions',
      'A.8.10 Deployment Permissions',
      'A.5.33 Secret Controls',
      'A.5.15 Repo Access',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 7l3.5 18h15L27 7H5zm12 13h-2l-1.5-7h5L19 20z"
          fill="white"
          opacity="0.9"
        />
      </svg>
    ),
    service: bitbucketService as any,
  },
  {
    key: 'jira',
    name: 'Jira',
    subtitle: 'Project Management · Workflow & access controls',
    category: 'Project Management',
    description:
      'Verify project permission schemes, workflow transition controls, issue security levels, and audit log retention for compliance across Jira projects.',
    brandColor: '#0052CC',
    iconBg: 'bg-[#0052CC]',
    isoTags: [
      'A.5.15 Project Permissions',
      'A.8.32 Workflow Controls',
      'A.5.10 Issue Security',
      'A.8.15 Audit Retention',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 5L5 16l4.5 4.5L16 14l6.5 6.5L27 16z"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M16 14l-6.5 6.5L14 25l2-2 2 2 4.5-4.5z"
          fill="white"
          opacity="0.7"
        />
      </svg>
    ),
    service: jiraService as any,
  },
  {
    key: 'linear',
    name: 'Linear',
    subtitle: 'Project Management · Issue tracking & access',
    category: 'Project Management',
    description:
      'Audit team membership controls, project visibility settings, API token scopes, and integration access governance across Linear workspaces.',
    brandColor: '#5E6AD2',
    iconBg: 'bg-[#5E6AD2]',
    isoTags: [
      'A.5.15 Team Membership',
      'A.5.10 Project Visibility',
      'A.5.16 Token Scopes',
      'A.5.15 Integration Access',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path d="M10 16h12M16 10v12" stroke="white" strokeWidth="2" />
      </svg>
    ),
    service: linearService as any,
  },
  {
    key: 'asana',
    name: 'Asana',
    subtitle: 'Project Management · Task & workspace governance',
    category: 'Project Management',
    description:
      'Verify workspace membership policies, portfolio access controls, guest user restrictions, and task-level privacy settings across Asana organisations.',
    brandColor: '#F06A6A',
    iconBg: 'bg-[#F06A6A]',
    isoTags: [
      'A.5.15 Workspace Membership',
      'A.5.10 Portfolio Access',
      'A.6.6 Guest Restrictions',
      'A.5.10 Task Privacy',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="10" r="4" fill="white" />
        <circle cx="8" cy="22" r="4" fill="white" opacity="0.8" />
        <circle cx="24" cy="22" r="4" fill="white" opacity="0.8" />
      </svg>
    ),
    service: asanaService as any,
  },
  {
    key: 'confluence',
    name: 'Confluence',
    subtitle: 'Knowledge Management · Space & content access',
    category: 'Knowledge Management',
    description:
      'Audit space permission schemes, page restriction policies, anonymous access settings, and sensitive content governance across Confluence spaces.',
    brandColor: '#0052CC',
    iconBg: 'bg-[#0052CC]',
    isoTags: [
      'A.5.15 Space Permissions',
      'A.5.10 Page Restrictions',
      'A.5.14 Anonymous Access',
      'A.5.12 Content Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 22c4-6 12-8 20-4M6 10c4 6 12 8 20 4"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: confluenceService as any,
  },
  {
    key: 'sharepoint',
    name: 'SharePoint',
    subtitle: 'Content Management · Document & site permissions',
    category: 'Content Management',
    description:
      'Verify site collection permissions, external sharing policies, document library access controls, and sensitivity label enforcement across SharePoint tenants.',
    brandColor: '#038387',
    iconBg: 'bg-[#038387]',
    isoTags: [
      'A.5.15 Site Permissions',
      'A.5.14 External Sharing',
      'A.5.10 Library Access',
      'A.5.12 Sensitivity Labels',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="6"
          y="8"
          width="20"
          height="16"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 14h10M11 18h7"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: sharepointService as any,
  },
  {
    key: 'splunk',
    name: 'Splunk',
    subtitle: 'SIEM · Log management & security monitoring',
    category: 'SIEM',
    description:
      'Audit index access controls, saved search permissions, alert configurations, and user role assignments to ensure SIEM governance and log integrity.',
    brandColor: '#65A637',
    iconBg: 'bg-[#65A637]',
    isoTags: [
      'A.8.15 Log Management',
      'A.5.15 Index Access',
      'A.8.16 Alert Configuration',
      'A.5.2 Role Assignments',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 16l4-8 4 12 4-6 4 4 4-2"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: splunkService as any,
  },
  {
    key: 'sumologic',
    name: 'Sumo Logic',
    subtitle: 'SIEM · Cloud-native log analytics & security',
    category: 'SIEM',
    description:
      'Verify collector configurations, partition access policies, role-based data access controls, and audit log completeness across Sumo Logic deployments.',
    brandColor: '#000099',
    iconBg: 'bg-[#000099]',
    isoTags: [
      'A.8.15 Collector Config',
      'A.5.10 Partition Access',
      'A.5.15 Data Access Roles',
      'A.8.15 Audit Completeness',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M10 19c1.5-4 4-6 6-6s4.5 2 6 6"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: sumologicService as any,
  },
  {
    key: 'tenable',
    name: 'Tenable',
    subtitle: 'Vulnerability Management · Asset scanning & risk',
    category: 'Vulnerability Management',
    description:
      'Audit scan policy configurations, asset group permissions, vulnerability remediation SLAs, and user access rights across Tenable.io or Tenable.sc.',
    brandColor: '#00B388',
    iconBg: 'bg-[#00B388]',
    isoTags: [
      'A.8.8 Scan Policies',
      'A.5.15 Asset Permissions',
      'A.8.8 Remediation SLAs',
      'A.5.2 User Access Rights',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="4" fill="white" />
      </svg>
    ),
    service: tenableService as any,
  },
  {
    key: 'qualys',
    name: 'Qualys',
    subtitle: 'Vulnerability Management · Compliance & scanning',
    category: 'Vulnerability Management',
    description:
      'Verify scanner appliance configurations, asset tag policies, compliance profile assignments, and user permission sets across the Qualys Cloud Platform.',
    brandColor: '#ED0000',
    iconBg: 'bg-[#ED0000]',
    isoTags: [
      'A.8.8 Scanner Config',
      'A.5.12 Asset Tag Policies',
      'A.5.36 Compliance Profiles',
      'A.5.15 User Permissions',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 5C9.9 5 5 9.9 5 16s4.9 11 11 11 11-4.9 11-11S22.1 5 16 5z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 20l8-8M12 12l8 8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: qualysService as any,
  },
  {
    key: 'digitalocean',
    name: 'DigitalOcean',
    subtitle: 'Cloud Provider · Infrastructure access, network and encryption',
    category: 'Cloud Provider',
    description:
      'Verify MFA coverage for team members, public ingress rules are restricted, block storage encryption is enabled, and stale API tokens are rotated.',
    brandColor: '#0080FF',
    iconBg: 'bg-[#0080FF]',
    isoTags: [
      'A.5.17 MFA Coverage',
      'A.8.20 Ingress Controls',
      'A.8.24 Volume Encryption',
      'A.5.18 Token Rotation',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="11" fill="white" opacity="0.2" />
        <circle cx="16" cy="16" r="6.5" fill="white" />
        <circle cx="23.5" cy="23.5" r="2.5" fill="white" />
      </svg>
    ),
    service: digitaloceanService as any,
  },
  {
    key: 'heroku',
    name: 'Heroku',
    subtitle: 'Cloud Provider · App pipeline security and auditability',
    category: 'Cloud Provider',
    description:
      'Verify production pipelines are protected, config var secrets follow rotation cadence, team access roles are reviewed, and log drains are enabled for critical apps.',
    brandColor: '#79589F',
    iconBg: 'bg-[#79589F]',
    isoTags: [
      'A.8.32 Protected Pipelines',
      'A.5.33 Secrets Rotation',
      'A.5.18 Role Reviews',
      'A.8.15 Log Drains',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="6"
          width="18"
          height="20"
          rx="2"
          fill="white"
          opacity="0.95"
        />
        <rect x="10" y="10" width="4" height="12" fill="#79589F" />
        <rect x="18" y="10" width="4" height="12" fill="#79589F" />
      </svg>
    ),
    service: herokuService as any,
  },
  {
    key: 'render',
    name: 'Render',
    subtitle: 'Cloud Provider · Service access and deployment governance',
    category: 'Cloud Provider',
    description:
      'Verify least-privilege access for production services, environment secrets are rotated regularly, private network rules are reviewed, and deploy audit logs are retained.',
    brandColor: '#111111',
    iconBg: 'bg-[#111111]',
    isoTags: [
      'A.5.15 Least Privilege',
      'A.5.33 Secrets Rotation',
      'A.8.20 Network Rules',
      'A.8.15 Deploy Logs',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 8h8l8 8-8 8H8l8-8-8-8z" fill="white" />
      </svg>
    ),
    service: renderService as any,
  },
  {
    key: 'netlify',
    name: 'Netlify',
    subtitle: 'Cloud Provider · Deploy controls and build security hygiene',
    category: 'Cloud Provider',
    description:
      'Verify SSO and MFA are enforced for admins, branch deploy controls are configured, environment variable access is restricted, and build logs are retained for investigations.',
    brandColor: '#00C7B7',
    iconBg: 'bg-[#00C7B7]',
    isoTags: [
      'A.5.17 SSO and MFA',
      'A.8.32 Branch Deploy Controls',
      'A.5.15 Env Var Access',
      'A.8.15 Build Logs',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 7h9v9H7zM16 16h9v9h-9zM16 7h9v9h-9zM7 16h9v9H7z"
          fill="white"
        />
      </svg>
    ),
    service: netlifyService as any,
  },
  {
    key: 'vercel',
    name: 'Vercel',
    subtitle: 'Cloud Provider · Deployment protection and access monitoring',
    category: 'Cloud Provider',
    description:
      'Verify production deployment protection is enabled, team role assignments are reviewed, environment secrets rotation policy is active, and access logs are monitored for anomalies.',
    brandColor: '#000000',
    iconBg: 'bg-[#000000]',
    isoTags: [
      'A.8.32 Deployment Protection',
      'A.5.18 Role Assignment Reviews',
      'A.5.33 Secrets Policy',
      'A.8.16 Access Monitoring',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 6l10 18H6L16 6z" fill="white" />
      </svg>
    ),
    service: vercelService as any,
  },
  {
    key: 'scaleway',
    name: 'Scaleway',
    subtitle: 'Cloud Provider · European cloud infrastructure',
    category: 'Cloud Provider',
    description:
      'Verify IAM policy follows least-privilege principles, object storage has no public access, instance security group rules are reviewed, and API keys follow rotation compliance.',
    brandColor: '#4F0599',
    iconBg: 'bg-[#4F0599]',
    isoTags: [
      'A.5.17 Admin MFA',
      'A.8.20 Security Groups',
      'A.8.24 Storage Encryption',
      'A.8.15 Activity Logs',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="6"
          y="6"
          width="20"
          height="20"
          rx="4"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M11 16h10M16 11v10"
          stroke="#4F0599"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: scalewayService as any,
  },
  {
    key: 'gitlab-self-managed',
    name: 'GitLab Self Managed',
    subtitle: 'Version Control · On-premise source code management',
    category: 'Version Control',
    description:
      'Verify branch protection rules are enforced, merge request approval policies are active, secret scanning is enabled, and admin accounts are regularly reviewed.',
    brandColor: '#FC6D26',
    iconBg: 'bg-[#FC6D26]',
    isoTags: [
      'A.8.4 Branch Protection',
      'A.8.32 Merge Approvals',
      'A.5.15 Admin Access',
      'A.8.15 Audit Logging',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 27L6 11l3-8 3 8h8l3-8 3 8z" fill="white" opacity="0.9" />
      </svg>
    ),
    service: gitlabSelfManagedService as any,
  },
  {
    key: 'azure-devops',
    name: 'Azure DevOps',
    subtitle: 'Version Control · CI/CD and project management',
    category: 'Version Control',
    description:
      'Verify branch policies are enforced, pipeline secret variables are protected, project member access is reviewed, and audit log retention is configured.',
    brandColor: '#0078D7',
    iconBg: 'bg-[#0078D7]',
    isoTags: [
      'A.5.15 Repo Permissions',
      'A.8.4 Branch Policies',
      'A.8.32 Approval Gates',
      'A.8.15 Audit Streams',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 10l6-4v20l-6-4V10z" fill="white" opacity="0.9" />
        <path d="M10 6l12 4v12l-12 4V6z" fill="white" opacity="0.7" />
        <path d="M22 10l6 4v8l-6 4V10z" fill="white" opacity="0.5" />
      </svg>
    ),
    service: azureDevopsService as any,
  },
  {
    key: 'auth0',
    name: 'Auth0',
    subtitle: 'Identity Provider · Authentication and authorization',
    category: 'Identity Provider',
    description:
      'Verify MFA enforcement across all applications, anomaly detection rules are active, tenant admin roles are reviewed, and token expiry policies are compliant.',
    brandColor: '#EB5424',
    iconBg: 'bg-[#EB5424]',
    isoTags: [
      'A.5.17 MFA Enforcement',
      'A.8.16 Anomaly Detection',
      'A.5.18 Admin Review',
      'A.5.15 Token Policy',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="4" fill="white" />
        <path
          d="M16 6v4M16 22v4M6 16h4M22 16h4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: auth0Service as any,
  },
  {
    key: 'pingone',
    name: 'PingOne',
    subtitle: 'Identity Provider · Cloud identity management',
    category: 'Identity Provider',
    description:
      'Verify MFA policy coverage, dormant identities are cleaned up, admin privilege assignments are reviewed, and application access policies are audited.',
    brandColor: '#B3282D',
    iconBg: 'bg-[#B3282D]',
    isoTags: [
      'A.5.17 Strong Authentication',
      'A.5.18 Dormant Identities',
      'A.5.15 Role Governance',
      'A.8.16 Risk Signals',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="12" r="6" fill="white" />
        <path
          d="M6 26c0-5.5 4.5-10 10-10s10 4.5 10 10"
          fill="white"
          opacity="0.8"
        />
      </svg>
    ),
    service: pingoneService as any,
  },
  {
    key: 'tailscale',
    name: 'Tailscale',
    subtitle: 'Identity Provider · Network identity and access controls',
    category: 'Identity Provider',
    description:
      'Verify MFA enforcement for all users, ACL policies are reviewed, device authorization remains compliant, and admin user access is regularly audited.',
    brandColor: '#242424',
    iconBg: 'bg-[#242424]',
    isoTags: [
      'A.5.17 MFA Enforcement',
      'A.8.20 ACL Policy',
      'A.8.9 Device Authorization',
      'A.5.18 Admin Access Audit',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="6" width="8" height="8" rx="2" fill="white" />
        <rect x="18" y="6" width="8" height="8" rx="2" fill="white" />
        <rect x="6" y="18" width="8" height="8" rx="2" fill="white" />
        <rect x="18" y="18" width="8" height="8" rx="2" fill="white" />
      </svg>
    ),
    service: tailscaleService as any,
  },
  {
    key: 'mondaycom',
    name: 'Monday.com',
    subtitle: 'Task Management · Workspace sharing and member governance',
    category: 'Task Management',
    description:
      'Verify workspace member access is reviewed, board sharing policies are audited, guest account governance is enforced, and integration permissions are reviewed.',
    brandColor: '#FF3D57',
    iconBg: 'bg-[#FF3D57]',
    isoTags: [
      'A.5.15 Member Access',
      'A.5.14 Board Sharing',
      'A.6.6 Guest Governance',
      'A.5.15 Integration Permissions',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="8" width="20" height="4" rx="2" fill="white" />
        <rect
          x="6"
          y="14"
          width="16"
          height="4"
          rx="2"
          fill="white"
          opacity="0.85"
        />
        <rect
          x="6"
          y="20"
          width="12"
          height="4"
          rx="2"
          fill="white"
          opacity="0.7"
        />
      </svg>
    ),
    service: mondaycomService as any,
  },
  {
    key: 'basecamp',
    name: 'Basecamp',
    subtitle: 'Task Management · Project access and collaboration controls',
    category: 'Task Management',
    description:
      'Verify project access controls are reviewed, external collaborators are audited, admin role assignments are reviewed, and file sharing policies remain compliant.',
    brandColor: '#1D9BF0',
    iconBg: 'bg-[#1D9BF0]',
    isoTags: [
      'A.5.15 Project Access',
      'A.6.6 External Collaborators',
      'A.5.18 Admin Roles',
      'A.5.14 File Sharing',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 5l11 7v13H5V12l11-7z" fill="white" opacity="0.9" />
        <path
          d="M12 18h8"
          stroke="#1D9BF0"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: basecampService as any,
  },
  {
    key: 'smartsheet',
    name: 'Smartsheet',
    subtitle: 'Task Management · Sheet sharing and admin permission controls',
    category: 'Task Management',
    description:
      'Verify workspace sharing controls are audited, external user access is reviewed, admin permissions are reviewed, and report sharing policy remains compliant.',
    brandColor: '#1F6FEB',
    iconBg: 'bg-[#1F6FEB]',
    isoTags: [
      'A.5.14 Workspace Sharing',
      'A.6.6 External User Access',
      'A.5.18 Admin Permissions',
      'A.5.15 Report Sharing',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="6"
          width="18"
          height="20"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 11h10M11 16h10M11 21h6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: smartsheetService as any,
  },
  {
    key: 'zendesk',
    name: 'Zendesk',
    subtitle: 'Task Management · Support access and ticket data governance',
    category: 'Task Management',
    description:
      'Verify agent permissions are reviewed, customer data access is audited, admin role governance is enforced, and API token rotation remains compliant.',
    brandColor: '#03363D',
    iconBg: 'bg-[#03363D]',
    isoTags: [
      'A.5.15 Agent Permissions',
      'A.5.34 Customer Data Access',
      'A.5.18 Admin Governance',
      'A.5.17 API Token Rotation',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 9h16v14H8z" fill="none" stroke="white" strokeWidth="2" />
        <path
          d="M12 14h8M12 18h6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: zendeskService as any,
  },
  {
    key: 'microsoft-teams',
    name: 'Microsoft Teams',
    subtitle: 'Communication · Messaging, collaboration and admin governance',
    category: 'Communication',
    description:
      'Verify external guest access policy is enforced, admin role assignments are reviewed, channel retention settings remain compliant, and security alerting is monitored.',
    brandColor: '#6264A7',
    iconBg: 'bg-[#6264A7]',
    isoTags: [
      'A.5.14 Guest Access Policy',
      'A.5.18 Admin Role Review',
      'A.8.15 Channel Retention',
      'A.8.16 Security Alerting',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="6"
          y="8"
          width="12"
          height="16"
          rx="2"
          fill="white"
          opacity="0.95"
        />
        <rect
          x="18"
          y="10"
          width="8"
          height="12"
          rx="2"
          fill="white"
          opacity="0.7"
        />
        <path
          d="M10 13h4M10 17h4"
          stroke="#6264A7"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: microsoftTeamsService as any,
  },
  {
    key: 'zoom',
    name: 'Zoom',
    subtitle: 'Communication · Meeting security and host control posture',
    category: 'Communication',
    description:
      'Verify passcode and waiting room policy is enforced, recording access restrictions are configured, host privileges are reviewed, and suspicious sign-in alerts are monitored.',
    brandColor: '#2D8CFF',
    iconBg: 'bg-[#2D8CFF]',
    isoTags: [
      'A.5.17 Meeting Security Defaults',
      'A.5.15 Recording Access',
      'A.5.18 Host Privileges',
      'A.8.16 Sign-in Alerts',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="14" cy="16" r="8" fill="white" />
        <path d="M20 13l6-3v12l-6-3z" fill="white" opacity="0.85" />
      </svg>
    ),
    service: zoomService as any,
  },
  {
    key: 'webex',
    name: 'Webex',
    subtitle: 'Communication · Meeting governance and external access controls',
    category: 'Communication',
    description:
      'Verify meeting security defaults are enforced, external federation policy is reviewed, admin access roles are audited, and audit event retention is configured.',
    brandColor: '#00BCEB',
    iconBg: 'bg-[#00BCEB]',
    isoTags: [
      'A.5.17 Meeting Security',
      'A.5.14 Federation Policy',
      'A.5.15 Admin Access Roles',
      'A.8.15 Audit Event Retention',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6a10 10 0 1010 10"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M16 26a10 10 0 01-10-10"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    ),
    service: webexService as any,
  },
  {
    key: 'hubspot',
    name: 'HubSpot',
    subtitle: 'CRM · Customer data access and token governance',
    category: 'CRM',
    description:
      'Verify user role permissions are reviewed, customer data export controls are enforced, private app token rotation is compliant, and admin activity is monitored.',
    brandColor: '#FF7A59',
    iconBg: 'bg-[#FF7A59]',
    isoTags: [
      'A.5.15 Role Permissions',
      'A.5.34 Data Export Controls',
      'A.5.17 Token Rotation',
      'A.8.16 Admin Activity Monitoring',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="4" fill="white" />
        <circle cx="9" cy="11" r="2" fill="white" opacity="0.8" />
        <circle cx="23" cy="11" r="2" fill="white" opacity="0.8" />
        <circle cx="9" cy="21" r="2" fill="white" opacity="0.8" />
        <path
          d="M11 12.5l3 2M21 12.5l-3 2M11 19.5l3-2"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: hubspotService as any,
  },
  {
    key: 'salesforce',
    name: 'Salesforce',
    subtitle: 'CRM · Permission model, session controls and data governance',
    category: 'CRM',
    description:
      'Verify profile and permission sets are reviewed, login IP and session controls are enforced, connected app policy is audited, and field-level data access governance is verified.',
    brandColor: '#00A1E0',
    iconBg: 'bg-[#00A1E0]',
    isoTags: [
      'A.5.15 Permission Sets',
      'A.5.17 Session Controls',
      'A.8.16 Connected App Policy',
      'A.5.34 Field-Level Data Access',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 21h12a4 4 0 100-8 5 5 0 00-9.7-1.7A3.8 3.8 0 0010 21z"
          fill="white"
        />
      </svg>
    ),
    service: salesforceService as any,
  },
  {
    key: 'pipedrive',
    name: 'Pipedrive',
    subtitle: 'CRM · Deal pipeline governance and API token hygiene',
    category: 'CRM',
    description:
      'Verify user role permissions are reviewed, pipeline visibility restrictions are enforced, API token rotation is compliant, and deal export controls are audited.',
    brandColor: '#1A9F60',
    iconBg: 'bg-[#1A9F60]',
    isoTags: [
      'A.5.15 Role Permissions',
      'A.5.14 Pipeline Visibility',
      'A.5.17 Token Rotation',
      'A.5.34 Deal Export Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="10" fill="white" opacity="0.2" />
        <circle cx="16" cy="16" r="5" fill="white" />
      </svg>
    ),
    service: pipedriveService as any,
  },
  {
    key: 'copper',
    name: 'Copper',
    subtitle: 'CRM · Workspace member governance and sharing controls',
    category: 'CRM',
    description:
      'Verify workspace member access is reviewed, account sharing policy is compliant, admin role governance is verified, and API key lifecycle controls are enforced.',
    brandColor: '#B87333',
    iconBg: 'bg-[#B87333]',
    isoTags: [
      'A.5.15 Member Access',
      'A.5.14 Sharing Policy',
      'A.5.18 Admin Governance',
      'A.5.17 API Key Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="4"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M12 16h8"
          stroke="#B87333"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: copperService as any,
  },
  {
    key: 'apollo',
    name: 'Apollo',
    subtitle: 'Sales · Prospecting data access and workflow permissions',
    category: 'Sales',
    description:
      'Verify prospect data access controls are reviewed, enrichment workflow permissions are bounded, API token and integration scopes are audited, and export governance is verified.',
    brandColor: '#2B6CB0',
    iconBg: 'bg-[#2B6CB0]',
    isoTags: [
      'A.5.15 Data Access',
      'A.5.15 Workflow Permissions',
      'A.5.17 Token and Scope Audit',
      'A.5.34 Export Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 6l8 20h-3l-1.5-4h-7L11 26H8l8-20z" fill="white" />
      </svg>
    ),
    service: apolloService as any,
  },
  {
    key: 'gong',
    name: 'Gong',
    subtitle: 'Sales · Recording access and external sharing governance',
    category: 'Sales',
    description:
      'Verify recording access permissions are reviewed, team role governance is enforced, external sharing restrictions are validated, and API credential usage is monitored.',
    brandColor: '#FF7A00',
    iconBg: 'bg-[#FF7A00]',
    isoTags: [
      'A.5.15 Recording Access',
      'A.5.18 Team Role Governance',
      'A.5.14 External Sharing',
      'A.8.16 Credential Monitoring',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="3" fill="white" />
      </svg>
    ),
    service: gongService as any,
  },
  {
    key: 'zoominfo',
    name: 'ZoomInfo',
    subtitle: 'Sales · Data access, export policy, and admin controls',
    category: 'Sales',
    description:
      'Verify user access permissions are reviewed, data export restrictions are enforced, admin privilege assignments are audited, and API key controls are validated.',
    brandColor: '#0052CC',
    iconBg: 'bg-[#0052CC]',
    isoTags: [
      'A.5.15 Access Permissions',
      'A.5.34 Export Restrictions',
      'A.5.18 Admin Privileges',
      'A.5.17 API Key Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 9h16v4H8zM8 15h16v4H8zM8 21h16v2H8z" fill="white" />
      </svg>
    ),
    service: zoominfoService as any,
  },
  {
    key: 'gusto',
    name: 'Gusto',
    subtitle: 'HRIS · Payroll data access and admin governance controls',
    category: 'HRIS',
    description:
      'Verify employee access roles are reviewed, payroll data access controls are enforced, admin privilege governance is audited, and API credential lifecycle controls are validated.',
    brandColor: '#F45D48',
    iconBg: 'bg-[#F45D48]',
    isoTags: [
      'A.5.15 Access Roles',
      'A.5.34 Payroll Data Controls',
      'A.5.18 Admin Governance',
      'A.5.17 Credential Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="10" fill="white" opacity="0.2" />
        <path
          d="M12 16h8M16 12v8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: gustoService as any,
  },
  {
    key: 'trinet',
    name: 'TriNet',
    subtitle: 'HRIS · Role assignment, data export, and admin audit controls',
    category: 'HRIS',
    description:
      'Verify user role assignments are reviewed, employee data export restrictions are enforced, privileged admin accounts are audited, and API and SSO integration governance is validated.',
    brandColor: '#003A70',
    iconBg: 'bg-[#003A70]',
    isoTags: [
      'A.5.15 Role Assignments',
      'A.5.34 Data Export Restrictions',
      'A.5.18 Admin Account Audit',
      'A.8.16 Integration Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="3"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 12h10M16 12v10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: trinetService as any,
  },
  {
    key: 'humaans',
    name: 'Humaans',
    subtitle: 'HRIS · Lifecycle workflows and PII field access controls',
    category: 'HRIS',
    description:
      'Verify HR user permissions are reviewed, lifecycle workflow boundaries are enforced, PII field access controls are audited, and API token governance is monitored.',
    brandColor: '#3B82F6',
    iconBg: 'bg-[#3B82F6]',
    isoTags: [
      'A.5.15 HR Permissions',
      'A.6.5 Lifecycle Workflow Boundaries',
      'A.5.34 PII Field Controls',
      'A.5.17 API Token Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="12" r="3" fill="white" />
        <circle cx="21" cy="12" r="3" fill="white" opacity="0.7" />
        <path
          d="M7 23c0-3 2-5 4-5s4 2 4 5M17 23c0-3 2-5 4-5s4 2 4 5"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: humaansService as any,
  },
  {
    key: 'personio',
    name: 'Personio',
    subtitle: 'HRIS · Role-based access and document permission governance',
    category: 'HRIS',
    description:
      'Verify role-based access configuration is reviewed, employee document access restrictions are enforced, admin account governance is audited, and API credential controls are validated.',
    brandColor: '#1B7F5C',
    iconBg: 'bg-[#1B7F5C]',
    isoTags: [
      'A.5.15 RBAC Review',
      'A.5.34 Document Access Restrictions',
      'A.5.18 Admin Governance',
      'A.5.17 API Credential Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="6"
          width="16"
          height="20"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 12h8M12 16h8M12 20h5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: personioService as any,
  },
  {
    key: 'adp-workforce-now',
    name: 'ADP Workforce Now',
    subtitle: 'HRIS · Payroll and PII access policy governance',
    category: 'HRIS',
    description:
      'Verify access role policy is reviewed, payroll and PII access controls are enforced, admin privilege assignments are audited, and integration token lifecycle controls are validated.',
    brandColor: '#D30000',
    iconBg: 'bg-[#D30000]',
    isoTags: [
      'A.5.15 Access Role Policy',
      'A.5.34 Payroll and PII Controls',
      'A.5.18 Admin Privilege Audit',
      'A.5.17 Token Lifecycle Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M7 8h18v16H7z" fill="none" stroke="white" strokeWidth="2" />
        <path
          d="M11 12h10M11 16h7M11 20h5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: adpWorkforceNowService as any,
  },
  {
    key: 'deel',
    name: 'Deel',
    subtitle: 'HRIS · Global payroll and contractor access governance',
    category: 'HRIS',
    description:
      'Verify role-based user access is reviewed, payroll and contractor data controls are enforced, admin privilege assignments are audited, and API credential lifecycle controls are validated.',
    brandColor: '#0A0A0A',
    iconBg: 'bg-[#0A0A0A]',
    isoTags: [
      'A.5.15 Role-Based Access',
      'A.5.34 Payroll and Contractor Data',
      'A.5.18 Admin Privileges',
      'A.5.17 Credential Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="3"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M12 16h8"
          stroke="#0A0A0A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: deelService as any,
  },
  {
    key: 'employment-hero',
    name: 'Employment Hero',
    subtitle: 'HRIS · Employee record protection and admin access controls',
    category: 'HRIS',
    description:
      'Verify role permissions are reviewed, employee record access restrictions are enforced, privileged admin account governance is audited, and API integration access controls are validated.',
    brandColor: '#5A3E9A',
    iconBg: 'bg-[#5A3E9A]',
    isoTags: [
      'A.5.15 Role Permissions',
      'A.5.34 Record Access Restrictions',
      'A.5.18 Privileged Admin Governance',
      'A.8.16 Integration Access Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 6l10 6v8l-10 6-10-6v-8l10-6z" fill="white" opacity="0.9" />
      </svg>
    ),
    service: employmentHeroService as any,
  },
  {
    key: 'justworks',
    name: 'Justworks',
    subtitle: 'HRIS · Payroll export controls and SSO governance',
    category: 'HRIS',
    description:
      'Verify user access role policy is reviewed, payroll data export restrictions are enforced, admin privilege assignments are audited, and credential plus SSO integration controls are validated.',
    brandColor: '#2F855A',
    iconBg: 'bg-[#2F855A]',
    isoTags: [
      'A.5.15 Access Role Policy',
      'A.5.34 Payroll Export Restrictions',
      'A.5.18 Admin Privilege Audit',
      'A.5.17 Credential and SSO Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 16l3 3 5-6"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: justworksService as any,
  },
  {
    key: 'factorial',
    name: 'Factorial',
    subtitle: 'HRIS · HR permission boundaries and document access controls',
    category: 'HRIS',
    description:
      'Verify HR user permissions are reviewed, employee document access controls are enforced, admin role governance is audited, and API token management controls are validated.',
    brandColor: '#F97316',
    iconBg: 'bg-[#F97316]',
    isoTags: [
      'A.5.15 HR Permissions',
      'A.5.34 Document Access Controls',
      'A.5.18 Admin Role Governance',
      'A.5.17 API Token Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="8"
          width="16"
          height="16"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 12h8M12 16h8M12 20h5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: factorialService as any,
  },
  {
    key: 'alexishr',
    name: 'AlexisHR',
    subtitle:
      'HRIS · Sensitive profile access and credential lifecycle controls',
    category: 'HRIS',
    description:
      'Verify role-based access configuration is reviewed, sensitive employee profile restrictions are enforced, admin privilege governance is audited, and integration credential lifecycle controls are validated.',
    brandColor: '#2563EB',
    iconBg: 'bg-[#2563EB]',
    isoTags: [
      'A.5.15 RBAC Configuration',
      'A.5.34 Sensitive Profile Restrictions',
      'A.5.18 Admin Privilege Governance',
      'A.5.17 Credential Lifecycle Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="11" r="4" fill="white" />
        <path
          d="M8 24c0-4.2 3.6-7 8-7s8 2.8 8 7"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: alexishrService as any,
  },
  {
    key: 'addigy',
    name: 'Addigy',
    subtitle: 'MDM · Device enrollment and compliance governance',
    category: 'MDM',
    description:
      'Verify MDM enrollment coverage is reviewed, device compliance policies are enforced, privileged admin access governance is audited, and API credential lifecycle controls are validated.',
    brandColor: '#00A3E0',
    iconBg: 'bg-[#00A3E0]',
    isoTags: [
      'A.8.1 Enrollment Coverage',
      'A.8.9 Compliance Policy',
      'A.5.18 Admin Access Governance',
      'A.5.17 Credential Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="9"
          y="6"
          width="14"
          height="20"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="22" r="1.5" fill="white" />
      </svg>
    ),
    service: addigyService as any,
  },
  {
    key: 'workspace-one',
    name: 'Workspace One',
    subtitle: 'MDM · Device ownership, baseline policy, and admin controls',
    category: 'MDM',
    description:
      'Verify device enrollment and ownership coverage is reviewed, baseline security policy compliance is validated, admin role assignment governance is audited, and integration credential lifecycle controls are validated.',
    brandColor: '#607D8B',
    iconBg: 'bg-[#607D8B]',
    isoTags: [
      'A.8.1 Device Coverage',
      'A.8.9 Baseline Policy',
      'A.5.18 Role Assignment Governance',
      'A.5.17 Credential Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="6"
          y="8"
          width="20"
          height="14"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 24h8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: workspaceOneService as any,
  },
  {
    key: 'huntress',
    name: 'Huntress',
    subtitle: 'Endpoint Security · Managed detection and response posture',
    category: 'Endpoint Security',
    description:
      'Verify endpoint coverage is reviewed, managed detection policy enforcement is validated, analyst and admin privilege governance is audited, and alert triage workflow compliance is validated.',
    brandColor: '#111827',
    iconBg: 'bg-[#111827]',
    isoTags: [
      'A.8.7 Endpoint Coverage',
      'A.8.16 Detection Policy',
      'A.5.18 Privilege Governance',
      'A.5.24 Triage Workflow',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 5l10 4v7c0 5.7-3.9 10.9-10 12-6.1-1.1-10-6.3-10-12V9l10-4z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 16l3 3 5-6"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: huntressService as any,
  },
  {
    key: 'intruder',
    name: 'Intruder',
    subtitle: 'Vulnerability Scanner · External surface and remediation SLA',
    category: 'Vulnerability Scanner',
    description:
      'Verify external attack surface scan coverage is reviewed, severity triage workflow is validated, stale finding remediation SLA compliance is audited, and scanner credential governance is verified.',
    brandColor: '#8B5CF6',
    iconBg: 'bg-[#8B5CF6]',
    isoTags: [
      'A.8.8 Surface Scan Coverage',
      'A.8.9 Severity Triage',
      'A.5.24 Remediation SLA',
      'A.5.17 Credential Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M16 11v5l3 2"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: intruderService as any,
  },
  {
    key: 'orca-security',
    name: 'Orca Security',
    subtitle: 'Vulnerability Scanner · Cloud asset and misconfiguration risk',
    category: 'Vulnerability Scanner',
    description:
      'Verify cloud asset inventory coverage is reviewed, critical misconfiguration detection policy is enforced, sensitive data exposure monitoring is validated, and admin plus API access governance is audited.',
    brandColor: '#0EA5E9',
    iconBg: 'bg-[#0EA5E9]',
    isoTags: [
      'A.5.9 Asset Inventory',
      'A.8.20 Misconfiguration Detection',
      'A.5.34 Data Exposure Monitoring',
      'A.5.15 Admin and API Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6c5.5 0 10 4.5 10 10s-4.5 10-10 10S6 21.5 6 16 10.5 6 16 6z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="3" fill="white" />
      </svg>
    ),
    service: orcaSecurityService as any,
  },
  {
    key: 'hostedscan',
    name: 'HostedScan',
    subtitle: 'Vulnerability Scanner · Attack surface and remediation tracking',
    category: 'Vulnerability Scanner',
    description:
      'Verify attack surface scan coverage is reviewed, vulnerability prioritization workflow is validated, remediation SLA compliance is audited, and scanner credential governance is verified.',
    brandColor: '#6D28D9',
    iconBg: 'bg-[#6D28D9]',
    isoTags: [
      'A.8.8 Surface Scan Coverage',
      'A.8.9 Prioritization Workflow',
      'A.5.24 Remediation SLA',
      'A.5.17 Scanner Credentials',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M16 10v6l4 2"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: hostedscanService as any,
  },
  {
    key: 'aikido-security',
    name: 'Aikido Security',
    subtitle: 'Vulnerability Scanner · Code and cloud findings governance',
    category: 'Vulnerability Scanner',
    description:
      'Verify code and cloud finding coverage is reviewed, policy severity tuning is validated, stale critical remediation is audited, and integration token governance is verified.',
    brandColor: '#14B8A6',
    iconBg: 'bg-[#14B8A6]',
    isoTags: [
      'A.8.9 Finding Coverage',
      'A.8.16 Severity Tuning',
      'A.5.24 Critical Remediation',
      'A.5.17 Integration Tokens',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6l9 5v10l-9 5-9-5V11l9-5z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="3" fill="white" />
      </svg>
    ),
    service: aikidoSecurityService as any,
  },
  {
    key: 'jit',
    name: 'Jit',
    subtitle: 'Vulnerability Scanner · Alert triage and control baseline',
    category: 'Vulnerability Scanner',
    description:
      'Verify control coverage and baseline policy are reviewed, alert triage workflow compliance is validated, remediation SLA adherence is audited, and integration access governance is verified.',
    brandColor: '#0F172A',
    iconBg: 'bg-[#0F172A]',
    isoTags: [
      'A.8.9 Control Baseline',
      'A.8.16 Alert Triage',
      'A.5.24 Remediation SLA',
      'A.5.15 Integration Access',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="7"
          width="16"
          height="18"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 12h8M12 16h5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: jitService as any,
  },
  {
    key: 'knowbe4',
    name: 'KnowBe4',
    subtitle: 'Security Training · Phishing simulation and awareness cadence',
    category: 'Security Training',
    description:
      'Verify phishing simulation coverage is reviewed, mandatory training completion is validated, high-risk user coaching assignment is audited, and admin campaign governance is verified.',
    brandColor: '#F59E0B',
    iconBg: 'bg-[#F59E0B]',
    isoTags: [
      'A.6.3 Simulation Coverage',
      'A.6.3 Training Completion',
      'A.6.3 User Coaching',
      'A.5.18 Campaign Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 5l10 4v7c0 5.7-3.9 10.9-10 12-6.1-1.1-10-6.3-10-12V9l10-4z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M16 11v6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="20" r="1.5" fill="white" />
      </svg>
    ),
    service: knowbe4Service as any,
  },
  {
    key: 'cybeready',
    name: 'Cybeready',
    subtitle: 'Security Training · Participation and risk behavior governance',
    category: 'Security Training',
    description:
      'Verify training cadence compliance is reviewed, phishing campaign participation is validated, repeat-risk user interventions are audited, and admin access governance is verified.',
    brandColor: '#DC2626',
    iconBg: 'bg-[#DC2626]',
    isoTags: [
      'A.6.3 Training Cadence',
      'A.6.3 Campaign Participation',
      'A.6.3 Risk Interventions',
      'A.5.18 Admin Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M10 16h12M16 10v12"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: cybereadyService as any,
  },
  {
    key: 'hook-security',
    name: 'Hook Security',
    subtitle:
      'Security Training · Phishing participation and coaching governance',
    category: 'Security Training',
    description:
      'Verify phishing training cadence is reviewed, campaign participation is validated, repeat-risk user coaching is audited, and admin governance for campaigns is verified.',
    brandColor: '#7C3AED',
    iconBg: 'bg-[#7C3AED]',
    isoTags: [
      'A.6.3 Training Cadence',
      'A.6.3 Campaign Participation',
      'A.6.3 User Coaching',
      'A.5.18 Admin Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 5l10 4v7c0 5.7-3.9 10.9-10 12-6.1-1.1-10-6.3-10-12V9l10-4z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 16l3 3 5-6"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: hookSecurityService as any,
  },
  {
    key: 'hoxhunt',
    name: 'HoxHunt',
    subtitle: 'Security Training · Behavioral risk and simulation governance',
    category: 'Security Training',
    description:
      'Verify simulation coverage is reviewed, training completion rates are validated, high-risk behavior interventions are audited, and tenant admin access governance is verified.',
    brandColor: '#0EA5E9',
    iconBg: 'bg-[#0EA5E9]',
    isoTags: [
      'A.6.3 Simulation Coverage',
      'A.6.3 Completion Rates',
      'A.6.3 Risk Interventions',
      'A.5.18 Admin Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 16h10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2" fill="white" />
      </svg>
    ),
    service: hoxhuntService as any,
  },
  {
    key: 'certn',
    name: 'Certn',
    subtitle: 'Background Checks · Screening policy and data access controls',
    category: 'Background Checks',
    description:
      'Verify screening workflow access roles are reviewed, candidate PII access restrictions are enforced, adjudication privilege assignments are audited, and integration credentials are governed.',
    brandColor: '#1E3A8A',
    iconBg: 'bg-[#1E3A8A]',
    isoTags: [
      'A.5.15 Access Roles',
      'A.5.34 Candidate PII Access',
      'A.5.18 Privilege Assignments',
      'A.5.17 Integration Credentials',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="7"
          width="16"
          height="18"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 13h8M12 17h8M12 21h5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: certnService as any,
  },
  {
    key: 'checkr',
    name: 'Checkr',
    subtitle: 'Background Checks · Candidate screening and access governance',
    category: 'Background Checks',
    description:
      'Verify screening access roles are reviewed, candidate record access controls are enforced, admin privilege governance is audited, and API token lifecycle controls are validated.',
    brandColor: '#16A34A',
    iconBg: 'bg-[#16A34A]',
    isoTags: [
      'A.5.15 Screening Roles',
      'A.5.34 Candidate Record Access',
      'A.5.18 Admin Governance',
      'A.5.17 Token Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 16l5 5 13-13"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: checkrService as any,
  },
  {
    key: 'dashlane',
    name: 'Dashlane',
    subtitle: 'Password Manager · Vault permissions and credential hygiene',
    category: 'Password Manager',
    description:
      'Verify vault sharing permissions are reviewed, MFA policy coverage is validated, stale member cleanup is audited, and secret rotation plus credential risk alerts are monitored.',
    brandColor: '#0F172A',
    iconBg: 'bg-[#0F172A]',
    isoTags: [
      'A.5.15 Vault Permissions',
      'A.5.17 MFA Coverage',
      'A.5.18 Member Cleanup',
      'A.5.33 Secret Rotation',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="14"
          width="16"
          height="10"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 14v-3a5 5 0 0110 0v3"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: dashlaneService as any,
  },
  {
    key: 'box',
    name: 'Box',
    subtitle:
      'Document Management · Sharing controls and sensitive file governance',
    category: 'Document Management',
    description:
      'Verify folder sharing permissions are reviewed, external collaborator restrictions are enforced, sensitive file access monitoring is validated, and admin privilege governance is audited.',
    brandColor: '#0061D5',
    iconBg: 'bg-[#0061D5]',
    isoTags: [
      'A.5.15 Sharing Permissions',
      'A.5.14 External Collaborators',
      'A.5.34 Sensitive File Access',
      'A.5.18 Admin Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="9"
          width="18"
          height="14"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 9l2-3h6l2 3"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: boxService as any,
  },
  {
    key: 'google-drive',
    name: 'Google Drive',
    subtitle:
      'Document Management · External sharing and document access policy',
    category: 'Document Management',
    description:
      'Verify external sharing policy compliance is reviewed, sensitive document access restrictions are validated, stale file permission cleanup is audited, and admin plus API governance is verified.',
    brandColor: '#0F9D58',
    iconBg: 'bg-[#0F9D58]',
    isoTags: [
      'A.5.14 External Sharing Policy',
      'A.5.34 Sensitive Document Access',
      'A.5.18 Permission Cleanup',
      'A.5.15 Admin and API Governance',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6l8 14H8l8-14z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 20h8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: googleDriveService as any,
  },
  {
    key: 'docusign',
    name: 'DocuSign',
    subtitle: 'Document Management · Envelope security and audit retention',
    category: 'Document Management',
    description:
      'Verify envelope access control policy is reviewed, signer authentication baseline is enforced, admin role assignment governance is audited, and audit trail retention compliance is validated.',
    brandColor: '#FFCC00',
    iconBg: 'bg-[#FFCC00]',
    isoTags: [
      'A.5.15 Envelope Access Controls',
      'A.5.17 Signer Authentication',
      'A.5.18 Role Governance',
      'A.8.15 Audit Trail Retention',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="8"
          width="16"
          height="16"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M10 12l6 5 6-5"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: docusignService as any,
  },
  {
    key: 'mongodb-atlas',
    name: 'MongoDB Atlas',
    subtitle: 'Datastore · Network controls and database access governance',
    category: 'Datastore',
    description:
      'Verify network access list restrictions are reviewed, database user privilege model is validated, backup and encryption posture is audited, and admin API key lifecycle controls are verified.',
    brandColor: '#00ED64',
    iconBg: 'bg-[#00ED64]',
    isoTags: [
      'A.8.20 Network Access Lists',
      'A.5.15 DB User Privileges',
      'A.8.24 Backup and Encryption',
      'A.5.17 API Key Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="16"
          cy="10"
          rx="7"
          ry="3"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M9 10v8c0 1.7 3.1 3 7 3s7-1.3 7-3v-8"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    ),
    service: mongodbAtlasService as any,
  },
  {
    key: 'supabase',
    name: 'Supabase',
    subtitle: 'Datastore · RLS policy and project membership governance',
    category: 'Datastore',
    description:
      'Verify row-level security policy coverage is reviewed, service role key governance is validated, database and storage access restrictions are audited, and admin project membership controls are verified.',
    brandColor: '#3ECF8E',
    iconBg: 'bg-[#3ECF8E]',
    isoTags: [
      'A.5.15 RLS Coverage',
      'A.5.17 Service Role Keys',
      'A.8.20 Access Restrictions',
      'A.5.18 Project Membership',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 8h10a4 4 0 014 4v12H14a4 4 0 01-4-4V8z"
          fill="white"
          opacity="0.9"
        />
        <path d="M10 8l10 16" stroke="#3ECF8E" strokeWidth="2" />
      </svg>
    ),
    service: supabaseService as any,
  },
  {
    key: 'rockset',
    name: 'Rockset',
    subtitle: 'Datastore · Workspace access and query governance',
    category: 'Datastore',
    description:
      'Verify workspace access permissions are reviewed, collection and query restrictions are enforced, API key lifecycle governance is validated, and data source integration controls are audited.',
    brandColor: '#7C3AED',
    iconBg: 'bg-[#7C3AED]',
    isoTags: [
      'A.5.15 Workspace Access',
      'A.8.20 Query Restrictions',
      'A.5.17 API Key Lifecycle',
      'A.5.18 Integration Controls',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 16h10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: rocksetService as any,
  },
  {
    key: 'envoy',
    name: 'Envoy',
    subtitle: 'Other · Visitor access and credential lifecycle governance',
    category: 'Other',
    description:
      'Verify visitor access policy compliance is reviewed, badge lifecycle controls are validated, admin role governance is audited, and access event retention is verified.',
    brandColor: '#2563EB',
    iconBg: 'bg-[#2563EB]',
    isoTags: [
      'A.7.2 Visitor Access Policy',
      'A.5.18 Badge Lifecycle',
      'A.5.15 Admin Roles',
      'A.8.15 Event Retention',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="9"
          y="6"
          width="14"
          height="20"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 12h8M12 16h8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: envoyService as any,
  },
  {
    key: 'launchdarkly',
    name: 'LaunchDarkly',
    subtitle: 'DevOps · Feature flag change and token governance',
    category: 'DevOps',
    description:
      'Verify environment access permissions are reviewed, production flag change approvals are enforced, service token lifecycle governance is audited, and audit log retention is verified.',
    brandColor: '#6366F1',
    iconBg: 'bg-[#6366F1]',
    isoTags: [
      'A.5.15 Environment Access',
      'A.8.32 Change Approvals',
      'A.5.17 Service Tokens',
      'A.8.15 Audit Logs',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6l8 5v10l-8 5-8-5V11l8-5z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="2" fill="white" />
      </svg>
    ),
    service: launchdarklyService as any,
  },
  {
    key: 'buildkite',
    name: 'Buildkite',
    subtitle: 'CI/CD · Pipeline permissions and deployment gate controls',
    category: 'CI/CD',
    description:
      'Verify pipeline permissions are reviewed, deployment approval gates are validated, agent token and secret controls are audited, and build log retention integrity is verified.',
    brandColor: '#14B8A6',
    iconBg: 'bg-[#14B8A6]',
    isoTags: [
      'A.5.15 Pipeline Permissions',
      'A.8.32 Deployment Gates',
      'A.5.17 Agent Tokens',
      'A.8.15 Build Log Integrity',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9 10h14v4H9zM9 18h9v4H9z" fill="white" />
      </svg>
    ),
    service: buildkiteService as any,
  },
  {
    key: 'circleci',
    name: 'CircleCI',
    subtitle: 'CI/CD · Workflow approvals and secret governance',
    category: 'CI/CD',
    description:
      'Verify project roles are reviewed, workflow approval and deployment controls are validated, context secret governance is audited, and job log auditability is verified.',
    brandColor: '#161616',
    iconBg: 'bg-[#161616]',
    isoTags: [
      'A.5.15 Project Roles',
      'A.8.32 Workflow Approvals',
      'A.5.17 Context Secrets',
      'A.8.15 Job Log Auditability',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="3" fill="white" />
      </svg>
    ),
    service: circleciService as any,
  },
  {
    key: 'jenkins',
    name: 'Jenkins',
    subtitle: 'CI/CD · Job permissions, approvals, and secret controls',
    category: 'CI/CD',
    description:
      'Verify job and folder permissions are reviewed, production approval gates are validated, credential store controls are audited, and build log retention is verified.',
    brandColor: '#D24939',
    iconBg: 'bg-[#D24939]',
    isoTags: [
      'A.5.15 Job Permissions',
      'A.8.32 Approval Gates',
      'A.5.17 Credential Store',
      'A.8.15 Build Logs',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 20l8-8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: jenkinsService as any,
  },
  {
    key: 'harness',
    name: 'Harness',
    subtitle: 'CI/CD · Pipeline roles, deployment freezes, and secrets',
    category: 'CI/CD',
    description:
      'Verify project and pipeline role assignments are reviewed, deployment freeze controls are validated, secret manager governance is audited, and execution audit trails are verified.',
    brandColor: '#7C3AED',
    iconBg: 'bg-[#7C3AED]',
    isoTags: [
      'A.5.15 Pipeline Roles',
      'A.8.32 Deployment Freeze',
      'A.5.17 Secret Manager',
      'A.8.15 Audit Trails',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 10h16v4H8zM8 18h10v4H8z" fill="white" />
      </svg>
    ),
    service: harnessService as any,
  },
  {
    key: 'github-actions',
    name: 'GitHub Actions',
    subtitle: 'CI/CD · Workflow permissions and environment protection',
    category: 'CI/CD',
    description:
      'Verify workflow permission model is reviewed, environment protections are validated, secret and token governance is audited, and run log provenance is verified.',
    brandColor: '#24292E',
    iconBg: 'bg-[#24292E]',
    isoTags: [
      'A.5.15 Workflow Permissions',
      'A.8.32 Environment Protection',
      'A.5.17 Secrets and Tokens',
      'A.8.15 Run Logs',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6l8 5v10l-8 5-8-5V11l8-5z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M16 12v8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: githubActionsService as any,
  },
  {
    key: 'manageengine',
    name: 'ManageEngine',
    subtitle: 'IT Management · Admin roles and policy compliance controls',
    category: 'IT Management',
    description:
      'Verify administrative role permissions are reviewed, endpoint policy compliance is validated, integration credential lifecycle governance is audited, and event log retention is verified.',
    brandColor: '#EF4444',
    iconBg: 'bg-[#EF4444]',
    isoTags: [
      'A.5.15 Admin Roles',
      'A.8.9 Policy Compliance',
      'A.5.17 Credential Lifecycle',
      'A.8.15 Event Logs',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 12h10M11 16h10M11 20h6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: manageengineService as any,
  },
  {
    key: 'teamwork',
    name: 'Teamwork',
    subtitle: 'Project Management · Member roles and sharing governance',
    category: 'Project Management',
    description:
      'Verify project access and member roles are reviewed, external collaborator restrictions are validated, task and document sharing controls are audited, and admin API credentials are governed.',
    brandColor: '#2563EB',
    iconBg: 'bg-[#2563EB]',
    isoTags: [
      'A.5.15 Member Roles',
      'A.5.14 Collaborator Restrictions',
      'A.5.15 Sharing Controls',
      'A.5.17 API Credentials',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="12" r="3" fill="white" />
        <circle cx="21" cy="12" r="3" fill="white" opacity="0.7" />
        <path
          d="M8 23c0-3 2-5 5-5s5 2 5 5"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: teamworkService as any,
  },
  {
    key: 'comeet',
    name: 'Comeet',
    subtitle: 'HR Recruiting · Candidate access and hiring workflow controls',
    category: 'HR Recruiting',
    description:
      'Verify recruiter and hiring manager access permissions are reviewed, candidate profile data restrictions are validated, hiring workflow approvals are audited, and integration credentials are governed.',
    brandColor: '#2563EB',
    iconBg: 'bg-[#2563EB]',
    isoTags: [
      'A.5.15 Access Permissions',
      'A.5.34 Candidate Data Restrictions',
      'A.8.32 Hiring Approvals',
      'A.5.17 Integration Credentials',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="3" fill="white" />
        <circle cx="20" cy="12" r="3" fill="white" opacity="0.7" />
        <path
          d="M8 23c0-3 2-5 4-5s4 2 4 5M16 23c0-3 2-5 4-5s4 2 4 5"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: comeetService as any,
  },
  {
    key: 'lever',
    name: 'Lever',
    subtitle:
      'HR Recruiting · Role assignments and candidate visibility controls',
    category: 'HR Recruiting',
    description:
      'Verify recruiter role assignments are reviewed, candidate data visibility restrictions are validated, hiring stage approval controls are audited, and API token governance is verified.',
    brandColor: '#10B981',
    iconBg: 'bg-[#10B981]',
    isoTags: [
      'A.5.15 Role Assignments',
      'A.5.34 Candidate Visibility',
      'A.8.32 Stage Approvals',
      'A.5.17 API Tokens',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="8"
          width="16"
          height="16"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 16h8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: leverService as any,
  },
  {
    key: 'fieldguide',
    name: 'Fieldguide',
    subtitle:
      'Audit Management · Engagement access and evidence sharing controls',
    category: 'Audit Management',
    description:
      'Verify engagement workspace access permissions are reviewed, evidence sharing controls are validated, reviewer approval workflows are audited, and admin API credentials are governed.',
    brandColor: '#8B5CF6',
    iconBg: 'bg-[#8B5CF6]',
    isoTags: [
      'A.5.15 Workspace Access',
      'A.5.14 Evidence Sharing',
      'A.8.32 Reviewer Approvals',
      'A.5.17 API Credentials',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 12h10M11 16h10M11 20h6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: fieldguideService as any,
  },
  {
    key: 'ramp',
    name: 'Ramp',
    subtitle: 'Finance · Spend policies and approval hierarchy controls',
    category: 'Finance',
    description:
      'Verify spend policy and card access controls are reviewed, finance approval hierarchy is validated, payout workflow controls are audited, and integration token governance is verified.',
    brandColor: '#111827',
    iconBg: 'bg-[#111827]',
    isoTags: [
      'A.5.15 Spend Controls',
      'A.8.32 Approval Hierarchy',
      'A.8.16 Workflow Controls',
      'A.5.17 Integration Tokens',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="10"
          width="18"
          height="12"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 16h6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: rampService as any,
  },
  {
    key: 'brex',
    name: 'Brex',
    subtitle: 'Finance · Cardholder access and spend exception governance',
    category: 'Finance',
    description:
      'Verify cardholder and admin access permissions are reviewed, transaction approval controls are validated, spend exception governance is audited, and API credential lifecycle controls are verified.',
    brandColor: '#EF4444',
    iconBg: 'bg-[#EF4444]',
    isoTags: [
      'A.5.15 Access Permissions',
      'A.8.32 Approval Controls',
      'A.8.16 Exception Governance',
      'A.5.17 API Credential Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 16h8M16 12v8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: brexService as any,
  },
  {
    key: 'netsuite',
    name: 'NetSuite',
    subtitle: 'Finance · Role permissions and financial approval controls',
    category: 'Finance',
    description:
      'Verify finance role permissions are reviewed, approval workflow controls are validated, financial data export restrictions are audited, and integration token lifecycle governance is verified.',
    brandColor: '#0EA5E9',
    iconBg: 'bg-[#0EA5E9]',
    isoTags: [
      'A.5.15 Role Permissions',
      'A.8.32 Approval Workflows',
      'A.5.34 Data Export Restrictions',
      'A.5.17 Token Lifecycle',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="7"
          y="8"
          width="18"
          height="16"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 13h10M11 17h8M11 21h5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: netsuiteService as any,
  },
  {
    key: 'xero',
    name: 'Xero',
    subtitle: 'Finance · Advisor access and payment approval governance',
    category: 'Finance',
    description:
      'Verify advisor role permissions are reviewed, payment and reconciliation approvals are validated, financial report export restrictions are audited, and connected app token governance is verified.',
    brandColor: '#13B5EA',
    iconBg: 'bg-[#13B5EA]',
    isoTags: [
      'A.5.15 Advisor Permissions',
      'A.8.32 Payment Approvals',
      'A.5.34 Report Export Restrictions',
      'A.5.17 App Tokens',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 12l8 8M20 12l-8 8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    service: xeroService as any,
  },
  {
    key: 'sentinelone',
    name: 'SentinelOne',
    subtitle: 'Endpoint Security · AI-powered EDR & XDR',
    category: 'Endpoint Security',
    description:
      'Verify EDR agent coverage across all endpoints, critical threat detections are reviewed, tamper protection is enabled, and threat response SLAs are being met.',
    brandColor: '#6300B3',
    iconBg: 'bg-[#6300B3]',
    isoTags: [
      'A.8.7 Agent Coverage',
      'A.8.16 Threat Detection',
      'A.8.9 Tamper Protection',
      'A.5.24 Response SLA',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 4L5 9v8c0 6.1 4.7 11.8 11 13.3C22.3 28.8 27 23.1 27 17V9L16 4z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 16l4 4 6-7"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: sentineloneService as any,
  },
  {
    key: 'grafana',
    name: 'Grafana',
    subtitle: 'Observability · Metrics, logs & alerting',
    category: 'Observability',
    description:
      'Verify alerting rule coverage for security events, data source access controls are reviewed, dashboard permissions are scoped correctly, and log retention meets policy.',
    brandColor: '#F46800',
    iconBg: 'bg-[#F46800]',
    isoTags: [
      'A.8.16 Alerting Coverage',
      'A.5.15 Data Source Access',
      'A.5.15 Dashboard Permissions',
      'A.8.15 Log Retention',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M16 10v6l4 2"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    service: grafanaService as any,
  },
  {
    key: 'sentry',
    name: 'Sentry',
    subtitle: 'Observability · Error tracking & performance',
    category: 'Observability',
    description:
      'Verify project member access is reviewed, DSN keys are rotated on schedule, sensitive data scrubbing rules are active, and security issue alerts are routed correctly.',
    brandColor: '#362D59',
    iconBg: 'bg-[#362D59]',
    isoTags: [
      'A.5.15 Member Access Review',
      'A.5.17 DSN Key Rotation',
      'A.5.34 Data Scrubbing',
      'A.8.16 Alert Routing',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 5a11 11 0 1 0 0 22A11 11 0 0 0 16 5z"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M16 10v7"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="21" r="1.5" fill="white" />
      </svg>
    ),
    service: sentryService as any,
  },
  {
    key: 'onepassword',
    name: '1Password',
    subtitle: 'Password Manager · Team credential security',
    category: 'Password Manager',
    description:
      'Verify MFA enforcement for all team members, shared vault access is reviewed, stale guest accounts are cleaned up, and secret rotation policies are being followed.',
    brandColor: '#1A8CFF',
    iconBg: 'bg-[#1A8CFF]',
    isoTags: [
      'A.5.17 MFA Enforcement',
      'A.5.15 Vault Access Review',
      'A.5.18 Guest Account Cleanup',
      'A.5.33 Secret Rotation',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="14"
          width="16"
          height="12"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M11 14v-4a5 5 0 0 1 10 0v4"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="20" r="2" fill="white" />
      </svg>
    ),
    service: onepasswordService as any,
  },
  {
    key: 'snowflake',
    name: 'Snowflake',
    subtitle: 'Data Warehouse · Cloud data platform',
    category: 'Data Warehouse',
    description:
      'Verify MFA is enforced for all Snowflake users, data sharing access is reviewed, network policies restrict ingress, and query audit logging is enabled.',
    brandColor: '#29B5E8',
    iconBg: 'bg-[#29B5E8]',
    isoTags: [
      'A.5.17 MFA Enforcement',
      'A.5.15 Data Sharing Access',
      'A.8.20 Network Policy',
      'A.8.15 Audit Logging',
    ],
    iconSvg: (
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 4v24M4 16h24M7.5 7.5l17 17M24.5 7.5l-17 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="3" fill="white" />
      </svg>
    ),
    service: snowflakeService as any,
  },
];
