import { redirect } from 'react-router';
import { platformAuthService } from '@/services/api/platformAuth';

// Platform-side equivalent of requireAuth. The __Host-platform-token cookie
// is HttpOnly so we can't peek at it from JS — instead hit /api/platform/auth/me
// and let the backend tell us. A 401/network error → redirect to /login.
export async function requirePlatformAuth() {
  try {
    await platformAuthService.getMe();
    return null;
  } catch {
    return redirect('/login');
  }
}
