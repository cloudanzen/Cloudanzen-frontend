import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart2,
  TrendingUp,
  Shield,
  ClipboardList,
  FileCheck,
  Users,
  BookOpen,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';

// ─── Report catalog definition ────────────────────────────────────────────────

interface ReportDef {
  id: string;
  nameKey: string;
  descriptionKey: string;
  periodKey?: string;
  icon: React.ReactNode;
  iconBg: string;
  categoryKey: string;
  viewPath: string;
}

const REPORTS: ReportDef[] = [
  {
    id: 'monthly-overview',
    nameKey: 'catalog.monthlyOverview.name',
    descriptionKey: 'catalog.monthlyOverview.description',
    periodKey: 'catalog.monthlyOverview.period',
    icon: <Calendar className="w-5 h-5" />,
    iconBg: 'bg-blue-100 text-blue-600',
    categoryKey: 'overview',
    viewPath: '/progress/viewer/monthly-overview',
  },
  {
    id: 'quarterly-overview',
    nameKey: 'catalog.quarterlyOverview.name',
    descriptionKey: 'catalog.quarterlyOverview.description',
    periodKey: 'catalog.quarterlyOverview.period',
    icon: <TrendingUp className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 text-indigo-600',
    categoryKey: 'overview',
    viewPath: '/progress/viewer/quarterly-overview',
  },
  {
    id: 'framework-progress',
    nameKey: 'catalog.frameworkProgress.name',
    descriptionKey: 'catalog.frameworkProgress.description',
    icon: <BarChart2 className="w-5 h-5" />,
    iconBg: 'bg-violet-100 text-violet-600',
    categoryKey: 'compliance',
    viewPath: '/progress/viewer/framework-progress',
  },
  {
    id: 'risk-register',
    nameKey: 'catalog.riskRegister.name',
    descriptionKey: 'catalog.riskRegister.description',
    periodKey: 'catalog.riskRegister.period',
    icon: <Shield className="w-5 h-5" />,
    iconBg: 'bg-red-100 text-red-600',
    categoryKey: 'risk',
    viewPath: '/progress/viewer/risk-register',
  },
  {
    id: 'test-effectiveness',
    nameKey: 'catalog.testEffectiveness.name',
    descriptionKey: 'catalog.testEffectiveness.description',
    icon: <ClipboardList className="w-5 h-5" />,
    iconBg: 'bg-amber-100 text-amber-600',
    categoryKey: 'tests',
    viewPath: '/progress/viewer/test-effectiveness',
  },
  {
    id: 'audit-status',
    nameKey: 'catalog.auditStatus.name',
    descriptionKey: 'catalog.auditStatus.description',
    icon: <BookOpen className="w-5 h-5" />,
    iconBg: 'bg-cyan-100 text-cyan-600',
    categoryKey: 'audit',
    viewPath: '/progress/viewer/audit-status',
  },
  {
    id: 'evidence-coverage',
    nameKey: 'catalog.evidenceCoverage.name',
    descriptionKey: 'catalog.evidenceCoverage.description',
    icon: <FileCheck className="w-5 h-5" />,
    iconBg: 'bg-green-100 text-green-600',
    categoryKey: 'compliance',
    viewPath: '/progress/viewer/evidence-coverage',
  },
  {
    id: 'personnel-compliance',
    nameKey: 'catalog.personnelCompliance.name',
    descriptionKey: 'catalog.personnelCompliance.description',
    icon: <Users className="w-5 h-5" />,
    iconBg: 'bg-pink-100 text-pink-600',
    categoryKey: 'personnel',
    viewPath: '/progress/viewer/personnel-compliance',
  },
];

const CATEGORY_KEYS = [
  'all',
  ...Array.from(new Set(REPORTS.map((report) => report.categoryKey))),
];

const CATEGORY_BADGE: Record<string, string> = {
  overview: 'bg-blue-50 text-blue-700',
  compliance: 'bg-violet-50 text-violet-700',
  risk: 'bg-red-50 text-red-700',
  tests: 'bg-amber-50 text-amber-700',
  audit: 'bg-cyan-50 text-cyan-700',
  personnel: 'bg-pink-50 text-pink-700',
};

// ─── Report card ──────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: ReportDef }) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <Card className="flex flex-col p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${report.iconBg}`}
        >
          {report.icon}
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[report.categoryKey] ?? 'bg-gray-50 text-gray-600'}`}
        >
          {t(`progress.categories.${report.categoryKey}`)}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">
        {t(`progress.${report.nameKey}`)}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">
        {t(`progress.${report.descriptionKey}`)}
      </p>
      {report.periodKey && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {t(`progress.${report.periodKey}`)}
        </div>
      )}
      <div className="mt-4">
        <button
          onClick={() => navigate(report.viewPath)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium transition-colors"
        >
          {t('progress.viewReport')} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProgressPage() {
  const { t } = useTranslation('common');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered =
    activeCategory === 'all'
      ? REPORTS
      : REPORTS.filter((report) => report.categoryKey === activeCategory);

  return (
    <PageTemplate
      title={t('progress.title')}
      description={t('progress.description')}
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            labelKey: 'stats.availableReports',
            value: REPORTS.length,
            color: 'text-gray-800',
          },
          {
            labelKey: 'categories.overview',
            value: REPORTS.filter((report) => report.categoryKey === 'overview')
              .length,
            color: 'text-blue-700',
          },
          {
            labelKey: 'categories.compliance',
            value: REPORTS.filter(
              (report) => report.categoryKey === 'compliance',
            ).length,
            color: 'text-violet-700',
          },
          {
            labelKey: 'stats.riskAndAudit',
            value: REPORTS.filter((report) =>
              ['risk', 'audit'].includes(report.categoryKey),
            ).length,
            color: 'text-red-700',
          },
        ].map((stat) => (
          <Card key={stat.labelKey} className="p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {t(`progress.${stat.labelKey}`)}
            </div>
          </Card>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORY_KEYS.map((categoryKey) => (
          <button
            key={categoryKey}
            onClick={() => setActiveCategory(categoryKey)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === categoryKey
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {t(`progress.categories.${categoryKey}`)}
          </button>
        ))}
      </div>

      {/* Report grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </PageTemplate>
  );
}
