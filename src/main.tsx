/**
 * main.tsx — browser entry point.
 *
 * Initializes Sentry (no-op without a DSN), applies the saved theme before
 * first paint to avoid a flash, then mounts <App/> into #root. All app
 * composition (providers, router) lives in App.tsx. See AI_CONTEXT.md §3.
 */
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './app/App';
import './styles/index.css';
import './i18n';

// ── Sentry initialisation (no-op when DSN is empty) ──────────────────────────
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  });
}

// Apply saved theme preference early to avoid a flash of wrong theme
const savedTheme = localStorage.getItem('manzen.theme');
if (
  savedTheme === 'dark' ||
  (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(<App />);
