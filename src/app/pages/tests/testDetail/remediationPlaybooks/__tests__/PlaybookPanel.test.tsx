import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaybookPanel } from '../PlaybookPanel';
import { AWS_PLAYBOOKS } from '../playbooks/aws';
import { FLEET_PLAYBOOKS } from '../playbooks/fleet';

// react-i18next reads {{var}} placeholders directly when no provider is wired;
// for these tests we just assert presence of human-readable content.

const awsPlaybook = AWS_PLAYBOOKS[0]!;
const fleetPlaybook = FLEET_PLAYBOOKS[0]!;

describe('PlaybookPanel — golden render (AWS access-key-age)', () => {
  it('renders the AWS playbook title, problem statement, and all sections', () => {
    render(<PlaybookPanel playbook={awsPlaybook} />);

    expect(screen.getByText(awsPlaybook.title)).toBeInTheDocument();
    expect(screen.getByText(awsPlaybook.whatFailed)).toBeInTheDocument();
    expect(screen.getByText(awsPlaybook.whyItMatters)).toBeInTheDocument();
    expect(screen.getByText(awsPlaybook.fixPath)).toBeInTheDocument();

    // Every tool-specific section heading is rendered. The heading may also
    // appear inside the code-block title for the same section (e.g. "AWS CLI"),
    // so we just assert presence at least once.
    for (const section of awsPlaybook.toolSpecificSteps) {
      if (section.heading) {
        expect(
          screen.getAllByText(section.heading).length,
        ).toBeGreaterThanOrEqual(1);
      }
    }

    // Every evidence and verify line shows up
    for (const item of awsPlaybook.evidence) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    for (const item of awsPlaybook.verify) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    for (const item of awsPlaybook.pitfalls) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it('renders an AWS CLI code snippet (commands present, copy button available)', () => {
    render(<PlaybookPanel playbook={awsPlaybook} />);

    // The CLI block should contain the canonical list-access-keys command.
    // It can appear in both the code snippet and the evidence section — both
    // are correct, so allow any number ≥ 1.
    expect(
      screen.getAllByText(/aws iam list-access-keys --user-name <user>/i)
        .length,
    ).toBeGreaterThanOrEqual(1);

    const copyButtons = screen.getAllByLabelText(
      'remediation.playbook.copyCode',
    );
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PlaybookPanel — Fleet content rules', () => {
  it('Fleet playbook renders without any AWS CLI or Terraform content in its code blocks', () => {
    render(<PlaybookPanel playbook={fleetPlaybook} />);

    // No code-snippet copy buttons should be rendered for Fleet — there are no
    // commands to copy (safeCommandTemplates is empty in the registry).
    const copyButtons = screen.queryAllByLabelText(
      'remediation.playbook.copyCode',
    );
    expect(copyButtons.length).toBe(0);

    // Pitfalls section still explicitly warns against AWS/Terraform.
    expect(screen.getAllByText(/aws/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/terraform/i).length).toBeGreaterThanOrEqual(1);
  });
});
