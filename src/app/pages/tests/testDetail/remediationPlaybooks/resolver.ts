import { PLAYBOOKS } from './registry';
import type { Playbook } from './types';

/**
 * Inputs we accept for resolution. Mirrors the TestRecord fields the
 * frontend already loads from `/api/tests/:id`. None are required —
 * the resolver tries each signal in order and returns the first match.
 */
export type ResolveInput = {
  templateId?: string | null;
  testKey?: string | null;
  name?: string | null;
  /** Provider label from `TestRecord.integration?.provider` (e.g. `"AWS"`, `"FLEET"`). */
  provider?: string | null;
};

export type ResolveOutcome =
  | {
      playbook: Playbook;
      resolvedBy: 'templateId' | 'catalogKey' | 'name' | 'providerSlug';
    }
  | { playbook: null; resolvedBy: 'unresolved' };

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeProvider(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, '');
}

/**
 * Resolve a static playbook for a given test. Order:
 *
 *   1. Exact `templateId` match  (preferred — stable post-PR1 backfill)
 *   2. Catalog key parsed from `testKey` (`integration:{provider}:{id}:{catalogKey}`)
 *   3. Exact `name` match (handles seeded Document templates by display name)
 *   4. Provider + slug(name) — handles legacy `{provider}:{scope}:auto:{slug}` testKeys
 *      where the testKey itself was not parseable into a clean catalogKey.
 *
 * Returns `unresolved` for custom / future / non-catalog tests so the caller
 * can render a generic fallback instead of pretending to have specific
 * guidance.
 */
export function resolvePlaybook(input: ResolveInput): ResolveOutcome {
  if (input.templateId) {
    const match = PLAYBOOKS.find((p) => p.templateId === input.templateId);
    if (match) return { playbook: match, resolvedBy: 'templateId' };
  }

  if (input.testKey?.startsWith('integration:')) {
    const parts = input.testKey.split(':');
    if (parts.length >= 4) {
      const catalogKey = parts.slice(3).join(':');
      const match = PLAYBOOKS.find((p) => p.catalogKey === catalogKey);
      if (match) return { playbook: match, resolvedBy: 'catalogKey' };
    }
  }

  if (input.name) {
    const match = PLAYBOOKS.find((p) => p.templateName === input.name);
    if (match) return { playbook: match, resolvedBy: 'name' };
  }

  if (input.provider && input.name) {
    const provider = normalizeProvider(input.provider);
    const nameSlug = slug(input.name);
    const match = PLAYBOOKS.find((p) => {
      if (!p.catalogKey) return false;
      const catalogProviderRaw = p.catalogKey.split('.')[0];
      if (!catalogProviderRaw) return false;
      const catalogProvider = normalizeProvider(catalogProviderRaw);
      if (catalogProvider !== provider) return false;
      return slug(p.title) === nameSlug;
    });
    if (match) return { playbook: match, resolvedBy: 'providerSlug' };
  }

  return { playbook: null, resolvedBy: 'unresolved' };
}
