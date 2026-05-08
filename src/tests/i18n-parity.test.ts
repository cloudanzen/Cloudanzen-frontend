import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return [prefix];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function readLocale(locale: 'en' | 'ja', namespace: string) {
  const path = resolve(
    process.cwd(),
    'public',
    'locales',
    locale,
    `${namespace}.json`,
  );
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

describe('i18n locale parity', () => {
  it('keeps compliance keys in sync between English and Japanese', () => {
    const enKeys = flattenKeys(readLocale('en', 'compliance')).sort();
    const jaKeys = flattenKeys(readLocale('ja', 'compliance')).sort();

    expect(jaKeys).toEqual(enKeys);
  });

  it('keeps tests keys in sync between English and Japanese', () => {
    const enKeys = flattenKeys(readLocale('en', 'tests')).sort();
    const jaKeys = flattenKeys(readLocale('ja', 'tests')).sort();

    expect(jaKeys).toEqual(enKeys);
  });
});
