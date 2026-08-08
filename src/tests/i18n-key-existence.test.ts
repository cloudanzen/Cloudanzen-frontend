/**
 * Every literal translation key referenced in the app must exist in `en`.
 *
 * `i18n-parity.test.ts` compares the two locale files against each other, so it
 * only catches keys present in one and missing from the other. It cannot see a
 * key that the code calls but neither file defines — and i18next renders those
 * as either the raw key or, worse, whatever `defaultValue` the call site
 * supplies.
 *
 * `defaultValue` is what made this invisible. A call like
 *
 *   t('policyDetail.comments.noComments', { defaultValue: 'No comments yet.' })
 *
 * looks translated, passes parity, and counts the file as internationalised —
 * while rendering English to a Japanese user forever, because there is nothing
 * in ja.json to override. 31 strings across 8 pages were in that state.
 *
 * Scope and limits: only literal single-quoted keys are checked. Template
 * literals (`t(\`a.${b}\`)`) and keys held in variables are skipped — the
 * dynamic half is not statically decidable, and pretending otherwise would
 * mean an allowlist, which is how a gate stops being a gate.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC = resolve(__dirname, '..');
const LOCALES = resolve(__dirname, '..', '..', 'public', 'locales', 'en');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const bundles = new Map<string, unknown>();
for (const file of readdirSync(LOCALES)) {
  if (file.endsWith('.json')) {
    bundles.set(
      file.replace(/\.json$/, ''),
      JSON.parse(readFileSync(join(LOCALES, file), 'utf-8')),
    );
  }
}

function resolveKey(bundle: unknown, key: string): boolean {
  let node = bundle;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node))
      return false;
    node = (node as Record<string, unknown>)[part];
  }
  return true;
}

/**
 * i18next resolves `foo_one` / `foo_other` (and the `_zero`/`_two`/`_few`/
 * `_many` CLDR forms) from a bare `t('foo', { count })`. A plural key is
 * present if any of its forms is.
 */
const PLURAL_SUFFIXES = ['_one', '_other', '_zero', '_two', '_few', '_many'];

function keyExists(bundle: unknown, key: string): boolean {
  if (resolveKey(bundle, key)) return true;
  return PLURAL_SUFFIXES.some((suffix) =>
    resolveKey(bundle, `${key}${suffix}`),
  );
}

interface Reference {
  file: string;
  namespaces: string[];
  key: string;
}

const KEY_CALL = /\bt\(\s*'([^']+)'/g;
const HOOK_CALL = /useTranslation\(\s*(\[[^\]]*\]|'[^']*')/g;

/**
 * Every namespace the file declares, from any hook call — including the array
 * form `useTranslation(['common', 'onboarding'])`.
 *
 * A key is accepted if it resolves in any of them. That is deliberately looser
 * than real i18next scoping, which binds each `t` to the hook it came from:
 * a file with several components, each on its own namespace, would let a key
 * pass against a sibling's bundle. Tracking that properly needs a parser, not
 * a regex, and the failure mode of guessing is a false alarm on correct code —
 * which is how a gate gets an allowlist and stops meaning anything.
 */
function declaredNamespaces(source: string): string[] {
  const found = new Set<string>();

  for (const match of source.matchAll(HOOK_CALL)) {
    for (const literal of match[1]!.matchAll(/'([^']+)'/g)) {
      found.add(literal[1]!);
    }
  }

  return [...found];
}

function collect(): Reference[] {
  const refs: Reference[] = [];

  for (const file of walk(join(SRC, 'app'))) {
    const source = readFileSync(file, 'utf-8');
    const fileNamespaces = declaredNamespaces(source);

    for (const match of source.matchAll(KEY_CALL)) {
      const raw = match[1]!;
      const [maybeNs, ...rest] = raw.split(':');
      const explicit = rest.length > 0;
      const namespaces = explicit ? [maybeNs!] : fileNamespaces;
      const key = explicit ? rest.join(':') : raw;

      // No namespace anywhere: either not an i18next call at all, or a
      // component that takes `t` as a prop. Nothing to check against.
      if (namespaces.length === 0) continue;

      refs.push({ file: file.slice(SRC.length + 1), namespaces, key });
    }
  }

  return refs;
}

describe('translation key existence', () => {
  const references = collect();

  it('finds a meaningful number of keys to check', () => {
    // Guards the scanner itself: a regex that silently stops matching would
    // otherwise turn this whole suite into a no-op that always passes.
    expect(references.length).toBeGreaterThan(500);
  });

  it('references only namespaces that have a bundle', () => {
    const unknown = [
      ...new Set(references.flatMap((ref) => ref.namespaces)),
    ].filter((ns) => !bundles.has(ns));

    expect(unknown.sort()).toEqual([]);
  });

  it('references only keys that exist in en', () => {
    const missing = references
      .filter(
        (ref) =>
          !ref.namespaces.some(
            (ns) => bundles.has(ns) && keyExists(bundles.get(ns), ref.key),
          ),
      )
      .map((ref) => `${ref.file} → ${ref.namespaces.join('|')}:${ref.key}`);

    expect([...new Set(missing)].sort()).toEqual([]);
  });

  it('has no call site relying on defaultValue to paper over a missing key', () => {
    // Even when the key does exist, `defaultValue` is dead weight that hides
    // the next removal. Translate the string properly instead.
    const offenders = walk(join(SRC, 'app'))
      .filter((file) =>
        /t\(\s*'[^']+'\s*,\s*\{[^}]*defaultValue/s.test(
          readFileSync(file, 'utf-8'),
        ),
      )
      .map((file) => file.slice(SRC.length + 1));

    expect(offenders.sort()).toEqual([]);
  });
});
