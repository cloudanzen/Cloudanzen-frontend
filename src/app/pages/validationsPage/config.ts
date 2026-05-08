import type { TestStatus, TestCategory, TestType } from '@/services/api/tests';
import { getStatusColors, getCategoryColor } from '@/app/theme/semantic-colors';

// ─── Config ───────────────────────────────────────────────────────────────────

const _sc = (status: string) => getStatusColors(status);

export const STATUS_CONFIG: Record<TestStatus, { label: string; bg: string; text: string; dot: string }> = {
  OK:                { label: 'OK',                ..._sc('OK')                },
  Due_soon:          { label: 'Due Soon',          ..._sc('Due_soon')          },
  Overdue:           { label: 'Overdue',           ..._sc('Overdue')           },
  Needs_remediation: { label: 'Needs Remediation', ..._sc('Needs_remediation') },
};

export const CATEGORY_OPTIONS: TestCategory[] = ['Custom', 'Engineering', 'HR', 'IT', 'Policy', 'Risks'];
export const STATUS_OPTIONS: TestStatus[] = ['OK', 'Due_soon', 'Overdue', 'Needs_remediation'];
export const TYPE_OPTIONS: TestType[] = ['Document', 'Automated', 'Pipeline'];

export const CATEGORY_COLOR: Record<TestCategory, string> = {
  Custom:      getCategoryColor('Custom'),
  Engineering: getCategoryColor('Engineering'),
  HR:          getCategoryColor('HR'),
  IT:          getCategoryColor('IT'),
  Policy:      getCategoryColor('Policy'),
  Risks:       getCategoryColor('Risks'),
};

// ─── Column config ────────────────────────────────────────────────────────────
export interface ColumnConfig { id: string; label: string; visible: boolean; sortable: boolean; minWidth?: number; }

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name',     label: 'Test Name', visible: true,  sortable: true,  minWidth: 220 },
  { id: 'category', label: 'Category',  visible: true,  sortable: true,  minWidth: 110 },
  { id: 'type',     label: 'Type',      visible: true,  sortable: true,  minWidth: 100 },
  { id: 'owner',    label: 'Owner',     visible: true,  sortable: false, minWidth: 140 },
  { id: 'status',   label: 'Status',    visible: true,  sortable: true,  minWidth: 140 },
  { id: 'dueDate',  label: 'Due Date',  visible: true,  sortable: true,  minWidth: 110 },
  { id: 'actions',  label: 'Actions',   visible: true,  sortable: false, minWidth: 120 },
];
