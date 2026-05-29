/**
 * Export course-pack manifest for cross-repo parity check.
 *
 * Emits `public/course-packs/course-pack-manifest.json` with the structural
 * skeleton of every course pack — IDs and shapes, no labels / rationales.
 * The BE repo vendors a copy of this file under
 * `src/modules/onboarding/__fixtures__/course-pack-manifest.json` and runs
 * `scripts/check-course-answer-key-parity.ts` against it. CI in both repos
 * fails on drift.
 *
 * Regenerate with `npm run export:course-pack-manifest`. The vitest in
 * `tests/coursePackManifest.test.ts` asserts the committed manifest matches
 * what the current packs would emit, so a stale manifest fails CI.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COURSE_PACKS } from '../src/app/pages/onboarding/coursePacks';
import { wrapLegacyModule } from '../src/app/pages/onboarding/coursePacks/types';
import type { CoursePack, QuestionKind } from '../src/app/pages/onboarding/coursePacks/types';

export interface ManifestQuestion {
  id: string;
  kind: QuestionKind;
  choiceIds: string[];
}

export interface ManifestEntry {
  slug: string;
  version: number;
  moduleIds: string[];
  questions: ManifestQuestion[];
}

export type CoursePackManifest = Record<string, ManifestEntry>;

export function buildManifest(
  packs: Record<string, CoursePack> = COURSE_PACKS,
): CoursePackManifest {
  const manifest: CoursePackManifest = {};
  for (const pack of Object.values(packs)) {
    const moduleIds: string[] = [];
    const questions: ManifestQuestion[] = [];
    for (const module of pack.modules) {
      moduleIds.push(module.id);
      for (const q of wrapLegacyModule(module)) {
        questions.push({
          id: q.id,
          kind: q.kind,
          choiceIds: q.choices.map((c) => c.id),
        });
      }
    }
    const key = `${pack.slug}@v${pack.version}`;
    manifest[key] = {
      slug: pack.slug,
      version: pack.version,
      moduleIds,
      questions,
    };
  }
  return manifest;
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(here, '..', 'public', 'course-packs', 'course-pack-manifest.json');
  mkdirSync(dirname(outPath), { recursive: true });
  const manifest = buildManifest();
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  const count = Object.keys(manifest).length;
  console.log(`wrote ${count} pack(s) to ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
