import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { frameworksService, type PolicyMappingDto } from '@/services/api/frameworks';
import { policiesService } from '@/services/api/policies';
import type { Policy } from '@/services/api/types';
import { FileText } from 'lucide-react';
import { TabPlaceholder } from './shared';

export function PoliciesTab({ slug }: { slug: string }) {
  const { t } = useTranslation('compliance');
  const { data: mappingsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });
  const { data: policiesRes } = useQuery({
    queryKey: ['policies', 'framework-detail'],
    queryFn: () => policiesService.getPolicies(),
  });

  const policyMappings: PolicyMappingDto[] = mappingsRes?.data?.policies ?? [];
  const policiesById = new Map(((policiesRes?.data ?? []) as Policy[]).map((p) => [p.id, p]));

  if (isLoading) return <TabPlaceholder icon={FileText} text={t('frameworkTabs.policies.loadingPolicies')} />;

  if (policyMappings.length === 0) {
    return (
      <TabPlaceholder
        icon={FileText}
        text={t('frameworkTabs.policies.noPolicies')}
        sub={t('frameworkTabs.policies.noPoliciesDesc')}
      />
    );
  }

  const byDomain = policyMappings.reduce<Record<string, PolicyMappingDto[]>>((acc, m) => {
    const d = m.requirementDomain ?? 'General';
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-xs text-gray-500">{t('frameworkTabs.policies.policyCount', { count: policyMappings.length })}</div>

      {Object.entries(byDomain).map(([domain, items]) => (
        <Card key={domain} className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{domain}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {items.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-700 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-500">{policiesById.get(mapping.policyId)?.name ?? mapping.policyId}</p>
                    <p className="text-xs text-gray-400">{t('frameworkTabs.policies.status')}: {policiesById.get(mapping.policyId)?.status ?? 'UNKNOWN'}</p>
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
