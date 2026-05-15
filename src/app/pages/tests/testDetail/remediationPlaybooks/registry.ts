import { AWS_PLAYBOOKS } from './playbooks/aws';
import { CLOUDANZEN_PLAYBOOKS } from './playbooks/cloudanzen';
import { DOCUMENT_PLAYBOOKS } from './playbooks/document';
import { FLEET_PLAYBOOKS } from './playbooks/fleet';
import type { Playbook } from './types';

export const PLAYBOOKS: readonly Playbook[] = [
  ...AWS_PLAYBOOKS,
  ...CLOUDANZEN_PLAYBOOKS,
  ...DOCUMENT_PLAYBOOKS,
  ...FLEET_PLAYBOOKS,
];

const seen = new Set<string>();
for (const p of PLAYBOOKS) {
  if (seen.has(p.playbookId)) {
    throw new Error(
      `Duplicate playbookId in frontend registry: ${p.playbookId}`,
    );
  }
  seen.add(p.playbookId);
}
