import { createBrowserRouter, redirect } from 'react-router';
import { lazy, Suspense } from 'react';
import { Layout } from '@/app/components/Layout';
import { SettingsLayout } from '@/app/components/settings/SettingsLayout';
import { requireAuth, requireRoles } from '@/app/authGuard';
import { NotFoundPage, RouteErrorBoundary } from '@/app/pages/NotFoundPage';

// ── Eager imports (needed immediately on load) ────────────────────────────────
import { LoginPage } from '@/app/pages/auth/LoginPage';
import { RegisterPage } from '@/app/pages/auth/RegisterPage';
import { AuthCallbackPage } from '@/app/pages/auth/AuthCallbackPage';

// ── Lazy imports (code-split per route) ───────────────────────────────────────
const HomePage = lazy(() =>
  import('@/app/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const MyWorkPage = lazy(() =>
  import('@/app/pages/MyWorkPage').then((m) => ({ default: m.MyWorkPage })),
);
const TestsPage = lazy(() =>
  import('@/app/pages/TestsPage').then((m) => ({ default: m.TestsPage })),
);
const TestDetailPage = lazy(() =>
  import('@/app/pages/tests/TestDetailPage').then((m) => ({
    default: m.TestDetailPage,
  })),
);
const ReportsPage = lazy(() =>
  import('@/app/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const ReportViewerPage = lazy(() =>
  import('@/app/pages/reports/ReportViewerPage').then((m) => ({
    default: m.ReportViewerPage,
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
const ActionTrackerPage = lazy(() =>
  import('@/app/pages/risk/ActionTrackerPage').then((m) => ({
    default: m.ActionTrackerPage,
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
const MySecurityTasksPage = lazy(() =>
  import('@/app/pages/MySecurityTasksPage').then((m) => ({
    default: m.MySecurityTasksPage,
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

// ── Auth guard ────────────────────────────────────────────────────────────────
// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public auth routes (no layout)
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/auth/callback', Component: AuthCallbackPage },

  // Public Trust Center portal (no auth, no app layout)
  { path: '/trust/:orgSlug', Component: PublicTrustPortalPage },

  // Protected app routes (with layout)
  {
    path: '/',
    Component: Layout,
    loader: requireAuth,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: HomePage },
      { path: 'my-tasks', Component: MyWorkPage },
      { path: 'tests', Component: TestsPage },
      { path: 'tests/:testId', Component: TestDetailPage },
      {
        path: 'tests/library',
        loader: async () => redirect('/compliance/frameworks'),
      },
      { path: 'reports', Component: ReportsPage },
      { path: 'notifications', Component: NotificationsPage },
      { path: 'reports/viewer/:reportId', Component: ReportViewerPage },

      // Auditor
      { path: 'auditor/dashboard', Component: AuditorDashboardPage },
      {
        path: 'auditor/audits/:auditId/final-report',
        Component: AuditFinalReportPage,
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
      { path: 'compliance/documents/:documentId', Component: DocumentDetailPage },
      { path: 'compliance/audits', Component: AuditsPage },
      { path: 'compliance/audits/:auditId', Component: AuditDetailPage },
      { path: 'compliance/findings', loader: () => redirect('/assets/findings') },
      { path: 'compliance/settings', loader: () => redirect('/settings/compliance') },

      // Customer Trust
      { path: 'customer-trust/trust-center', Component: TrustCenterPage },
      { path: 'customer-trust/settings', loader: () => redirect('/settings/customer-trust') },

      // Risk
      { path: 'risk/overview', Component: RiskOverviewPage },
      { path: 'risk/risks', Component: RisksPage },
      { path: 'risk/risks/:riskId', Component: RiskDetailPage },
      { path: 'risk/library', Component: RiskLibraryPage },
      { path: 'risk/action-tracker', Component: ActionTrackerPage },
      { path: 'risk/snapshot', Component: SnapshotPage },
      { path: 'risk/engine', Component: RiskEnginePage },
      { path: 'risk/settings', loader: () => redirect('/settings/risk') },

      // Vendors
      { path: 'vendors', Component: VendorsPage },
      { path: 'vendors/:vendorId', Component: VendorDetailPage },

      // Assets
      { path: 'assets/inventory/:id', Component: AssetDetailPage },
      { path: 'assets/inventory', Component: InventoryPage },
      { path: 'assets/merge-review', Component: MergeReviewPage },
      { path: 'assets/code-changes', Component: CodeChangesPage },
      { path: 'assets/findings', Component: AssetsFindingsPage },
      { path: 'assets/vulnerabilities', loader: () => redirect('/assets/findings') },
      { path: 'assets/security-alerts', Component: SecurityAlertsPage },
      { path: 'assets/settings', loader: () => redirect('/settings/assets') },

      // Personnel
      { path: 'personnel/computers', Component: ComputersPage },
      { path: 'personnel/access', Component: AccessManagementPage },
      { path: 'personnel/settings', loader: () => redirect('/settings/personnel') },

      // AI
      {
        path: 'ai/chat',
        Component: AiChatPage,
      },
      {
        path: 'ai/questionnaire-assistant',
        Component: QuestionnaireAssistantPage,
      },
      {
        path: 'ai/knowledge-base',
        Component: AiDocumentsPage,
      },

      // Platform Admin (SUPER_ADMIN)
      { path: 'admin/templates', Component: AdminTemplatesPage },
      { path: 'admin/test-templates', Component: AdminTestTemplatesPage },
      { path: 'admin/policy-templates', Component: AdminPolicyTemplatesPage },
      { path: 'admin/frameworks', Component: AdminFrameworksPage },
      { path: 'admin/organizations', Component: AdminOrganizationsPage },

      // Other
      { path: 'integrations', Component: IntegrationsPage },
      {
        path: 'integrations/partner-api',
        loader: partnerAdminLoader,
        Component: PartnerApiPage,
      },
      { path: 'my-security-tasks', Component: MySecurityTasksPage },

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
]);

// Re-export Suspense for convenience (used in Layout to wrap <Outlet />)
export { Suspense };
