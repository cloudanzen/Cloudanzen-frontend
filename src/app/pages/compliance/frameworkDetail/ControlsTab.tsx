import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { frameworksService, type ControlMappingDto } from '@/services/api/frameworks';
import { controlsService } from '@/services/api/controls';
import type { Control } from '@/services/api/types';
import { ShieldCheck, AlertTriangle, CheckCircle2, ThumbsUp } from 'lucide-react';
import { mappingTypeBadge, TabPlaceholder } from './shared';

export function ControlsTab({ slug }: { slug: string }) {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();

  const { data: mappingsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });
  const { data: controlsRes } = useQuery({
    queryKey: ['controls', 'framework-detail'],
    queryFn: () => controlsService.getControls({ limit: 500 }),
  });

  const controlMappings: ControlMappingDto[] = mappingsRes?.data?.controls ?? [];
  const controlsById = new Map(((controlsRes?.data ?? []) as Control[]).map((c) => [c.id, c]));

  const confirmMutation = useMutation({
    mutationFn: (mapping: ControlMappingDto) =>
      frameworksService.confirmMapping(slug, { mappingType: 'control', mappingId: mapping.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['frameworks', 'mappings', slug] });
      qc.invalidateQueries({ queryKey: ['frameworks', 'coverage', slug] });
    },
  });

  if (isLoading) return <TabPlaceholder icon={ShieldCheck} text={t('frameworkTabs.controls.loadingMappings')} />;

  if (controlMappings.length === 0) {
    return (
      <TabPlaceholder
        icon={ShieldCheck}
        text={t('frameworkTabs.controls.noMappings')}
        sub={t('frameworkTabs.controls.noMappingsDesc')}
      />
    );
  }

  const suggested = controlMappings.filter(m => m.mappingType === 'suggested');
  const confirmed = controlMappings.filter(m => m.mappingType !== 'suggested');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{t('frameworkTabs.controls.totalMappings', { total: controlMappings.length, pending: suggested.length, confirmed: confirmed.length })}</span>
      </div>

      {suggested.length > 0 && (
        <Card className="border-amber-100">
          <CardHeader className="py-3 px-4 bg-amber-50 border-b border-amber-100">
            <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('frameworkTabs.controls.suggestedMappings', { count: suggested.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-50">
              {suggested.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-500 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {controlsById.get(mapping.controlId)?.isoReference ?? t('frameworkTabs.controls.unlinked')} · {controlsById.get(mapping.controlId)?.title ?? mapping.controlId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {controlsById.get(mapping.controlId)?.status ?? 'UNKNOWN'}
                    </Badge>
                    {mappingTypeBadge(mapping.mappingType, t)}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => confirmMutation.mutate(mapping)}
                      disabled={confirmMutation.isPending}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" /> {t('frameworkTabs.controls.confirm')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {confirmed.length > 0 && (
        <Card className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              {t('frameworkTabs.controls.confirmedMappings', { count: confirmed.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {confirmed.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-500 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {controlsById.get(mapping.controlId)?.isoReference ?? t('frameworkTabs.controls.unlinked')} · {controlsById.get(mapping.controlId)?.title ?? mapping.controlId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {controlsById.get(mapping.controlId)?.status ?? 'UNKNOWN'}
                    </Badge>
                    {mappingTypeBadge(mapping.mappingType, t)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
