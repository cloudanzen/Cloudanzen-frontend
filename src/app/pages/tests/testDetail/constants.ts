import type { TestStatus, TestCategory } from '@/services/api/tests';

type BadgeConfig = {
  key: string;
  label: string;
  bg: string;
  text: string;
  dot: string;
};

export const STATUS_CONFIG: Record<TestStatus, BadgeConfig> = {
  OK: {
    key: 'OK',
    label: 'OK',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  Due_soon: {
    key: 'Due_soon',
    label: 'Due Soon',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Overdue: {
    key: 'Overdue',
    label: 'Overdue',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  Needs_remediation: {
    key: 'Needs_remediation',
    label: 'Needs Remediation',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
};

export const CATEGORY_COLOR: Record<TestCategory, string> = {
  Custom: 'bg-gray-100 text-gray-700',
  Engineering: 'bg-blue-100 text-blue-700',
  HR: 'bg-pink-100 text-pink-700',
  IT: 'bg-cyan-100 text-cyan-700',
  Policy: 'bg-indigo-100 text-indigo-700',
  Risks: 'bg-orange-100 text-orange-700',
};

export const LAST_RESULT_CONFIG: Record<string, BadgeConfig> = {
  Pass: {
    key: 'Pass',
    label: 'Pass',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  Fail: {
    key: 'Fail',
    label: 'Fail',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  Warning: {
    key: 'Warning',
    label: 'Warning',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Not_Run: {
    key: 'Not_Run',
    label: 'Not Run',
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    dot: 'bg-gray-300',
  },
};

export const ADMIN_ROLES = ['ORG_ADMIN', 'SUPER_ADMIN', 'SECURITY_OWNER'];
export const AUDIT_REVIEW_ROLES = [
  'AUDITOR',
  'ORG_ADMIN',
  'SUPER_ADMIN',
  'SECURITY_OWNER',
];
