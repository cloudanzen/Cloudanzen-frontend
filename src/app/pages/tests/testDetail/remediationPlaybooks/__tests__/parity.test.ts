import { describe, expect, it } from 'vitest';
import { PLAYBOOKS } from '../registry';
import fixture from '../playbook-ids.generated.json';

type FixtureRow = { playbookId: string; playbookVersion: number };

describe('playbook-ids.generated.json parity (frontend ↔ committed fixture)', () => {
  it('count field matches the fixture entries', () => {
    expect(fixture.count).toBe(fixture.playbooks.length);
  });

  it('fixture is sorted by playbookId', () => {
    const sorted = [...(fixture.playbooks as FixtureRow[])].sort((a, b) =>
      a.playbookId.localeCompare(b.playbookId),
    );
    expect(fixture.playbooks).toEqual(sorted);
  });

  it('every frontend registry entry exists in the fixture with the same version', () => {
    const fixtureMap = new Map(
      (fixture.playbooks as FixtureRow[]).map((row) => [
        row.playbookId,
        row.playbookVersion,
      ]),
    );
    for (const p of PLAYBOOKS) {
      expect(fixtureMap.get(p.playbookId)).toBe(p.playbookVersion);
    }
  });

  it('every fixture entry is present in the frontend registry (no orphans)', () => {
    const registryMap = new Map(
      PLAYBOOKS.map((p) => [p.playbookId, p.playbookVersion]),
    );
    for (const row of fixture.playbooks as FixtureRow[]) {
      expect(registryMap.get(row.playbookId)).toBe(row.playbookVersion);
    }
  });

  it('counts agree between fixture and frontend registry', () => {
    expect(fixture.count).toBe(PLAYBOOKS.length);
  });
});

describe('frontend playbook content invariants', () => {
  it('every playbook has at least one lookup attribute', () => {
    for (const p of PLAYBOOKS) {
      expect(p.templateId || p.catalogKey || p.templateName).toBeTruthy();
    }
  });

  it('Fleet playbook never mentions AWS CLI or Terraform in code blocks', () => {
    const fleet = PLAYBOOKS.find(
      (p) => p.playbookId === 'fleet.disk-encryption-enabled',
    );
    expect(fleet).toBeDefined();
    const allCode = (fleet?.toolSpecificSteps ?? [])
      .flatMap((s) => s.steps)
      .flatMap((step) => step.code ?? [])
      .map((b) => b.code)
      .join('\n');
    expect(allCode).not.toMatch(/aws\s+iam/i);
    expect(allCode).not.toMatch(/aws_iam_/i);
    expect(allCode).not.toMatch(/terraform/i);
  });
});
