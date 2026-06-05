import React from 'react';
import type { TFunction } from 'i18next';
import {
  AlertTriangle,
  Award,
  Info,
  FileText,
  Megaphone,
  Mail,
  FileQuestion,
  FileCheck,
  GitBranch,
  Users,
} from 'lucide-react';
import {
  TrustDocumentCategory,
  TrustAnnouncementType,
} from '@/services/api/trustCenter';

// ── Helpers ───────────────────────────────────────────────────────────────────

export const BASE_URL =
  import.meta.env.VITE_APP_URL || 'https://app.cloudanzen.com';

export function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDocCategoryLabels(
  t: TFunction<'common'>,
): Record<TrustDocumentCategory, string> {
  return {
    POLICY: t('customerTrust.documents.categoryPolicy'),
    REPORT: t('customerTrust.documents.categoryReport'),
    CERTIFICATE: t('customerTrust.documents.categoryCertificate'),
    WHITEPAPER: t('customerTrust.documents.categoryWhitepaper'),
    OTHER: t('customerTrust.documents.categoryOther'),
  };
}

export function getAnnouncementTypeMeta(
  t: TFunction<'common'>,
): Record<
  TrustAnnouncementType,
  { label: string; color: string; icon: React.ReactNode }
> {
  return {
    SECURITY_UPDATE: {
      label: t('customerTrust.announcements.typeSecurityUpdate'),
      color: 'bg-blue-50 text-blue-700',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    INCIDENT: {
      label: t('customerTrust.announcements.typeIncident'),
      color: 'bg-red-50 text-red-700',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    CERTIFICATION: {
      label: t('customerTrust.announcements.typeCertification'),
      color: 'bg-green-50 text-green-700',
      icon: <Award className="w-3 h-3" />,
    },
    GENERAL: {
      label: t('customerTrust.announcements.typeGeneral'),
      color: 'bg-gray-100 text-gray-600',
      icon: <Info className="w-3 h-3" />,
    },
  };
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

export function getTabs(t: TFunction<'common'>) {
  return [
    {
      key: 'documents',
      label: t('customerTrust.trustCenter.tabs.documents'),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      key: 'announcements',
      label: t('customerTrust.trustCenter.tabs.announcements'),
      icon: <Megaphone className="w-4 h-4" />,
    },
    {
      key: 'access-requests',
      label: t('customerTrust.trustCenter.tabs.accessRequests'),
      icon: <Mail className="w-4 h-4" />,
    },
    {
      key: 'questionnaires',
      label: t('customerTrust.trustCenter.tabs.questionnaires'),
      icon: <FileQuestion className="w-4 h-4" />,
    },
    {
      key: 'ndas',
      label: 'NDAs',
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      key: 'rules',
      label: 'Auto-approval',
      icon: <GitBranch className="w-4 h-4" />,
    },
    {
      key: 'subscribers',
      label: 'Subscribers',
      icon: <Users className="w-4 h-4" />,
    },
  ] as const;
}
export type TabKey = ReturnType<typeof getTabs>[number]['key'];
