import React from 'react';
import { CheckCircle2, Clock, Edit3, AlertCircle, FileText } from 'lucide-react';
import { getStatusColors } from '@/app/theme/semantic-colors';

// ── Types ─────────────────────────────────────────────────────────────────

export interface PolicyFilter {
  search: string;
  status: string;
}

export type SortKey = 'name' | 'version' | 'status' | 'createdAt';

export const POLICY_STATUSES = ['PUBLISHED', 'DRAFT', 'REVIEW', 'ARCHIVED'] as const;

const _sc = (s: string) => getStatusColors(s);

export const STATUS_CONFIG: Record<
  string,
  { key: string; label: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  PUBLISHED: { key: 'PUBLISHED', label: 'Published',  ..._sc('PUBLISHED'), icon: CheckCircle2 },
  DRAFT:     { key: 'DRAFT',     label: 'Draft',      ..._sc('DRAFT'),     icon: Edit3 },
  REVIEW:    { key: 'REVIEW',    label: 'In Review',  ..._sc('REVIEW'),    icon: Clock },
  ARCHIVED:  { key: 'ARCHIVED',  label: 'Archived',   ..._sc('ARCHIVED'),  icon: AlertCircle },
};

export function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { key: status, label: status, ..._sc('UNKNOWN'), icon: FileText };
}
