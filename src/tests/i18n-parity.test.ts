import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return [prefix];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function flattenEntries(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => flattenEntries(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** `{{name}}`, `{{count}}` — the values i18next substitutes at render time. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*([\w.]+)[^}]*\}\}/g)]
    .map((m) => m[1]!)
    .sort();
}

function localeDir(locale: 'en' | 'ja') {
  return resolve(process.cwd(), 'public', 'locales', locale);
}

function readLocale(locale: 'en' | 'ja', namespace: string) {
  return JSON.parse(
    readFileSync(resolve(localeDir(locale), `${namespace}.json`), 'utf8'),
  ) as unknown;
}

const namespaces = readdirSync(localeDir('en'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

/**
 * Every namespace is checked, discovered from the filesystem rather than
 * listed here. A new locale file is therefore gated the moment it is added —
 * previously only four of sixteen namespaces were covered, and `ai` had
 * existed for months before anything checked it.
 */
describe('i18n locale parity', () => {
  it('finds namespaces to check', () => {
    expect(namespaces.length).toBeGreaterThan(10);
  });

  it('ships the same namespace files for both locales', () => {
    const ja = readdirSync(localeDir('ja'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();

    expect(ja).toEqual(namespaces);
  });

  it.each(namespaces)(
    'keeps %s keys in sync between English and Japanese',
    (ns) => {
      const enKeys = flattenKeys(readLocale('en', ns)).sort();
      const jaKeys = flattenKeys(readLocale('ja', ns)).sort();

      expect(jaKeys).toEqual(enKeys);
    },
  );

  /**
   * Matching keys are not enough: a translation that drops `{{name}}` renders
   * a sentence with a hole in it, and one that invents `{{naem}}` renders the
   * literal braces. Neither shows up in a key diff, and neither is visible to
   * anyone reviewing the English side.
   */
  it.each(namespaces)(
    'keeps %s interpolation placeholders identical across locales',
    (ns) => {
      const ja = new Map(flattenEntries(readLocale('ja', ns)));

      const mismatched = flattenEntries(readLocale('en', ns))
        .filter(([key, en]) => {
          const translated = ja.get(key);
          return (
            translated !== undefined &&
            placeholders(en).join(',') !== placeholders(translated).join(',')
          );
        })
        .map(
          ([key, en]) =>
            `${key}: en=[${placeholders(en)}] ja=[${placeholders(ja.get(key)!)}]`,
        );

      expect(mismatched).toEqual([]);
    },
  );
});
