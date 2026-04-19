import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { frameworksService, type TestMappingDto } from '@/services/api/frameworks';
import { testsService, type TestRecord } from '@/services/api/tests';
import { FlaskConical } from 'lucide-react';
import { TabPlaceholder } from './shared';

export function TestsTab({ slug }: { slug: string }) {
  const { t } = useTranslation('compliance');
  const { data: mappingsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });
  const { data: testsRes } = useQuery({
    queryKey: ['tests', 'framework-detail'],
    queryFn: () => testsService.listTests({ page: 1, limit: 500 }),
  });

  const testMappings: TestMappingDto[] = mappingsRes?.data?.tests ?? [];
  const testsById = new Map(((testsRes?.data ?? []) as TestRecord[]).map((t) => [t.id, t]));

  if (isLoading) return <TabPlaceholder icon={FlaskConical} text={t('frameworkTabs.tests.loadingTests')} />;

  if (testMappings.length === 0) {
    return (
      <TabPlaceholder
        icon={FlaskConical}
        text={t('frameworkTabs.tests.noTests')}
        sub={t('frameworkTabs.tests.noTestsDesc')}
      />
    );
  }

  const byDomain = testMappings.reduce<Record<string, TestMappingDto[]>>((acc, m) => {
    const d = m.requirementDomain ?? 'General';
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-xs text-gray-500">{t('frameworkTabs.tests.testCount', { count: testMappings.length, domains: Object.keys(byDomain).length })}</div>

      {Object.entries(byDomain).map(([domain, items]) => (
        <Card key={domain} className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{domain}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {items.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <FlaskConical className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-700 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-500">{testsById.get(mapping.testId)?.name ?? mapping.testId}</p>
                    <p className="text-xs text-gray-400">
                      {t('frameworkTabs.tests.lastResult')}: {testsById.get(mapping.testId)?.lastResult ?? 'Not_Run'} · {t('frameworkTabs.tests.evidence')}: {testsById.get(mapping.testId)?.evidences?.length ?? 0}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{new Date(mapping.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
