import type { Playbook } from '../types';

export const AWS_PLAYBOOKS: Playbook[] = [
  {
    playbookId: 'aws.no-stale-iam-access-keys',
    playbookVersion: 1,
    templateId: 'c2000000-0000-0000-0000-000000000003',
    catalogKey: 'aws.no-stale-iam-access-keys',
    title: 'Rotate stale IAM access keys',
    whatFailed:
      'One or more IAM users hold access keys older than your rotation threshold. The failing users are listed in `lastResultDetails.staleUsers`.',
    whyItMatters:
      'Long-lived keys massively widen the blast radius of any credential leak — vendors, ex-employees, and shared laptops all carry residual risk. Rotation caps that exposure window. ISO 27001 A.9.4 / SOC 2 CC6.1 expect explicit key lifecycle controls.',
    fixPath:
      'Create a fresh access key for the affected user, swap your tooling over to the new key, then deactivate (and later delete) the stale one. Codify the rotation cadence in Terraform only if the rotation should apply org-wide.',
    toolSpecificSteps: [
      {
        heading: 'AWS Console',
        steps: [
          {
            title: 'Open the IAM user',
            body: 'IAM → Users → select the user named in `lastResultDetails.staleUsers`. Open the **Security credentials** tab.',
          },
          {
            title: 'Create a new access key',
            body: 'Click **Create access key**, choose the matching use-case, save the Access key ID and Secret. Update any tooling (CI, local `~/.aws/credentials`, vault entries) to the new key.',
          },
          {
            title: 'Deactivate the stale key',
            body: 'Back on **Security credentials**, set the old key to **Inactive**. Wait one full business day. If nothing breaks, delete it.',
          },
        ],
      },
      {
        heading: 'AWS CLI',
        steps: [
          {
            title: 'List + rotate via CLI',
            body: 'Run these in order. Replace `<user>` and `<old-key-id>` with the values from `lastResultDetails`.',
            code: [
              {
                language: 'bash',
                title: 'AWS CLI',
                code:
                  'aws iam list-access-keys --user-name <user>\n' +
                  'aws iam create-access-key --user-name <user>\n' +
                  '# update tooling here, then deactivate the old key\n' +
                  'aws iam update-access-key --user-name <user> --access-key-id <old-key-id> --status Inactive',
              },
            ],
          },
        ],
      },
      {
        heading: 'Terraform (org-wide rotation)',
        steps: [
          {
            title: 'Pin rotation in IaC',
            body: 'If your IAM users are Terraform-managed, set an explicit rotation reminder via tagging. Avoid in-line `aws_iam_access_key` resources unless the new key is consumed by another managed resource (CI runner, etc.).',
            code: [
              {
                language: 'hcl',
                title: 'Terraform',
                code:
                  'resource "aws_iam_user" "ci_runner" {\n' +
                  '  name = "ci-runner"\n' +
                  '  tags = {\n' +
                  '    "access-key-rotation-due" = "2026-11-15"\n' +
                  '  }\n' +
                  '}',
              },
            ],
          },
        ],
      },
    ],
    evidence: [
      'Screenshot or CSV export of `aws iam list-access-keys --user-name <user>` after rotation, showing the new key is `Active` and the old one is `Inactive` (or gone).',
      'CloudTrail entry for `UpdateAccessKey` on the affected user.',
    ],
    verify: [
      'Re-run the validation — the rotated user should drop from `lastResultDetails.staleUsers`.',
      'Confirm `CreateDate` on the surviving key is inside the rotation window.',
    ],
    pitfalls: [
      'Do not delete the IAM user — only the stale key.',
      'Do not disable MFA on the user while rotating; the two are independent controls.',
      'Skipping the **Inactive** step and deleting the old key directly can break production tooling that has not been updated yet.',
    ],
  },
];
