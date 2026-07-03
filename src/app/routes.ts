import { createBrowserRouter, redirect, type RouteObject } from 'react-router';
import { lazy, Suspense } from 'react';
import { Layout } from '@/app/components/Layout';
import { SettingsLayout } from '@/app/components/settings/SettingsLayout';
import { requireAuth, requireRoles } from '@/app/authGuard';
import { NotFoundPage, RouteErrorBoundary } from '@/app/pages/NotFoundPage';
import { platformRoutes } from '@/app/platform-routes';

// ── Eager imports (needed immediately on load) ────────────────────────────────
import { LoginPage } from '@/app/pages/auth/LoginPage';
import { RegisterPage } from '@/app/pages/auth/RegisterPage';
import { AuthCallbackPage } from '@/app/pages/auth/AuthCallbackPage';
import { SupportSessionExchangePage } from '@/app/pages/SupportSessionExchangePage';

// ── Lazy imports (code-split per route) ───────────────────────────────────────
const HomePage = lazy(() =>
  import('@/app/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const TodoPage = lazy(() =>
  import('@/app/pages/TodoPage').then((m) => ({ default: m.TodoPage })),
);
const ValidationsPage = lazy(() =>
  import('@/app/pages/ValidationsPage').then((m) => ({
    default: m.ValidationsPage,
  })),
);
const ValidationDetailPage = lazy(() =>
  import('@/app/pages/validations/ValidationDetailPage').then((m) => ({
    default: m.ValidationDetailPage,
  })),
);
const ProgressPage = lazy(() =>
  import('@/app/pages/ProgressPage').then((m) => ({
    default: m.ProgressPage,
  })),
);
const ProgressViewerPage = lazy(() =>
  import('@/app/pages/progress/ProgressViewerPage').then((m) => ({
    default: m.ProgressViewerPage,
  })),
);
const NotificationsPage = lazy(() =>
  import('@/app/pages/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);
const NotificationSettingsPage = lazy(() =>
  import('@/app/pages/notifications/NotificationSettingsPage').then((m) => ({
    default: m.NotificationSettingsPage,
  })),
);

// Auditor
const AuditorDashboardPage = lazy(() =>
  import('@/app/pages/auditor/AuditorDashboardPage').then((m) => ({
    default: m.AuditorDashboardPage,
  })),
);
const AuditFinalReportPage = lazy(() =>
  import('@/app/pages/auditor/AuditFinalReportPage').then((m) => ({
    default: m.AuditFinalReportPage,
  })),
);
const AuditorRiskSnapshotPage = lazy(() =>
  import('@/app/pages/auditor/AuditorRiskSnapshotPage').then((m) => ({
    default: m.AuditorRiskSnapshotPage,
  })),
);
const AuditorInvitationPage = lazy(() =>
  import('@/app/pages/auth/AuditorInvitationPage').then((m) => ({
    default: m.AuditorInvitationPage,
  })),
);

// Public Trust Portal
const PublicTrustPortalPage = lazy(() =>
  import('@/app/pages/trust/PublicTrustPortalPage').then((m) => ({
    default: m.PublicTrustPortalPage,
  })),
);

// Compliance
const FrameworksPage = lazy(() =>
  import('@/app/pages/compliance/FrameworksPage').then((m) => ({
    default: m.FrameworksPage,
  })),
);
const FrameworkDetailPage = lazy(() =>
  import('@/app/pages/compliance/FrameworkDetailPage').then((m) => ({
    default: m.FrameworkDetailPage,
  })),
);
const ActivationSummaryPage = lazy(() =>
  import('@/app/pages/compliance/ActivationSummaryPage').then((m) => ({
    default: m.ActivationSummaryPage,
  })),
);
const ControlsPage = lazy(() =>
  import('@/app/pages/controls/ControlsPage').then((m) => ({
    default: m.ControlsPage,
  })),
);
const PoliciesPage = lazy(() =>
  import('@/app/pages/compliance/PoliciesPage').then((m) => ({
    default: m.PoliciesPage,
  })),
);
const PolicyDetailPage = lazy(() =>
  import('@/app/pages/compliance/PolicyDetailPage').then((m) => ({
    default: m.PolicyDetailPage,
  })),
);
const MergeReviewPage = lazy(() =>
  import('@/app/pages/assets/MergeReviewPage').then((m) => ({
    default: m.MergeReviewPage,
  })),
);
const DocumentsPage = lazy(() =>
  import('@/app/pages/compliance/DocumentsPage').then((m) => ({
    default: m.DocumentsPage,
  })),
);
const DocumentDetailPage = lazy(() =>
  import('@/app/pages/compliance/DocumentDetailPage').then((m) => ({
    default: m.DocumentDetailPage,
  })),
);
const AuditsPage = lazy(() =>
  import('@/app/pages/compliance/AuditsPage').then((m) => ({
    default: m.AuditsPage,
  })),
);
const AuditDetailPage = lazy(() =>
  import('@/app/pages/compliance/AuditDetailPage').then((m) => ({
    default: m.AuditDetailPage,
  })),
);
const AuditRequestDetailPage = lazy(() =>
  import('@/app/pages/compliance/AuditRequestDetailPage').then((m) => ({
    default: m.AuditRequestDetailPage,
  })),
);
const ComplianceSettingsPage = lazy(() =>
  import('@/app/pages/compliance/SettingsPage').then((m) => ({
    default: m.ComplianceSettingsPage,
  })),
);

// Customer Trust
const TrustCenterPage = lazy(() =>
  import('@/app/pages/customer-trust/TrustCenterPage').then((m) => ({
    default: m.TrustCenterPage,
  })),
);
const CustomerTrustSettingsPage = lazy(() =>
  import('@/app/pages/customer-trust/SettingsPage').then((m) => ({
    default: m.CustomerTrustSettingsPage,
  })),
);
const CustomerTrustOverviewPage = lazy(
  () => import('@/app/pages/customer-trust/OverviewPage'),
);
const CustomerTrustAccountsPage = lazy(
  () => import('@/app/pages/customer-trust/AccountsPage'),
);
const CustomerTrustAccountDetailPage = lazy(
  () => import('@/app/pages/customer-trust/AccountDetailPage'),
);
const CustomerTrustActivityPage = lazy(
  () => import('@/app/pages/customer-trust/ActivityPage'),
);
const CustomerTrustCommitmentsPage = lazy(
  () => import('@/app/pages/customer-trust/CommitmentsPage'),
);
const CustomerTrustCommitmentDetailPage = lazy(
  () => import('@/app/pages/customer-trust/CommitmentDetailPage'),
);

// Risk
const RiskOverviewPage = lazy(() =>
  import('@/app/pages/risk/OverviewPage').then((m) => ({
    default: m.RiskOverviewPage,
  })),
);
const RisksPage = lazy(() =>
  import('@/app/pages/risk/RisksPage').then((m) => ({ default: m.RisksPage })),
);
const RiskDetailPage = lazy(() =>
  import('@/app/pages/risk/RiskDetailPage').then((m) => ({
    default: m.RiskDetailPage,
  })),
);
const RiskLibraryPage = lazy(() =>
  import('@/app/pages/risk/RiskLibraryPage').then((m) => ({
    default: m.RiskLibraryPage,
  })),
);
const RemediationsPage = lazy(() =>
  import('@/app/pages/risk/RemediationsPage').then((m) => ({
    default: m.RemediationsPage,
  })),
);
const SnapshotPage = lazy(() =>
  import('@/app/pages/risk/SnapshotPage').then((m) => ({
    default: m.SnapshotPage,
  })),
);
const RiskEnginePage = lazy(() =>
  import('@/app/pages/risk/EnginePage').then((m) => ({
    default: m.RiskEnginePage,
  })),
);
const RiskSettingsPage = lazy(() =>
  import('@/app/pages/risk/SettingsPage').then((m) => ({
    default: m.RiskSettingsPage,
  })),
);

// Vendors
const VendorsPage = lazy(() =>
  import('@/app/pages/vendors/VendorsPage').then((m) => ({
    default: m.VendorsPage,
  })),
);
const VendorDetailPage = lazy(() =>
  import('@/app/pages/vendors/VendorDetailPage').then((m) => ({
    default: m.VendorDetailPage,
  })),
);
const VendorDiscoveryPage = lazy(() =>
  import('@/app/pages/vendors/VendorDiscoveryPage').then((m) => ({
    default: m.VendorDiscoveryPage,
  })),
);
const VendorIntakeRequestsPage = lazy(() =>
  import('@/app/pages/vendors/VendorIntakeRequestsPage').then((m) => ({
    default: m.VendorIntakeRequestsPage,
  })),
);

// Assets
const InventoryPage = lazy(() =>
  import('@/app/pages/assets/InventoryPage').then((m) => ({
    default: m.InventoryPage,
  })),
);
const AssetDetailPage = lazy(() =>
  import('@/app/pages/assets/AssetDetailPage').then((m) => ({
    default: m.AssetDetailPage,
  })),
);
const CodeChangesPage = lazy(() =>
  import('@/app/pages/assets/CodeChangesPage').then((m) => ({
    default: m.CodeChangesPage,
  })),
);
const AssetsFindingsPage = lazy(() =>
  import('@/app/pages/assets/FindingsPage').then((m) => ({
    default: m.FindingsPage,
  })),
);
const SecurityAlertsPage = lazy(() =>
  import('@/app/pages/assets/SecurityAlertsPage').then((m) => ({
    default: m.SecurityAlertsPage,
  })),
);
const AssetsSettingsPage = lazy(() =>
  import('@/app/pages/assets/SettingsPage').then((m) => ({
    default: m.AssetsSettingsPage,
  })),
);
const FrameworkCatalogDetailPage = lazy(() =>
  import('@/app/pages/compliance/FrameworkCatalogDetailPage').then((m) => ({
    default: m.FrameworkCatalogDetailPage,
  })),
);

// Personnel
const ComputersPage = lazy(() =>
  import('@/app/pages/personnel/ComputersPage').then((m) => ({
    default: m.ComputersPage,
  })),
);
const AccessManagementPage = lazy(() =>
  import('@/app/pages/personnel/AccessManagementPage').then((m) => ({
    default: m.AccessManagementPage,
  })),
);
const PersonnelSettingsPage = lazy(() =>
  import('@/app/pages/personnel/SettingsPage').then((m) => ({
    default: m.PersonnelSettingsPage,
  })),
);

// AI
const QuestionnaireAssistantPage = lazy(() =>
  import('@/app/pages/ai/QuestionnaireAssistantPage').then((m) => ({
    default: m.QuestionnaireAssistantPage,
  })),
);
const AiDocumentsPage = lazy(() =>
  import('@/app/pages/ai/AiDocumentsPage').then((m) => ({
    default: m.AiDocumentsPage,
  })),
);
const AiChatPage = lazy(() =>
  import('@/app/pages/ai/AiChatPage').then((m) => ({
    default: m.AiChatPage,
  })),
);
// T-102: ISO/IEC 42001 AI model registry.
const AiModelsPage = lazy(() =>
  import('@/app/pages/ai/AiModelsPage').then((m) => ({
    default: m.AiModelsPage,
  })),
);
// AI TrustOps Phase 3: readiness dashboard at /ai-trust.
const AiTrustDashboardPage = lazy(() =>
  import('@/app/pages/ai/AiTrustDashboardPage').then((m) => ({
    default: m.AiTrustDashboardPage,
  })),
);
// AI TrustOps Phase 4 (slice 1): AI Systems Registry.
const AiSystemsPage = lazy(() =>
  import('@/app/pages/ai/AiSystemsPage').then((m) => ({
    default: m.AiSystemsPage,
  })),
);

// Other
const IntegrationsPage = lazy(() =>
  import('@/app/pages/IntegrationsPage').then((m) => ({
    default: m.IntegrationsPage,
  })),
);
const PartnerApiPage = lazy(() =>
  import('@/app/pages/integrations/PartnerApiPage').then((m) => ({
    default: m.PartnerApiPage,
  })),
);
const OnboardingTasksPage = lazy(() =>
  import('@/app/pages/OnboardingTasksPage').then((m) => ({
    default: m.OnboardingTasksPage,
  })),
);

// Account / Access
const AccountSettingsPage = lazy(() =>
  import('@/app/pages/account/AccountSettingsPage').then((m) => ({
    default: m.AccountSettingsPage,
  })),
);
const AccessUsersPage = lazy(() =>
  import('@/app/pages/access/AccessUsersPage').then((m) => ({
    default: m.AccessUsersPage,
  })),
);
const AccessRolesPage = lazy(() =>
  import('@/app/pages/access/AccessRolesPage').then((m) => ({
    default: m.AccessRolesPage,
  })),
);
const AccessRequestsPage = lazy(() =>
  import('@/app/pages/access/AccessRequestsPage').then((m) => ({
    default: m.AccessRequestsPage,
  })),
);
const McpSettingsPage = lazy(() =>
  import('@/app/pages/settings/McpSettingsPage').then((m) => ({
    default: m.McpSettingsPage,
  })),
);
const AiSettingsPage = lazy(() =>
  import('@/app/pages/settings/AiSettingsPage').then((m) => ({
    default: m.AiSettingsPage,
  })),
);

const accessAdminLoader = requireRoles(
  ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'],
  '/settings/access/requests',
);
const partnerAdminLoader = requireRoles(
  ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'],
  '/integrations',
);

// Platform Admin (SUPER_ADMIN only)
const AdminTemplatesPage = lazy(() =>
  import('@/app/pages/admin/AdminTemplatesPage').then((m) => ({
    default: m.AdminTemplatesPage,
  })),
);
const AdminOrganizationsPage = lazy(() =>
  import('@/app/pages/admin/AdminOrganizationsPage').then((m) => ({
    default: m.AdminOrganizationsPage,
  })),
);
const AdminTestTemplatesPage = lazy(() =>
  import('@/app/pages/admin/AdminTestTemplatesPage').then((m) => ({
    default: m.AdminTestTemplatesPage,
  })),
);
const AdminPolicyTemplatesPage = lazy(() =>
  import('@/app/pages/admin/AdminPolicyTemplatesPage').then((m) => ({
    default: m.AdminPolicyTemplatesPage,
  })),
);
const AdminFrameworksPage = lazy(() =>
  import('@/app/pages/admin/AdminFrameworksPage').then((m) => ({
    default: m.AdminFrameworksPage,
  })),
);
const FrameworkAccessRequestsPage = lazy(() =>
  import('@/app/pages/admin/FrameworkAccessRequestsPage').then((m) => ({
    default: m.FrameworkAccessRequestsPage,
  })),
);

// ── Auth guard ────────────────────────────────────────────────────────────────
// ── Tenant route tree ─────────────────────────────────────────────────────────
const tenantRoutes: RouteObject[] = [
  // Public auth routes (no layout)
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/auth/callback', Component: AuthCallbackPage },
  { path: '/auditor/invitations/:secret', Component: AuditorInvitationPage },

  // Support session exchange (no auth — the one-time code IS the auth)
  { path: '/support-session/exchange', Component: SupportSessionExchangePage },

  // Public Trust Center portal (no auth, no app layout)
  { path: '/trust/:orgSlug', Component: PublicTrustPortalPage },
  { path: '/trust/:orgSlug/erasure/confirm', Component: PublicTrustPortalPage },

  // Protected app routes (with layout)
  {
    path: '/',
    Component: Layout,
    loader: requireAuth,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: HomePage },
      { path: 'todo', Component: TodoPage },
      { path: 'my-tasks', loader: () => redirect('/todo') },
      { path: 'validations', Component: ValidationsPage },
      { path: 'validations/:testId', Component: ValidationDetailPage },
      { path: 'tests', loader: () => redirect('/validations') },
      {
        path: 'tests/:testId',
        loader: ({ params }) => redirect(`/validations/${params.testId}`),
      },
      {
        path: 'tests/library',
        loader: async () => redirect('/compliance/frameworks'),
      },
      { path: 'progress', Component: ProgressPage },
      { path: 'reports', loader: () => redirect('/progress') },
      { path: 'notifications', Component: NotificationsPage },
      { path: 'progress/viewer/:reportId', Component: ProgressViewerPage },
      {
        path: 'reports/viewer/:reportId',
        loader: ({ params }) => redirect(`/progress/viewer/${params.reportId}`),
      },

      // Auditor
      { path: 'auditor/dashboard', Component: AuditorDashboardPage },
      {
        path: 'auditor/audits/:auditId/final-report',
        Component: AuditFinalReportPage,
      },
      {
        path: 'auditor/audits/:auditId/risk-snapshots/:snapshotId',
        Component: AuditorRiskSnapshotPage,
      },

      // Compliance
      { path: 'compliance/frameworks', Component: FrameworksPage },
      {
        path: 'compliance/frameworks/:slug/activated',
        Component: ActivationSummaryPage,
      },
      {
        path: 'compliance/frameworks/:slug/explore',
        Component: FrameworkCatalogDetailPage,
      },
      { path: 'compliance/frameworks/:slug', Component: FrameworkDetailPage },
      { path: 'compliance/controls', Component: ControlsPage },
      { path: 'compliance/policies', Component: PoliciesPage },
      { path: 'compliance/policies/:id', Component: PolicyDetailPage },
      { path: 'compliance/documents', Component: DocumentsPage },
      {
        path: 'compliance/documents/:documentId',
        Component: DocumentDetailPage,
      },
      { path: 'compliance/audits', Component: AuditsPage },
      { path: 'compliance/audits/:auditId', Component: AuditDetailPage },
      {
        path: 'compliance/audits/:auditId/requests/:requestId',
        Component: AuditRequestDetailPage,
      },
      {
        path: 'compliance/findings',
        loader: () => redirect('/assets/findings'),
      },
      {
        path: 'compliance/settings',
        loader: () => redirect('/settings/compliance'),
      },

      // Customer Trust
      {
        path: 'customer-trust/overview',
        Component: CustomerTrustOverviewPage,
      },
      {
        path: 'customer-trust/accounts',
        Component: CustomerTrustAccountsPage,
      },
      {
        path: 'customer-trust/accounts/:id',
        Component: CustomerTrustAccountDetailPage,
      },
      {
        path: 'customer-trust/activity',
        Component: CustomerTrustActivityPage,
      },
      {
        path: 'customer-trust/commitments',
        Component: CustomerTrustCommitmentsPage,
      },
      {
        path: 'customer-trust/commitments/:id',
        Component: CustomerTrustCommitmentDetailPage,
      },
      { path: 'customer-trust/trust-center', Component: TrustCenterPage },
      {
        path: 'customer-trust/settings',
        loader: () => redirect('/settings/customer-trust'),
      },

      // Risk
      { path: 'risk/overview', Component: RiskOverviewPage },
      { path: 'risk/risks', Component: RisksPage },
      { path: 'risk/risks/:riskId', Component: RiskDetailPage },
      { path: 'risk/library', Component: RiskLibraryPage },
      { path: 'risk/remediations', Component: RemediationsPage },
      {
        path: 'risk/action-tracker',
        loader: () => redirect('/risk/remediations'),
      },
      { path: 'risk/snapshot', Component: SnapshotPage },
      { path: 'risk/engine', Component: RiskEnginePage },
      { path: 'risk/settings', loader: () => redirect('/settings/risk') },

      // Vendors
      { path: 'vendors', Component: VendorsPage },
      {
        path: 'vendors/discovery',
        loader: requireRoles(
          ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'],
          '/vendors',
        ),
        Component: VendorDiscoveryPage,
      },
      {
        path: 'vendors/intake-requests',
        loader: requireRoles(
          ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'],
          '/vendors',
        ),
        Component: VendorIntakeRequestsPage,
      },
      { path: 'vendors/:vendorId', Component: VendorDetailPage },

      // Assets
      { path: 'assets/inventory/:id', Component: AssetDetailPage },
      { path: 'assets/inventory', Component: InventoryPage },
      { path: 'assets/merge-review', Component: MergeReviewPage },
      { path: 'assets/code-changes', Component: CodeChangesPage },
      { path: 'assets/findings', Component: AssetsFindingsPage },
      {
        path: 'assets/vulnerabilities',
        loader: () => redirect('/assets/findings'),
      },
      { path: 'assets/security-alerts', Component: SecurityAlertsPage },
      { path: 'assets/settings', loader: () => redirect('/settings/assets') },

      // Personnel
      { path: 'personnel/computers', Component: ComputersPage },
      { path: 'personnel/access', Component: AccessManagementPage },
      {
        path: 'personnel/settings',
        loader: () => redirect('/settings/personnel'),
      },

      // AI TrustOps Phase 3 — the AI Trust Dashboard now lands at the
      // /ai-trust index (replaces the Phase 2 redirect to /ai-trust/chat).
      {
        path: 'ai-trust',
        Component: AiTrustDashboardPage,
      },
      // AI TrustOps Phase 4 (slice 1): AI Systems Registry.
      {
        path: 'ai-trust/systems',
        Component: AiSystemsPage,
      },

      // AI TrustOps Phase 2 — canonical /ai-trust/* paths. The existing
      // /ai/* paths below remain as compatibility redirects for one
      // release window so existing bookmarks and in-app links keep
      // working.
      {
        path: 'ai-trust/chat',
        Component: AiChatPage,
      },
      {
        path: 'ai-trust/questionnaire-assistant',
        Component: QuestionnaireAssistantPage,
      },
      {
        path: 'ai-trust/knowledge-base',
        Component: AiDocumentsPage,
      },
      {
        path: 'ai-trust/models',
        Component: AiModelsPage,
      },

      // Legacy /ai/* → /ai-trust/* compatibility redirects (loader-based,
      // SPA-internal). Not true HTTP 301s — purely for existing bookmarks
      // during the rebrand window. Phase 3 lands the AI Trust Dashboard
      // at /ai-trust so /ai will also redirect to that landing once the
      // dashboard exists.
      {
        path: 'ai/chat',
        loader: () => redirect('/ai-trust/chat'),
      },
      {
        path: 'ai/questionnaire-assistant',
        loader: () => redirect('/ai-trust/questionnaire-assistant'),
      },
      {
        path: 'ai/knowledge-base',
        loader: () => redirect('/ai-trust/knowledge-base'),
      },
      {
        path: 'ai/models',
        loader: () => redirect('/ai-trust/models'),
      },

      // Platform Admin (SUPER_ADMIN)
      { path: 'admin/templates', Component: AdminTemplatesPage },
      { path: 'admin/test-templates', Component: AdminTestTemplatesPage },
      { path: 'admin/policy-templates', Component: AdminPolicyTemplatesPage },
      { path: 'admin/frameworks', Component: AdminFrameworksPage },
      {
        path: 'admin/framework-requests',
        Component: FrameworkAccessRequestsPage,
      },
      { path: 'admin/organizations', Component: AdminOrganizationsPage },

      // Other
      { path: 'integrations', Component: IntegrationsPage },
      {
        path: 'integrations/partner-api',
        loader: partnerAdminLoader,
        Component: PartnerApiPage,
      },
      { path: 'onboarding-tasks', Component: OnboardingTasksPage },
      {
        path: 'my-security-tasks',
        loader: () => redirect('/onboarding-tasks'),
      },

      // Settings shell
      {
        path: 'settings',
        Component: SettingsLayout,
        children: [
          { path: 'profile', Component: AccountSettingsPage },
          { path: 'notifications', Component: NotificationSettingsPage },
          {
            path: 'access/users',
            loader: accessAdminLoader,
            Component: AccessUsersPage,
          },
          {
            path: 'access/roles',
            loader: accessAdminLoader,
            Component: AccessRolesPage,
          },
          { path: 'access/requests', Component: AccessRequestsPage },
          { path: 'compliance', Component: ComplianceSettingsPage },
          { path: 'risk', Component: RiskSettingsPage },
          { path: 'assets', Component: AssetsSettingsPage },
          { path: 'personnel', Component: PersonnelSettingsPage },
          { path: 'customer-trust', Component: CustomerTrustSettingsPage },
          { path: 'mcp', Component: McpSettingsPage },
          { path: 'ai', Component: AiSettingsPage },
        ],
      },

      // Catch-all 404
      { path: '*', Component: NotFoundPage },
    ],
  },

  // Global catch-all for unmatched routes outside the layout
  { path: '*', Component: NotFoundPage },
];

// ── Hostname-based router selection ──────────────────────────────────────────
// Production hostnames are pinned via DNS; the env allowlist is the trust
// boundary. Anything not in VITE_PLATFORM_HOSTS falls through to the tenant
// tree (preview deploys, attacker-controlled hosts, etc.).
const PLATFORM_HOSTS = (
  (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env?.VITE_PLATFORM_HOSTS ?? ''
)
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);
const isPlatformHost =
  typeof window !== 'undefined' &&
  PLATFORM_HOSTS.includes(window.location.hostname);

export const router = createBrowserRouter(
  isPlatformHost ? platformRoutes : tenantRoutes,
);

// Re-export Suspense for convenience (used in Layout to wrap <Outlet />)
export { Suspense };
