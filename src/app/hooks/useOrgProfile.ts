/**
 * useOrgProfile — AI TrustOps Phase 2 FE hook.
 *
 * Returns the cached org profile from /api/auth/me. Backed by react-query
 * with a 5-minute stale window so navigation does not refetch on every
 * page mount. Components that need bundle gating or adaptive routing
 * call this to read `companyType`, `primaryUseCase`, `enabledBundles`,
 * `bundlesVersion`.
 *
 * Returns `null` for `org` if the user is not authenticated or if the
 * backend is older than Phase 2 BE (the field is additive and may be
 * absent on staging during the rollout window).
 */
import { useQuery } from '@tanstack/react-query';

import { authService } from '@/services/api/auth';
import { hasAuthToken } from '@/services/authStorage';
import type {
  CurrentUser,
  KnownBundle,
  OrgProfile,
} from '@/services/api/types';

const STALE_MS = 5 * 60 * 1000;

export function useOrgProfile(): {
  org: OrgProfile | null;
  isLoading: boolean;
  isError: boolean;
} {
  const enabled = hasAuthToken();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () =>
      authService.getCurrentUser() as unknown as Promise<CurrentUser>,
    enabled,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
  const org = (data as CurrentUser | undefined)?.org ?? null;
  return { org, isLoading, isError };
}

/**
 * Legacy-default bundle floor. When the BE returns an empty
 * enabledBundles array (or the older BE returns no `org` block at all),
 * the FE treats the org as having [COMPLIANCE_AUTOMATION, CUSTOMER_TRUST]
 * — same fallback the Phase 0 server middleware applies.
 */
export const LEGACY_BUNDLE_FLOOR: KnownBundle[] = [
  'COMPLIANCE_AUTOMATION',
  'CUSTOMER_TRUST',
];

/**
 * Resolves the effective bundle set for an org, applying the legacy
 * floor on empty / missing.
 */
export function effectiveBundles(org: OrgProfile | null): KnownBundle[] {
  if (!org || !org.enabledBundles || org.enabledBundles.length === 0) {
    return LEGACY_BUNDLE_FLOOR;
  }
  return org.enabledBundles;
}

/**
 * Pure helper for sidebar / route filtering. Returns true when the
 * org has every required bundle. Empty `required` array → always true.
 */
export function hasBundles(
  org: OrgProfile | null,
  required: KnownBundle[],
): boolean {
  if (required.length === 0) return true;
  const bundles = new Set(effectiveBundles(org));
  return required.every((b) => bundles.has(b));
}
