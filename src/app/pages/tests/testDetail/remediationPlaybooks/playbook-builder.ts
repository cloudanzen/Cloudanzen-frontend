/**
 * playbook-builder.ts (frontend)
 *
 * Converts a backend-emitted `PlaybookBase` (from the committed
 * `playbook-content.generated.json` fixture) into a full UI `Playbook`.
 *
 * The backend already pre-mixed catalog `guidance` / `description` into
 * `allowedFixPaths`, so the FE just has to lay it out for the panel.
 * Hand-authored FE playbooks (the original 4 in `playbooks/*`) take
 * precedence — the generator skips any playbookId already present so
 * authored prose wins.
 */

import type { Playbook } from './types';
import fixture from './playbook-content.generated.json';

/** Shape of one entry in playbook-content.generated.json. Mirrors the backend's PlaybookBase. */
type PlaybookBaseFixture = {
  playbookId: string;
  playbookVersion: number;
  validationName: string;
  summary: string;
  allowedFixPaths: string[];
  disallowedFixPaths: string[];
  evidenceExpectations: string[];
  verificationExpectations: string[];
  safeCommandTemplates: string[];
  templateId?: string;
  catalogKey?: string;
  templateName?: string;
};

type ContentFixture = {
  count: number;
  playbooks: PlaybookBaseFixture[];
};

const fixtureTyped = fixture as ContentFixture;

function whatFailedFrom(base: PlaybookBaseFixture): string {
  // Backend summary often appends "Linked ISO 27001 controls: …"; split that
  // off so the failure description is clean and the ISO list goes into
  // whyItMatters.
  const isoSplit = base.summary.split(/Linked ISO 27001 controls:/i);
  return isoSplit[0]!.trim();
}

function whyItMattersFrom(base: PlaybookBaseFixture): string {
  const isoSplit = base.summary.split(/Linked ISO 27001 controls:/i);
  if (isoSplit.length === 2 && isoSplit[1]) {
    return `Linked ISO 27001 controls: ${isoSplit[1].trim()}`;
  }
  return "Required by the org's linked compliance frameworks. Track to closure to keep this validation passing.";
}

export function buildPlaybookFromBase(base: PlaybookBaseFixture): Playbook {
  // The catalog-guidance line is the test-specific lead remediation
  // (positioned first by the BE generator). Use it as fixPath; render
  // the remaining allowed paths as the tool-specific steps.
  const [leadFixPath, ...generalSteps] = base.allowedFixPaths;

  return {
    playbookId: base.playbookId,
    playbookVersion: base.playbookVersion,
    templateId: base.templateId,
    catalogKey: base.catalogKey,
    templateName: base.templateName,
    title: base.validationName,
    whatFailed: whatFailedFrom(base),
    whyItMatters: whyItMattersFrom(base),
    fixPath:
      leadFixPath ??
      'Follow the linked guidance for this validation and capture the remediation as evidence.',
    toolSpecificSteps: [
      {
        steps:
          generalSteps.length > 0
            ? generalSteps.map((step) => ({
                title: step,
                body: 'Apply this step against the affected resource. Confirm the change took effect before moving on.',
              }))
            : [
                {
                  title: leadFixPath ?? 'Apply the recommended fix',
                  body: 'Apply the lead remediation against the affected resource and confirm the change took effect.',
                },
              ],
      },
    ],
    evidence: base.evidenceExpectations,
    verify: base.verificationExpectations,
    pitfalls: base.disallowedFixPaths,
  };
}

export function generatePlaybooks(options: {
  /** Playbook IDs already covered by hand-authored entries; skip these. */
  skip: ReadonlySet<string>;
}): Playbook[] {
  return fixtureTyped.playbooks
    .filter((base) => !options.skip.has(base.playbookId))
    .map(buildPlaybookFromBase);
}
