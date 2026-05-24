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

// PR-X4: re-mount the 6 existing admin pages at hostname-rooted paths on
// the platform tree. Components are reused from src/app/pages/admin/* —
// no copy, just new routes. The legacy /admin/* mounts in the tenant tree
// stay during the dual-mode window so SUPER_ADMIN users keep working
// until PR-X5 migrates them.
const OrganizationsPage = lazy(() =>
  import('@/app/pages/admin/AdminOrganizationsPage').then((m) => ({
    default: m.AdminOrganizationsPage,
  })),
);
const ControlTemplatesPage = lazy(() =>
  import('@/app/pages/admin/AdminTemplatesPage').then((m) => ({
    default: m.AdminTemplatesPage,
  })),
);
const TestTemplatesPage = lazy(() =>
  import('@/app/pages/admin/AdminTestTemplatesPage').then((m) => ({
    default: m.AdminTestTemplatesPage,
  })),
);
const PolicyTemplatesPage = lazy(() =>
  import('@/app/pages/admin/AdminPolicyTemplatesPage').then((m) => ({
    default: m.AdminPolicyTemplatesPage,
  })),
);
const FrameworksPage = lazy(() =>
  import('@/app/pages/admin/AdminFrameworksPage').then((m) => ({
    default: m.AdminFrameworksPage,
  })),
);
const FrameworkRequestsPage = lazy(() =>
  import('@/app/pages/admin/FrameworkAccessRequestsPage').then((m) => ({
    default: m.FrameworkAccessRequestsPage,
  })),
);

// PR-X4 stubs (sidebar links exist; full pages land in PR-X4.5/X6/X7).
const SupportSessionsPage = lazy(() =>
  import('@/app/pages/platform/SupportSessionsPage').then((m) => ({
    default: m.SupportSessionsPage,
  })),
);
const AllowlistPage = lazy(() =>
  import('@/app/pages/platform/AllowlistPage').then((m) => ({
    default: m.AllowlistPage,
  })),
);
const ActivityLogPage = lazy(() =>
  import('@/app/pages/platform/ActivityLogPage').then((m) => ({
    default: m.ActivityLogPage,
  })),
);

// PR-X9 catalog UI.
const CatalogBatchesPage = lazy(() =>
  import('@/app/pages/platform/catalog/BatchesPage').then((m) => ({
    default: m.BatchesPage,
  })),
);
const CatalogBatchDetailPage = lazy(() =>
  import('@/app/pages/platform/catalog/BatchDetailPage').then((m) => ({
    default: m.BatchDetailPage,
  })),
);
const CatalogVersionsPage = lazy(() =>
  import('@/app/pages/platform/catalog/VersionsPage').then((m) => ({
    default: m.VersionsPage,
  })),
);

// Hostname-rooted at platform.cloudanzen.com. Paths intentionally have NO
// /platform/* prefix — the hostname does the scoping.
export const platformRoutes: RouteObject[] = [
  { path: '/login', Component: PlatformLoginPage },
  {
    path: '/',
    Component: PlatformShell,
    loader: requirePlatformAuth,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: PlatformDashboardPage },
      { path: 'organizations', Component: OrganizationsPage },
      { path: 'support-sessions', Component: SupportSessionsPage },
      { path: 'templates/control', Component: ControlTemplatesPage },
      { path: 'templates/test', Component: TestTemplatesPage },
      { path: 'templates/policy', Component: PolicyTemplatesPage },
      { path: 'frameworks', Component: FrameworksPage },
      { path: 'framework-requests', Component: FrameworkRequestsPage },
      { path: 'allowlist', Component: AllowlistPage },
      { path: 'activity', Component: ActivityLogPage },
      { path: 'catalog/batches', Component: CatalogBatchesPage },
      { path: 'catalog/batches/:id', Component: CatalogBatchDetailPage },
      { path: 'catalog/versions', Component: CatalogVersionsPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
  { path: '*', Component: NotFoundPage },
];
