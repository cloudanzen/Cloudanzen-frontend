/**
 * Course-pack manifest staleness gate.
 *
 * `scripts/export-course-pack-manifest.ts` says of this file:
 *
 *   "The vitest in `tests/coursePackManifest.test.ts` asserts the committed
 *    manifest matches what the current packs would emit, so a stale manifest
 *    fails CI."
 *
 * It did not exist. The manifest is the contract the backend vendors and
 * checks its answer keys against, so a stale one means the backend is
 * validating against a course catalogue the frontend no longer ships — and
 * nothing on this side noticed.
 *
 * Regenerate with `npm run export:course-pack-manifest` when packs change.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildManifest,
  type CoursePackManifest,
} from '../scripts/export-course-pack-manifest';

const MANIFEST_PATH = resolve(
  __dirname,
  '..',
  'public',
  'course-packs',
  'course-pack-manifest.json',
);

function committedManifest(): CoursePackManifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as CoursePackManifest;
}

describe('course-pack manifest', () => {
  it('is committed and non-empty', () => {
    const manifest = committedManifest();

    expect(Object.keys(manifest).length).toBeGreaterThan(0);
  });

  it('matches what the current packs would emit', () => {
    // The actual staleness gate. If this fails, run
    // `npm run export:course-pack-manifest` and commit the result — and
    // update the backend's vendored copy in the paired PR.
    expect(committedManifest()).toEqual(buildManifest());
  });

  it('keys every entry as slug@vVersion, consistent with its own fields', () => {
    for (const [key, entry] of Object.entries(committedManifest())) {
      expect(key).toBe(`${entry.slug}@v${entry.version}`);
    }
  });

  it('gives every question a kind and at least one choice', () => {
    // The backend parity check asserts each answer-key id is a member of
    // choiceIds, so an empty choice list would make that check vacuous.
    for (const entry of Object.values(committedManifest())) {
      expect(entry.questions.length).toBeGreaterThan(0);
      for (const q of entry.questions) {
        expect(q.kind).toBeTruthy();
        expect(q.choiceIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('has no duplicate question ids within a pack', () => {
    // Answer keys are keyed by question id, so a duplicate would silently
    // shadow one of the two questions.
    for (const [key, entry] of Object.entries(committedManifest())) {
      const ids = entry.questions.map((q) => q.id);
      expect(new Set(ids).size, `duplicate question ids in ${key}`).toBe(
        ids.length,
      );
    }
  });

  it('has no duplicate choice ids within a question', () => {
    for (const entry of Object.values(committedManifest())) {
      for (const q of entry.questions) {
        expect(new Set(q.choiceIds).size, `duplicate choices in ${q.id}`).toBe(
          q.choiceIds.length,
        );
      }
    }
  });
});
