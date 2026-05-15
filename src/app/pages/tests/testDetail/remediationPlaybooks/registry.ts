import { AWS_PLAYBOOKS } from './playbooks/aws';
import { CLOUDANZEN_PLAYBOOKS } from './playbooks/cloudanzen';
import { DOCUMENT_PLAYBOOKS } from './playbooks/document';
import { FLEET_PLAYBOOKS } from './playbooks/fleet';
import { generatePlaybooks } from './playbook-builder';
import type { Playbook } from './types';

const HAND_AUTHORED_PLAYBOOKS: Playbook[] = [
  ...AWS_PLAYBOOKS,
  ...CLOUDANZEN_PLAYBOOKS,
  ...DOCUMENT_PLAYBOOKS,
  ...FLEET_PLAYBOOKS,
];

const HAND_AUTHORED_PLAYBOOK_IDS = new Set(
  HAND_AUTHORED_PLAYBOOKS.map((p) => p.playbookId),
);

export const PLAYBOOKS: readonly Playbook[] = [
  ...HAND_AUTHORED_PLAYBOOKS,
  ...generatePlaybooks({ skip: HAND_AUTHORED_PLAYBOOK_IDS }),
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
