import { useQuery } from '@tanstack/react-query';
import {
  platformAuthService,
  type PlatformAdmin,
} from '@/services/api/platformAuth';

const PLATFORM_ME_KEY = ['platform', 'me'] as const;

// Hook bound to the __Host-platform-token cookie (HttpOnly; can't be read
// from JS). State derived from GET /api/platform/auth/me. A 401 = no
// session — return null so the page can redirect to /login.
export function usePlatformAdmin(): {
  data: PlatformAdmin | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const q = useQuery({
    queryKey: PLATFORM_ME_KEY,
    queryFn: async () => {
      try {
        const res = await platformAuthService.getMe();
        return res.user;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
  return {
    data: q.data ?? null,
    isLoading: q.isLoading,
    error: q.error as Error | null,
    refetch: q.refetch,
  };
}

export { PLATFORM_ME_KEY };
