/**
 * Export public-display course content for the cloudanzen.com Academy.
 *
 * Sibling to `export-course-pack-manifest.ts`. That script emits the
 * structural skeleton used by the BE answer-key parity gate; this one
 * emits the full content a public learner needs to take the course —
 * module bodies, bullets, question prompts, choice labels, scenario text —
 * but strips every answer-key signal:
 *   - `CourseChoice.isCorrect`
 *   - `CourseChoice.rankOrder`
 *   - `CourseChoice.feedback`
 *   - `CourseQuestion.rationale`
 *
 * The BE repo vendors a copy of the emitted JSON at
 * `src/modules/public-academy/__fixtures__/course-pack-public-content.json`.
 * The BE `/api/public/academy/*` endpoints read from it. Re-running this
 * script and committing the JSON in both repos is how new content ships.
 *
 * Regenerate with `npm run export:public-academy-content`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COURSE_PACKS } from '../src/app/pages/onboarding/coursePacks';
import { wrapLegacyModule } from '../src/app/pages/onboarding/coursePacks/types';
import type {
  CoursePack,
  QuestionKind,
} from '../src/app/pages/onboarding/coursePacks/types';

export interface PublicChoice {
  id: string;
  label: string;
}

export interface PublicQuestion {
  id: string;
  kind: QuestionKind;
  selectionMode?: 'single' | 'multi';
  scenario?: string;
  prompt: string;
  choices: PublicChoice[];
  weight?: number;
}

export interface PublicModule {
  id: string;
  title: string;
  summary: string;
  body: string;
  bullets: string[];
  questions: PublicQuestion[];
}

export interface PublicCourseEntry {
  slug: string;
  version: number;
  passThresholdPct: number;
  estimatedMinutes: number;
  modules: PublicModule[];
}

export type PublicCourseContent = Record<string, PublicCourseEntry>;

export function buildPublicContent(
  packs: Record<string, CoursePack> = COURSE_PACKS,
): PublicCourseContent {
  const out: PublicCourseContent = {};
  for (const pack of Object.values(packs)) {
    const modules: PublicModule[] = pack.modules.map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      body: m.body,
      bullets: m.bullets,
      questions: wrapLegacyModule(m).map((q) => {
        const pub: PublicQuestion = {
          id: q.id,
          kind: q.kind,
          prompt: q.prompt,
          choices: q.choices.map((c) => ({ id: c.id, label: c.label })),
        };
        if (q.selectionMode) pub.selectionMode = q.selectionMode;
        if (q.scenario) pub.scenario = q.scenario;
        if (q.weight !== undefined) pub.weight = q.weight;
        return pub;
      }),
    }));
    const key = `${pack.slug}@v${pack.version}`;
    out[key] = {
      slug: pack.slug,
      version: pack.version,
      passThresholdPct: pack.passThresholdPct,
      estimatedMinutes: pack.estimatedMinutes,
      modules,
    };
  }
  return out;
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(
    here,
    '..',
    'public',
    'course-packs',
    'course-pack-public-content.json',
  );
  mkdirSync(dirname(outPath), { recursive: true });
  const content = buildPublicContent();
  writeFileSync(outPath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  const count = Object.keys(content).length;
  console.log(`wrote ${count} pack(s) to ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
