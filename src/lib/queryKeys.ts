// ─── Typed query key factory ──────────────────────────────────────────────────
//
// Centralising keys here means:
//   • No magic strings scattered across pages
//   • Prefix-based invalidation works correctly (e.g. invalidate all 'policies'
//     queries regardless of the filter params they carry)
//
export const QK = {
  // Dashboard
  complianceStats: () => ['compliance', 'stats'] as const,
  riskOverview: () => ['risks', 'overview'] as const,
  activityLog: (limit?: number) => ['activity', 'recent', limit] as const,

  // Controls
  controls: (filter?: object) => ['controls', 'list', filter] as const,

  // Policies
  policies: (filter?: object) => ['policies', 'list', filter] as const,

  // Risks
  risks: () => ['risks', 'list'] as const,
  riskCenterOverview: () => ['risks', 'overview-v2'] as const,
  riskActions: () => ['risks', 'actions'] as const,
  riskSnapshot: () => ['risks', 'snapshot'] as const,
  riskSnapshots: () => ['risks', 'snapshots', 'list'] as const,
  riskSnapshotDetail: (id: string) => ['risks', 'snapshots', id] as const,
  riskLibrary: () => ['risks', 'library'] as const,
  riskSettings: () => ['risks', 'settings'] as const,
  riskDetail: (id: string) => ['risks', 'detail', id] as const,
  riskMappings: (id: string) => ['risks', 'mappings', id] as const,

  // MDM / Computers
  mdmDevices: () => ['mdm', 'devices'] as const,
  mdmTokens: () => ['mdm', 'tokens'] as const,

  // Personnel
  users: () => ['users', 'list'] as const,

  // Assets
  assets: (filters?: Record<string, unknown>) => ['assets', 'list', filters] as const,
  assetDetail: (id: string) => ['assets', 'detail', id] as const,
  assetCoverage: () => ['assets', 'coverage'] as const,
  assetChangelog: (id: string) => ['assets', 'changelog', id] as const,
  assetDistribution: () => ['assets', 'distribution'] as const,

  // Access Management
  accessRequests: (filter?: object) => ['access', 'requests', filter] as const,
  auditLog: (filter?: object) => ['access', 'audit-log', filter] as const,

  // Onboarding
  onboardingMe: () => ['onboarding', 'me'] as const,
  onboardingUsers: () => ['onboarding', 'users'] as const,

  // Tests
  tests: (filter?: object) => ['tests', 'list', filter] as const,
  testSummary: () => ['tests', 'summary'] as const,
  testDetail: (id: string) => ['tests', 'detail', id] as const,
  testHistory: (id: string) => ['tests', 'history', id] as const,
  testRuns: (id: string) => ['tests', 'runs', id] as const,

  // Notifications
  notificationsRoot: () => ['notifications'] as const,
  notificationsUnreadCount: () => ['notifications', 'unread-count'] as const,
  notificationsInbox: (filter?: object) =>
    ['notifications', 'inbox', filter] as const,
  notificationsPreferences: () => ['notifications', 'preferences'] as const,

  // Partner API
  partnerKeys: () => ['partner', 'keys'] as const,
  partnerResults: (filter?: object) => ['partner', 'results', filter] as const,
  partnerCatalogue: () => ['partner', 'catalogue'] as const,
  toolRequests: (filter?: object) =>
    ['partner', 'tool-requests', filter] as const,

  // Findings
  findings: (filter?: object) => ['findings', 'list', filter] as const,
  findingDetail: (id: string) => ['findings', 'detail', id] as const,
  remediationActions: (findingId: string) =>
    ['findings', 'remediation', findingId] as const,

  // Audits
  audits: (filter?: object) => ['audits', 'list', filter] as const,
  auditDetail: (id: string) => ['audits', 'detail', id] as const,
  auditReport: (id: string) => ['audits', 'report', id] as const,
  auditControls: (id: string) => ['audits', 'controls', id] as const,
  auditFindings: (auditId: string, controlId?: string) =>
    ['audits', 'findings', auditId, controlId] as const,

  // Vendors
  vendors: (filter?: object) => ['vendors', 'list', filter] as const,
  vendorDetail: (id: string) => ['vendors', 'detail', id] as const,
  integrationsStatus: () => ['integrations', 'status'] as const,

  // Frameworks
  frameworkCatalog: () => ['frameworks', 'catalog'] as const,
  orgFrameworks: () => ['frameworks', 'org', 'list'] as const,
  frameworkDetail: (slug: string) => ['frameworks', 'detail', slug] as const,
  frameworkCoverage: (slug: string) =>
    ['frameworks', 'coverage', slug] as const,
  frameworkRequirementView: (slug: string) =>
    ['frameworks', 'requirement-view', slug] as const,

  // MCP
  mcpRoot: () => ['mcp'] as const,
  mcpSettings: () => ['mcp', 'settings'] as const,
  mcpKeys: () => ['mcp', 'keys'] as const,
  mcpLogs: () => ['mcp', 'logs'] as const,
} as const;
