import type { Playbook } from '../types';

export const FLEET_PLAYBOOKS: Playbook[] = [
  {
    playbookId: 'fleet.disk-encryption-enabled',
    playbookVersion: 1,
    templateId: 'c5000000-0000-0000-0000-000000000004',
    catalogKey: 'fleet.disk-encryption-enabled',
    title: 'Enforce disk encryption on managed endpoints',
    whatFailed:
      'One or more Fleet-enrolled hosts do not report FileVault (macOS) or BitLocker (Windows) as enabled. Failing hosts are listed in `lastResultDetails.failingHosts`.',
    whyItMatters:
      'Unencrypted laptops are the most common path from a single physical theft to a reportable data breach. ISO 27001 A.7.6 / A.8.10 / SOC 2 CC6.7 all explicitly require disk encryption on devices that store regulated or sensitive data.',
    fixPath:
      'Push the encryption-enforcement policy from Fleet (or your MDM of record), wait for affected hosts to check in, and re-run the validation. Contact device owners directly if remote enforcement is blocked.',
    toolSpecificSteps: [
      {
        heading: 'Fleet policy',
        steps: [
          {
            title: 'Verify the policy is enabled',
            body: 'Policies → Disk encryption → confirm the policy is enabled for the team that owns the failing hosts. Hosts without the policy will not be evaluated.',
          },
          {
            title: 'Check host reports',
            body: 'Hosts → filter by `disk_encryption_enabled = 0`. This should match `lastResultDetails.failingHosts`. Investigate any hosts that show in one list but not the other.',
          },
          {
            title: 'Push the remediation script',
            body: 'If your Fleet tier supports scripts, queue the canonical FileVault or BitLocker enable script against the failing hosts. Otherwise hand-off to MDM (Jamf, Intune, Workspace ONE) for enforcement.',
          },
        ],
      },
      {
        heading: 'Owner outreach',
        steps: [
          {
            title: 'Contact users who block remote enforcement',
            body: 'macOS users may need to authorise FileVault on next login; BitLocker on personal devices needs the user to authorise the recovery key escrow. Send a Slack/email with the specific steps and a 48-hour SLA.',
          },
        ],
      },
    ],
    evidence: [
      'Fleet host report showing `disk_encryption_enabled = 1` for every host previously in `lastResultDetails.failingHosts`.',
      'MDM compliance export for the same hosts.',
      'For escalations: the dated Slack/email reminder sent to the user.',
    ],
    verify: [
      'Re-run the Fleet policy and confirm the failing-host count is zero.',
      'Open the validation detail page again; `lastResultDetails.failingHosts` should be `[]` on the new run.',
    ],
    pitfalls: [
      'Do not suggest AWS CLI or Terraform — Fleet manages endpoints, not AWS resources, and IaC has no role in MDM enforcement.',
      'BitLocker can show as enabled without a recovery key escrowed, which is still a finding under most frameworks. Confirm the recovery key is escrowed in your MDM before closing.',
      'A host that has been offline for >30 days will keep reporting stale results. Either bring it online for re-evaluation or decommission and remove it from inventory.',
    ],
  },
];
