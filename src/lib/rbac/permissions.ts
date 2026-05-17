/**
 * RBAC Permission System — Enterprise GRC Standard
 *
 * Three-layer authorization model:
 *   Tenant Isolation → Role Based Access → Resource Permission Enforcement
 *
 * Permissions follow the format: resource:action
 */

// ── Permission constants ───────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Risks
  RISKS_READ: 'risks:read',
  RISKS_WRITE: 'risks:write',
  RISKS_DELETE: 'risks:delete',
  RISKS_ACCEPT: 'risks:accept', // Risk acceptance requires approval

  // Controls
  CONTROLS_READ: 'controls:read',
  CONTROLS_WRITE: 'controls:write',
  CONTROLS_DELETE: 'controls:delete',

  // Evidence
  EVIDENCE_READ: 'evidence:read',
  EVIDENCE_UPLOAD: 'evidence:upload',
  EVIDENCE_DELETE: 'evidence:delete',

  // Policies
  POLICIES_READ: 'policies:read',
  POLICIES_WRITE: 'policies:write',
  POLICIES_APPROVE: 'policies:approve',
  POLICIES_DELETE: 'policies:delete',

  // Tests
  TESTS_READ: 'tests:read',
  TESTS_WRITE: 'tests:write',
  TESTS_RUN: 'tests:run',
  TESTS_DELETE: 'tests:delete',

  // Users & Access
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage', // Invite, edit, deactivate
  USERS_ROLES_ASSIGN: 'users:roles_assign', // Assign/revoke roles

  // Integrations
  INTEGRATIONS_READ: 'integrations:read',
  INTEGRATIONS_MANAGE: 'integrations:manage',

  // Audits
  AUDITS_READ: 'audits:read',
  AUDITS_MANAGE: 'audits:manage',
  AUDITS_CONDUCT: 'audits:conduct', // Auditor-specific

  // Findings
  FINDINGS_READ: 'findings:read',
  FINDINGS_WRITE: 'findings:write',

  // Assets
  ASSETS_READ: 'assets:read',
  ASSETS_WRITE: 'assets:write',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Vendors
  VENDORS_READ: 'vendors:read',
  VENDORS_WRITE: 'vendors:write',

  // Platform / Org Admin
  ORG_SETTINGS: 'org:settings',
  ORG_BILLING: 'org:billing',
  PLATFORM_ADMIN: 'platform:admin', // Super admin only

  // Access Requests
  ACCESS_REQUESTS_READ: 'access_requests:read',
  ACCESS_REQUESTS_APPROVE: 'access_requests:approve',
  ACCESS_REQUESTS_CREATE: 'access_requests:create',

  // Audit Log
  AUDIT_LOG_READ: 'audit_log:read',

  // Risk snapshot sharing with external auditor (admin-only).
  // String value matches backend Permission.SHARE_AUDIT_ARTIFACTS.
  SNAPSHOTS_SHARE_WITH_AUDITOR: 'snapshots:share_with_auditor',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Role definitions ───────────────────────────────────────────────────────────

export type AppRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'SECURITY_OWNER'
  | 'AUDITOR'
  | 'EXTERNAL_AUDITOR'
  | 'CONTRIBUTOR'
  | 'VIEWER';

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Org Admin',
  SECURITY_OWNER: 'Security Owner',
  AUDITOR: 'Auditor',
  EXTERNAL_AUDITOR: 'External Auditor',
  CONTRIBUTOR: 'Contributor',
  VIEWER: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  SUPER_ADMIN:
    'Platform operator. Full access to all tenants and platform settings.',
  ORG_ADMIN:
    'Full control of tenant. Manages users, roles, and all compliance modules.',
  SECURITY_OWNER:
    'Owns the compliance program. Can manage all GRC content and approve policies.',
  AUDITOR: 'Read-only audit access. Can conduct audits and log findings.',
  EXTERNAL_AUDITOR: 'Scoped external auditor. Can access assigned audits only.',
  CONTRIBUTOR:
    'Can update evidence, tests, and risks. Cannot manage users or approve policies.',
  VIEWER: 'Read-only access to all compliance content.',
};

// Color/badge config per role
export const ROLE_CONFIG: Record<
  AppRole,
  { bg: string; text: string; border: string; dot: string }
> = {
  SUPER_ADMIN: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  ORG_ADMIN: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  SECURITY_OWNER: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  AUDITOR: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  EXTERNAL_AUDITOR: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
  },
  CONTRIBUTOR: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  VIEWER: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
};

// ── Permission matrix: role → granted permissions ──────────────────────────────

const P = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS) as Permission[], // All permissions

  ORG_ADMIN: [
    P.RISKS_READ,
    P.RISKS_WRITE,
    P.RISKS_DELETE,
    P.RISKS_ACCEPT,
    P.CONTROLS_READ,
    P.CONTROLS_WRITE,
    P.CONTROLS_DELETE,
    P.EVIDENCE_READ,
    P.EVIDENCE_UPLOAD,
    P.EVIDENCE_DELETE,
    P.POLICIES_READ,
    P.POLICIES_WRITE,
    P.POLICIES_APPROVE,
    P.POLICIES_DELETE,
    P.TESTS_READ,
    P.TESTS_WRITE,
    P.TESTS_RUN,
    P.TESTS_DELETE,
    P.USERS_READ,
    P.USERS_MANAGE,
    P.USERS_ROLES_ASSIGN,
    P.INTEGRATIONS_READ,
    P.INTEGRATIONS_MANAGE,
    P.AUDITS_READ,
    P.AUDITS_MANAGE,
    P.FINDINGS_READ,
    P.FINDINGS_WRITE,
    P.ASSETS_READ,
    P.ASSETS_WRITE,
    P.REPORTS_READ,
    P.REPORTS_EXPORT,
    P.VENDORS_READ,
    P.VENDORS_WRITE,
    P.ORG_SETTINGS,
    P.ACCESS_REQUESTS_READ,
    P.ACCESS_REQUESTS_APPROVE,
    P.AUDIT_LOG_READ,
    P.SNAPSHOTS_SHARE_WITH_AUDITOR,
  ],

  SECURITY_OWNER: [
    P.RISKS_READ,
    P.RISKS_WRITE,
    P.RISKS_ACCEPT,
    P.CONTROLS_READ,
    P.CONTROLS_WRITE,
    P.EVIDENCE_READ,
    P.EVIDENCE_UPLOAD,
    P.POLICIES_READ,
    P.POLICIES_WRITE,
    P.POLICIES_APPROVE,
    P.TESTS_READ,
    P.TESTS_WRITE,
    P.TESTS_RUN,
    P.USERS_READ,
    P.INTEGRATIONS_READ,
    P.INTEGRATIONS_MANAGE,
    P.AUDITS_READ,
    P.AUDITS_MANAGE,
    P.FINDINGS_READ,
    P.FINDINGS_WRITE,
    P.ASSETS_READ,
    P.ASSETS_WRITE,
    P.REPORTS_READ,
    P.REPORTS_EXPORT,
    P.VENDORS_READ,
    P.VENDORS_WRITE,
    P.ACCESS_REQUESTS_READ,
    P.ACCESS_REQUESTS_APPROVE,
    P.AUDIT_LOG_READ,
    P.SNAPSHOTS_SHARE_WITH_AUDITOR,
  ],

  AUDITOR: [
    P.RISKS_READ,
    P.CONTROLS_READ,
    P.EVIDENCE_READ,
    P.POLICIES_READ,
    P.TESTS_READ,
    P.USERS_READ,
    P.INTEGRATIONS_READ,
    P.AUDITS_READ,
    P.AUDITS_MANAGE,
    P.AUDITS_CONDUCT,
    P.FINDINGS_READ,
    P.FINDINGS_WRITE,
    P.ASSETS_READ,
    P.REPORTS_READ,
    P.REPORTS_EXPORT,
    P.VENDORS_READ,
    P.ACCESS_REQUESTS_READ,
    P.AUDIT_LOG_READ,
  ],

  EXTERNAL_AUDITOR: [
    P.CONTROLS_READ,
    P.EVIDENCE_READ,
    P.AUDITS_READ,
    P.AUDITS_CONDUCT,
    P.FINDINGS_READ,
    P.FINDINGS_WRITE,
    P.REPORTS_READ,
    P.REPORTS_EXPORT,
  ],

  CONTRIBUTOR: [
    P.RISKS_READ,
    P.RISKS_WRITE,
    P.CONTROLS_READ,
    P.EVIDENCE_READ,
    P.EVIDENCE_UPLOAD,
    P.POLICIES_READ,
    P.TESTS_READ,
    P.TESTS_WRITE,
    P.TESTS_RUN,
    P.USERS_READ,
    P.INTEGRATIONS_READ,
    P.AUDITS_READ,
    P.FINDINGS_READ,
    P.ASSETS_READ,
    P.REPORTS_READ,
    P.VENDORS_READ,
    P.ACCESS_REQUESTS_CREATE,
  ],

  VIEWER: [
    P.RISKS_READ,
    P.CONTROLS_READ,
    P.EVIDENCE_READ,
    P.POLICIES_READ,
    P.TESTS_READ,
    P.USERS_READ,
    P.INTEGRATIONS_READ,
    P.AUDITS_READ,
    P.FINDINGS_READ,
    P.ASSETS_READ,
    P.REPORTS_READ,
    P.VENDORS_READ,
    P.ACCESS_REQUESTS_CREATE,
  ],
};

// ── Helper: check if role has a permission ─────────────────────────────────────

export function roleHasPermission(
  role: AppRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// ── Permission matrix for UI display ──────────────────────────────────────────

export interface PermissionMatrixRow {
  module: string;
  permissions: {
    label: string;
    permission: Permission;
    roles: Record<AppRole, boolean>;
  }[];
}

export const PERMISSION_MATRIX: PermissionMatrixRow[] = [
  {
    module: 'Risks',
    permissions: [
      {
        label: 'Read',
        permission: P.RISKS_READ,
        roles: buildRoleMap(P.RISKS_READ),
      },
      {
        label: 'Write',
        permission: P.RISKS_WRITE,
        roles: buildRoleMap(P.RISKS_WRITE),
      },
      {
        label: 'Accept',
        permission: P.RISKS_ACCEPT,
        roles: buildRoleMap(P.RISKS_ACCEPT),
      },
      {
        label: 'Delete',
        permission: P.RISKS_DELETE,
        roles: buildRoleMap(P.RISKS_DELETE),
      },
    ],
  },
  {
    module: 'Controls',
    permissions: [
      {
        label: 'Read',
        permission: P.CONTROLS_READ,
        roles: buildRoleMap(P.CONTROLS_READ),
      },
      {
        label: 'Write',
        permission: P.CONTROLS_WRITE,
        roles: buildRoleMap(P.CONTROLS_WRITE),
      },
    ],
  },
  {
    module: 'Evidence',
    permissions: [
      {
        label: 'Read',
        permission: P.EVIDENCE_READ,
        roles: buildRoleMap(P.EVIDENCE_READ),
      },
      {
        label: 'Upload',
        permission: P.EVIDENCE_UPLOAD,
        roles: buildRoleMap(P.EVIDENCE_UPLOAD),
      },
      {
        label: 'Delete',
        permission: P.EVIDENCE_DELETE,
        roles: buildRoleMap(P.EVIDENCE_DELETE),
      },
    ],
  },
  {
    module: 'Policies',
    permissions: [
      {
        label: 'Read',
        permission: P.POLICIES_READ,
        roles: buildRoleMap(P.POLICIES_READ),
      },
      {
        label: 'Write',
        permission: P.POLICIES_WRITE,
        roles: buildRoleMap(P.POLICIES_WRITE),
      },
      {
        label: 'Approve',
        permission: P.POLICIES_APPROVE,
        roles: buildRoleMap(P.POLICIES_APPROVE),
      },
    ],
  },
  {
    module: 'Validations',
    permissions: [
      {
        label: 'Read',
        permission: P.TESTS_READ,
        roles: buildRoleMap(P.TESTS_READ),
      },
      {
        label: 'Write',
        permission: P.TESTS_WRITE,
        roles: buildRoleMap(P.TESTS_WRITE),
      },
      {
        label: 'Run',
        permission: P.TESTS_RUN,
        roles: buildRoleMap(P.TESTS_RUN),
      },
    ],
  },
  {
    module: 'Users',
    permissions: [
      {
        label: 'Read',
        permission: P.USERS_READ,
        roles: buildRoleMap(P.USERS_READ),
      },
      {
        label: 'Manage',
        permission: P.USERS_MANAGE,
        roles: buildRoleMap(P.USERS_MANAGE),
      },
      {
        label: 'Assign Roles',
        permission: P.USERS_ROLES_ASSIGN,
        roles: buildRoleMap(P.USERS_ROLES_ASSIGN),
      },
    ],
  },
  {
    module: 'Integrations',
    permissions: [
      {
        label: 'Read',
        permission: P.INTEGRATIONS_READ,
        roles: buildRoleMap(P.INTEGRATIONS_READ),
      },
      {
        label: 'Manage',
        permission: P.INTEGRATIONS_MANAGE,
        roles: buildRoleMap(P.INTEGRATIONS_MANAGE),
      },
    ],
  },
  {
    module: 'Audits',
    permissions: [
      {
        label: 'Read',
        permission: P.AUDITS_READ,
        roles: buildRoleMap(P.AUDITS_READ),
      },
      {
        label: 'Manage',
        permission: P.AUDITS_MANAGE,
        roles: buildRoleMap(P.AUDITS_MANAGE),
      },
      {
        label: 'Conduct',
        permission: P.AUDITS_CONDUCT,
        roles: buildRoleMap(P.AUDITS_CONDUCT),
      },
    ],
  },
  {
    module: 'Progress',
    permissions: [
      {
        label: 'Read',
        permission: P.REPORTS_READ,
        roles: buildRoleMap(P.REPORTS_READ),
      },
      {
        label: 'Export',
        permission: P.REPORTS_EXPORT,
        roles: buildRoleMap(P.REPORTS_EXPORT),
      },
    ],
  },
  {
    module: 'Access Requests',
    permissions: [
      {
        label: 'Create',
        permission: P.ACCESS_REQUESTS_CREATE,
        roles: buildRoleMap(P.ACCESS_REQUESTS_CREATE),
      },
      {
        label: 'Read',
        permission: P.ACCESS_REQUESTS_READ,
        roles: buildRoleMap(P.ACCESS_REQUESTS_READ),
      },
      {
        label: 'Approve',
        permission: P.ACCESS_REQUESTS_APPROVE,
        roles: buildRoleMap(P.ACCESS_REQUESTS_APPROVE),
      },
    ],
  },
  {
    module: 'Org Settings',
    permissions: [
      {
        label: 'Manage',
        permission: P.ORG_SETTINGS,
        roles: buildRoleMap(P.ORG_SETTINGS),
      },
      {
        label: 'Audit Log',
        permission: P.AUDIT_LOG_READ,
        roles: buildRoleMap(P.AUDIT_LOG_READ),
      },
    ],
  },
];

function buildRoleMap(permission: Permission): Record<AppRole, boolean> {
  const roles: AppRole[] = [
    'SUPER_ADMIN',
    'ORG_ADMIN',
    'SECURITY_OWNER',
    'AUDITOR',
    'CONTRIBUTOR',
    'VIEWER',
  ];
  return Object.fromEntries(
    roles.map((r) => [r, roleHasPermission(r, permission)]),
  ) as Record<AppRole, boolean>;
}
