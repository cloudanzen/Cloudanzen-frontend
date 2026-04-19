import React from 'react';

import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import type { TFunction } from 'i18next';

// ── Badge helpers ─────────────────────────────────────────────────────────────

export function applicabilityBadge(status: string, t: TFunction) {
  if (status === 'not_applicable') return <Badge variant="outline" className="text-gray-400 border-gray-200 text-xs">{t('frameworkTabs.shared.na')}</Badge>;
  return <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">{t('frameworkTabs.shared.applicable')}</Badge>;
}

export function reviewBadge(status: string, t: TFunction) {
  if (status === 'accepted') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{t('frameworkTabs.shared.accepted')}</Badge>;
  if (status === 'in_review') return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{t('frameworkTabs.shared.inReview')}</Badge>;
  return <Badge variant="outline" className="text-gray-400 text-xs">{t('frameworkTabs.shared.notStarted')}</Badge>;
}

export function mappingTypeBadge(type: string, t: TFunction) {
  if (type === 'direct')    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{t('frameworkTabs.shared.confirmed')}</Badge>;
  if (type === 'inherited') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">{t('frameworkTabs.shared.inherited')}</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{t('frameworkTabs.shared.suggested')}</Badge>;
}

// ── Coverage Ring ─────────────────────────────────────────────────────────────

export function CoverageRing({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle
            cx="48" cy="48" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-2xl font-bold text-gray-900">{pct}%</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
}

// ── Tab Placeholder ───────────────────────────────────────────────────────────

export function TabPlaceholder({ icon: Icon, text, sub }: {
  icon: React.ElementType;
  text: string;
  sub?: string;
}) {
  return (
    <Card className="border-dashed border-gray-200 bg-gray-50">
      <CardContent className="py-16 text-center">
        <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">{text}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
