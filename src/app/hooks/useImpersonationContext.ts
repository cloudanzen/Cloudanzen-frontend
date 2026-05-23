import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/api/auth';
import type { CurrentUser, ImpersonationContext } from '@/services/api/types';

const ME_QUERY_KEY = ['auth', 'me-with-impersonation'] as const;

// Reactive read of /api/auth/me purely for the impersonation field.
// Cached separately from any local user-storage hook because:
//   - the cookie + storage state is local-only and never has impersonation
//   - the impersonation field changes when the backend SupportSession
//     expires/is-revoked, not on local action — needs a real network read
//
// Re-fetched every 30s so a revoked session in another tab closes the
// banner within one cycle. A failed fetch (401, network) returns null so
// the banner just doesn't render.
export function useImpersonationContext(): ImpersonationContext | null {
  const q = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        const res =
          (await authService.getCurrentUser()) as unknown as CurrentUser;
        return res.impersonation ?? null;
      } catch {
        return null;
      }
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });
  return q.data ?? null;
}
