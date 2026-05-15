import { describe, expect, it } from 'vitest';
import { PLAYBOOKS } from '../registry';
import { resolvePlaybook } from '../resolver';
import contentFixture from '../playbook-content.generated.json';

type ContentEntry = {
  playbookId: string;
  playbookVersion: number;
  templateId?: string;
  catalogKey?: string;
  templateName?: string;
};

const entries = (contentFixture as { playbooks: ContentEntry[] }).playbooks;

describe('frontend playbook registry — full coverage from backend fixture', () => {
  it('count matches the backend-emitted entry count', () => {
    expect(PLAYBOOKS.length).toBe(entries.length);
  });

  it('every backend playbookId is represented in the FE registry with the same version', () => {
    const feMap = new Map(
      PLAYBOOKS.map((p) => [p.playbookId, p.playbookVersion]),
    );
    for (const entry of entries) {
      expect(feMap.get(entry.playbookId)).toBe(entry.playbookVersion);
    }
  });

  it('every templateId from the fixture resolves to a non-fallback playbook', () => {
    for (const entry of entries) {
      if (!entry.templateId) continue;
      const outcome = resolvePlaybook({ templateId: entry.templateId });
      expect(outcome.resolvedBy).toBe('templateId');
      expect(outcome.playbook?.playbookId).toBe(entry.playbookId);
    }
  });

  it('every catalogKey from the fixture resolves via canonical testKey', () => {
    for (const entry of entries) {
      if (!entry.catalogKey) continue;
      const outcome = resolvePlaybook({
        templateId: null,
        testKey: `integration:any-provider:int-x:${entry.catalogKey}`,
      });
      // Either templateId-match wins (if templateId also present) or
      // catalogKey-match resolves.
      expect(outcome.playbook).not.toBeNull();
      expect(outcome.playbook?.catalogKey).toBe(entry.catalogKey);
    }
  });

  it('every templateName from the fixture resolves by exact name', () => {
    for (const entry of entries) {
      if (!entry.templateName) continue;
      const outcome = resolvePlaybook({
        templateId: null,
        testKey: null,
        name: entry.templateName,
      });
      expect(outcome.playbook).not.toBeNull();
      expect(outcome.playbook?.templateName).toBe(entry.templateName);
    }
  });

  it('every playbook carries a non-empty fixPath and at least one tool-specific step', () => {
    for (const p of PLAYBOOKS) {
      expect(p.fixPath.length).toBeGreaterThan(8);
      expect(p.toolSpecificSteps.length).toBeGreaterThan(0);
      const stepCount = p.toolSpecificSteps.reduce(
        (sum, section) => sum + section.steps.length,
        0,
      );
      expect(stepCount).toBeGreaterThan(0);
    }
  });

  it('Fleet-family playbooks never reference AWS CLI or Terraform in their step content', () => {
    const fleet = PLAYBOOKS.filter((p) => p.catalogKey?.startsWith('fleet.'));
    expect(fleet.length).toBeGreaterThan(0);
    for (const p of fleet) {
      const corpus = [
        p.fixPath,
        ...p.toolSpecificSteps.flatMap((s) =>
          s.steps.flatMap((step) => [
            step.title,
            step.body,
            ...(step.code?.map((c) => c.code) ?? []),
          ]),
        ),
      ]
        .join(' ')
        .toLowerCase();
      expect(corpus).not.toMatch(/aws\s+iam|aws\s+cli|aws_iam_/);
      expect(corpus).not.toMatch(/terraform/);
    }
  });
});
