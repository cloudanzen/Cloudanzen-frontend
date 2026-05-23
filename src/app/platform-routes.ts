import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { PlatformShell } from '@/app/pages/platform/PlatformShell';
import { PlatformLoginPage } from '@/app/pages/platform/PlatformLoginPage';
import { requirePlatformAuth } from '@/app/platformAuthGuard';
import { NotFoundPage, RouteErrorBoundary } from '@/app/pages/NotFoundPage';

const PlatformDashboardPage = lazy(() =>
  import('@/app/pages/platform/PlatformDashboardPage').then((m) => ({
    default: m.PlatformDashboardPage,
  })),
);

// Hostname-rooted at platform.cloudanzen.com. Paths intentionally have NO
// /platform/* prefix — the hostname does the scoping.
//
// Routes for /organizations, /support-sessions, /templates/*, /frameworks,
// /catalog/*, /allowlist, /activity are filled in PR-X4/X6/X7.
export const platformRoutes: RouteObject[] = [
  { path: '/login', Component: PlatformLoginPage },
  {
    path: '/',
    Component: PlatformShell,
    loader: requirePlatformAuth,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: PlatformDashboardPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
  { path: '*', Component: NotFoundPage },
];
