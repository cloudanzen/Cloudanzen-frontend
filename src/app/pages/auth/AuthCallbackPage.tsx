import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { authService } from "@/services/api/auth";

/**
 * Landing page for the Google OAuth redirect.
 *
 * The backend should redirect here using a URL fragment so the token is
 * never sent to the server in HTTP logs:
 *
 *   https://app.cloudanzen.com/auth/callback#token=JWT&user=encoded_json
 *
 * For backwards compatibility the page also accepts query params, but the
 * backend should be migrated to use the fragment form.
 *
 * This page:
 *  1. Reads the token + user from the URL fragment (preferred) or query params
 *  2. Stores them via authService (sessionStorage)
 *  3. Hard-navigates to "/" so the router auth guard re-runs cleanly
 *
 * On error it redirects to /login?error=oauth_failed
 */
export function AuthCallbackPage() {
  const { t } = useTranslation('auth');
  useEffect(() => {
    try {
      // Prefer hash fragment — never reaches the server in HTTP requests
      const hash = window.location.hash.slice(1); // strip leading "#"
      const params = hash
        ? new URLSearchParams(hash)
        : new URLSearchParams(window.location.search);

      const token = params.get("token");
      const userRaw = params.get("user");

      if (!token || !userRaw) {
        window.location.href = "/login?error=oauth_failed";
        return;
      }

      const user = JSON.parse(decodeURIComponent(userRaw));

      authService.setToken(token);
      authService.cacheUser(user);

      // Hard navigate so the router loader re-reads sessionStorage
      window.location.href = "/";
    } catch {
      window.location.href = "/login?error=oauth_failed";
    }
  }, []); // run once on mount — window.location is stable

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <img src="/logo.svg" className="w-9 h-9" style={{ filter: "brightness(0) invert(1)" }} alt="CloudAnzen" />
          </div>
        </div>
        <p className="text-gray-600 text-sm">{t('callback.signingIn')}</p>
      </div>
    </div>
  );
}
