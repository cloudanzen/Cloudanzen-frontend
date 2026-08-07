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
});
