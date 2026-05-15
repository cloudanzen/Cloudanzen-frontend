import type { Playbook } from '../types';

export const CLOUDANZEN_PLAYBOOKS: Playbook[] = [
  {
    playbookId: 'cloudanzen.policy-acceptance-complete',
    playbookVersion: 1,
    templateId: 'c0000000-0000-0000-0000-000000000001',
    catalogKey: 'cloudanzen.policy-acceptance-complete',
    title: 'Close the policy-acceptance gap',
    whatFailed:
      'One or more non-exempt users have not accepted the current published policy version. Outstanding users are listed in `lastResultDetails.usersWithoutAcceptance`.',
    whyItMatters:
      'Policy attestations are the single piece of evidence almost every auditor checks: A.5.1, A.6.3, and A.7.2 of ISO 27001 all expect documented acknowledgement. A stale roster turns into a finding the moment an external auditor scopes that control.',
    fixPath:
      'Send a direct reminder to every user in `lastResultDetails.usersWithoutAcceptance`. If a user is on leave or otherwise blocked, reassign the acceptance task to their manager. Only exempt users with documented owner approval.',
    toolSpecificSteps: [
      {
        heading: 'Inside CloudAnzen',
        steps: [
          {
            title: 'Open the policy detail page',
            body: 'Policies → select the policy whose acceptance test failed. The **Acceptance** tab lists the same users as `lastResultDetails.usersWithoutAcceptance`.',
          },
          {
            title: 'Send the reminder batch',
            body: 'Use the **Remind outstanding users** action. The notification links the user directly into the acceptance flow.',
          },
          {
            title: 'Handle exempt cases',
            body: 'For users on leave, contractors who never had the obligation, or roles outside scope: mark them exempt via **Manage exemptions**. CloudAnzen records the actor, timestamp, and reason — that record is the audit trail.',
          },
        ],
      },
    ],
    evidence: [
      'Acceptance roster export from the policy detail page (CSV or PDF) after every user has accepted or been formally exempted.',
      'Email or Slack thread showing reminders were sent. Most auditors are satisfied with two dated reminders before exemption.',
      'For exemptions: the saved exemption record (actor + reason) from CloudAnzen.',
    ],
    verify: [
      'Re-run the policy-acceptance evaluator.',
      'Confirm `acceptedUserCount === requiredUserCount` in `lastResultDetails`.',
    ],
    pitfalls: [
      'Do not click "accept" on behalf of users — the acceptance record must match the user it claims.',
      'Do not bypass acceptance by editing `Test.completedAt` directly. The evaluator will overwrite it on next run, and the audit-log entry will show the manual override.',
      'Marking everyone exempt erases the control. Exemptions need a documented business reason, not just a checkbox.',
    ],
  },
];
