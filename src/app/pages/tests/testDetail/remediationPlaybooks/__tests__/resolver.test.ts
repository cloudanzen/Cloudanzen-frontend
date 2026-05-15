import { describe, expect, it } from 'vitest';
import { resolvePlaybook } from '../resolver';

describe('resolvePlaybook', () => {
  it('resolves AWS access-key-age by templateId', () => {
    const outcome = resolvePlaybook({
      templateId: 'c2000000-0000-0000-0000-000000000003',
    });
    expect(outcome.resolvedBy).toBe('templateId');
    expect(outcome.playbook?.playbookId).toBe('aws.no-stale-iam-access-keys');
  });

  it('resolves AWS access-key-age by canonical testKey catalog segment', () => {
    const outcome = resolvePlaybook({
      testKey: 'integration:aws:int-1:aws.no-stale-iam-access-keys',
    });
    expect(outcome.resolvedBy).toBe('catalogKey');
    expect(outcome.playbook?.playbookId).toBe('aws.no-stale-iam-access-keys');
  });

  it('AWS playbook contains CLI and Terraform sections', () => {
    const outcome = resolvePlaybook({
      templateId: 'c2000000-0000-0000-0000-000000000003',
    });
    expect(outcome.playbook).not.toBeNull();
    const headings = outcome.playbook!.toolSpecificSteps.map((s) => s.heading);
    expect(headings).toEqual(
      expect.arrayContaining(['AWS CLI', 'Terraform (org-wide rotation)']),
    );
  });

  it('Fleet disk-encryption resolves by templateId and forbids AWS/Terraform content', () => {
    const outcome = resolvePlaybook({
      templateId: 'c5000000-0000-0000-0000-000000000001',
    });
    expect(outcome.resolvedBy).toBe('templateId');
    expect(outcome.playbook?.playbookId).toBe('fleet.disk-encryption-enabled');

    const everySnippet = (outcome.playbook?.toolSpecificSteps ?? [])
      .flatMap((s) => s.steps)
      .flatMap((step) => step.code ?? [])
      .map((b) => `${b.title ?? ''}\n${b.code}`)
      .join('\n');
    expect(everySnippet).not.toMatch(/aws\s+iam/i);
    expect(everySnippet).not.toMatch(/terraform/i);
    expect(everySnippet).not.toMatch(/aws_iam_/i);

    const pitfalls = outcome.playbook!.pitfalls.join(' ').toLowerCase();
    expect(pitfalls).toMatch(/aws/);
    expect(pitfalls).toMatch(/terraform/);
  });

  it('resolves the Document template by exact display name when templateId is missing', () => {
    const outcome = resolvePlaybook({
      templateId: null,
      testKey: null,
      name: 'Access Control Policy review',
    });
    expect(outcome.resolvedBy).toBe('name');
    expect(outcome.playbook?.playbookId).toBe(
      'document.access-control-policy-review',
    );
  });

  it('falls through to unresolved for unknown custom tests', () => {
    const outcome = resolvePlaybook({
      templateId: 'unknown-id',
      testKey: 'custom:user-defined',
      name: 'Some custom user test',
      provider: 'INTERNAL',
    });
    expect(outcome.resolvedBy).toBe('unresolved');
    expect(outcome.playbook).toBeNull();
  });

  it('templateId match wins over a competing testKey + name match', () => {
    const outcome = resolvePlaybook({
      templateId: 'c5000000-0000-0000-0000-000000000001',
      testKey: 'integration:aws:int-1:aws.no-stale-iam-access-keys',
      name: 'Access Control Policy review',
    });
    expect(outcome.resolvedBy).toBe('templateId');
    expect(outcome.playbook?.playbookId).toBe('fleet.disk-encryption-enabled');
  });

  it('does not resolve when testKey is non-canonical and name does not match', () => {
    const outcome = resolvePlaybook({
      testKey: 'aws:account-123:auto:something-else',
      name: 'Something else entirely',
    });
    expect(outcome.resolvedBy).toBe('unresolved');
  });
});
