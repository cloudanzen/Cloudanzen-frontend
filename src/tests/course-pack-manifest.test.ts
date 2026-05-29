import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildManifest,
  type CoursePackManifest,
} from '../../scripts/export-course-pack-manifest';

const MANIFEST_PATH = resolve(
  process.cwd(),
  'public',
  'course-packs',
  'course-pack-manifest.json',
);

describe('course-pack manifest', () => {
  it('committed manifest matches the current course packs', () => {
    const onDisk = JSON.parse(
      readFileSync(MANIFEST_PATH, 'utf8'),
    ) as CoursePackManifest;
    const fresh = buildManifest();
    expect(onDisk).toEqual(fresh);
  });
});
