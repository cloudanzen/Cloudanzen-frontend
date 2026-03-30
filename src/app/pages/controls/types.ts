export interface Control {
  id: string;
  isoReference: string;
  title: string;
  description: string;
  status: ControlStatus;
  justification?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  evidence?: Evidence[];
}

export type CreateControlRequest = Omit<Control, 'id' | 'createdAt' | 'updatedAt' | 'evidence'>;

export type UpdateControlRequest = Partial<Omit<Control, 'id' | 'createdAt' | 'updatedAt'>>;

export enum ControlStatus {
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  PARTIALLY_IMPLEMENTED = 'PARTIALLY_IMPLEMENTED',
  IMPLEMENTED = 'IMPLEMENTED',
}

export enum EvidenceType {
  FILE = 'FILE',
  URL = 'URL',
  SCREENSHOT = 'SCREENSHOT',
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  fileName?: string;
  fileUrl?: string;
  hash?: string;
  controlId: string;
  collectedBy: string;
  automated: boolean;
  createdAt: string;
}

// UI Types for Controls Page
export interface ControlFilter {
  search: string;
  status: ControlStatus | '';
  isoReference: string;
}

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  minWidth?: number;
  sortable?: boolean;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'isoReference', label: 'Reference', visible: true, minWidth: 120, sortable: true },
  { id: 'title', label: 'Title', visible: true, minWidth: 200, sortable: true },
  { id: 'description', label: 'Description', visible: true, minWidth: 300 },
  { id: 'status', label: 'Status', visible: true, minWidth: 120, sortable: true },
  { id: 'justification', label: 'Justification', visible: true, minWidth: 200 },
  { id: 'createdAt', label: 'Created Date', visible: true, minWidth: 120, sortable: true },
];