/**
 * Tier 1 static remediation playbook types.
 *
 * The frontend registry holds the full UI copy. The backend
 * `remediation-playbook-bases.ts` holds the compact AI-grounding base
 * keyed by the same `playbookId` + `playbookVersion`. Both sides validate
 * against the same committed `playbook-ids.generated.json` fixture so
 * drift fails CI on both repos.
 */

export type PlaybookCodeBlock = {
  /** Language hint for the renderer; used for syntax highlighting + copy icon. */
  language: 'bash' | 'sql' | 'hcl' | 'json' | 'yaml' | 'text';
  /** Optional title rendered above the snippet (e.g. "AWS CLI"). */
  title?: string;
  /** Raw snippet text. */
  code: string;
};

export type PlaybookStep = {
  /** Short imperative title shown as the step heading. */
  title: string;
  /** Markdown-rendered body. Kept short — multi-paragraph prose belongs in `details`. */
  body: string;
  /** Optional commands/templates the user can copy. Renderer adds copy buttons. */
  code?: PlaybookCodeBlock[];
};

export type PlaybookSection = {
  /** Sub-heading rendered as ## inside the section, e.g. "AWS Console". */
  heading?: string;
  /** Steps shown as an ordered list. */
  steps: PlaybookStep[];
};

export type Playbook = {
  playbookId: string;
  playbookVersion: number;
  /** Title rendered as the panel heading. */
  title: string;
  /** One-sentence problem statement. */
  whatFailed: string;
  /** Compliance / business impact. */
  whyItMatters: string;
  /** High-level recommended remediation arc. */
  fixPath: string;
  /** Tool-specific step groups (Console, CLI, Terraform, MDM, etc.). */
  toolSpecificSteps: PlaybookSection[];
  /** Evidence the auditor expects after remediation. */
  evidence: string[];
  /** How the user verifies the fix held. */
  verify: string[];
  /** Common mistakes / footguns. */
  pitfalls: string[];

  /** Lookup attributes — at least one must be present. */
  templateId?: string;
  catalogKey?: string;
  /** Used to resolve seeded templates that have not been backfilled. */
  templateName?: string;
};
