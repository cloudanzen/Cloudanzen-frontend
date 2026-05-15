import type { Playbook } from '../types';

export const DOCUMENT_PLAYBOOKS: Playbook[] = [
  {
    playbookId: 'document.access-control-policy-review',
    playbookVersion: 1,
    templateName: 'Access Control Policy review',
    title: 'Complete the annual access control policy review',
    whatFailed:
      'The access control policy is overdue for its scheduled review, or the policy owner has not signed off on the latest version. The policy detail page shows the actual blocker.',
    whyItMatters:
      'ISO 27001 A.5.1 and A.5.36 both require an explicit, dated review cycle for every named policy. A missed cycle is the most common reason auditors raise a non-conformance on the policy framework.',
    fixPath:
      'The named owner reviews the policy end-to-end, records the review date, uploads the signed-off artifact, and schedules the next review on the renewal date.',
    toolSpecificSteps: [
      {
        heading: 'Inside CloudAnzen',
        steps: [
          {
            title: 'Open the policy',
            body: 'Policies → Access Control Policy. Confirm the published version reflects current practice — pay particular attention to role definitions, joiner/leaver flow, and privileged access.',
          },
          {
            title: 'Record the review',
            body: 'Use the **Mark reviewed** action. CloudAnzen records the reviewer, timestamp, and sets the next renewal date based on the configured recurrence.',
          },
          {
            title: 'Attach the signed-off evidence',
            body: 'Upload the signed PDF (or Notion/Google Doc PDF export) as evidence. The evidence count on the test should move to ≥ 1 on the next run.',
          },
        ],
      },
    ],
    evidence: [
      'Signed-off PDF or document showing the reviewer and date.',
      'Audit log entry for the review action.',
      'Snapshot of the renewal-date scheduler showing the next review on the calendar.',
    ],
    verify: [
      'Test status moves from `Needs_remediation` (or `Overdue`) to `OK`.',
      'Evidence count is at least 1 on the test detail page.',
      'Renewal date is at least one full review cycle in the future.',
    ],
    pitfalls: [
      'Marking the test passed without an uploaded evidence record will fail the next evaluator run.',
      'A review that did not actually inspect the document — just clicking "Mark reviewed" — is a control failure. Set a calendar block to actually read it.',
      'Owners on PTO should hand off to a delegate explicitly, not skip the cycle.',
    ],
  },
];
