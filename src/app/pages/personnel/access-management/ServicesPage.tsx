import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Plus, Trash2, Upload, RefreshCw, Cloud, FileText } from 'lucide-react';
import {
  accessManagementService,
  type AccessService,
  type AccountStats,
} from '@/services/api/access-management';
import { AddCustomServiceDialog } from './AddCustomServiceDialog';
import { CsvUploadDialog } from './CsvUploadDialog';

export function ServicesPage() {
  const { t } = useTranslation('personnel');
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploadService, setUploadService] = useState<AccessService | null>(
    null,
  );

  const { data: services, isLoading } = useQuery({
    queryKey: ['access-services'],
    queryFn: () => accessManagementService.listServices(),
  });

  const { data: stats } = useQuery({
    queryKey: ['access-stats'],
    queryFn: () => accessManagementService.getStats(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accessManagementService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-services'] });
      queryClient.invalidateQueries({ queryKey: ['access-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['access-stats'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => accessManagementService.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-services'] });
      queryClient.invalidateQueries({ queryKey: ['access-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['access-stats'] });
    },
  });

  const safeServices: AccessService[] = Array.isArray(services) ? services : [];
  const safeStats: AccountStats = stats ?? {
    total: 0,
    mapped: 0,
    unmapped: 0,
    serviceAccounts: 0,
    byService: [],
  };
  const countByService = new Map(
    safeStats.byService.map((s) => [s.serviceName, s.count]),
  );

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        {t('accessManagement.services.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('accessManagement.services.description')}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`}
            />
            {t('accessManagement.services.syncIntegrations')}
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('accessManagement.services.addCustomService')}
          </Button>
        </div>
      </div>

      {safeServices.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>{t('accessManagement.services.empty')}</p>
          <p className="text-sm mt-1">
            {t('accessManagement.services.emptyDescription')}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeServices.map((service) => (
            <Card key={service.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {service.serviceType === 'integrated' ? (
                    <Cloud className="w-5 h-5 text-blue-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-medium text-sm">
                      {service.serviceName}
                    </h3>
                    <Badge
                      variant={
                        service.serviceType === 'integrated'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs mt-0.5"
                    >
                      {t(
                        `accessManagement.services.serviceTypes.${service.serviceType}`,
                        service.serviceType,
                      )}
                    </Badge>
                  </div>
                </div>
                {service.serviceType === 'manual' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => {
                      if (
                        confirm(
                          t('accessManagement.services.confirmDelete', {
                            name: service.serviceName,
                          }),
                        )
                      ) {
                        deleteMutation.mutate(service.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t('accessManagement.services.accounts', {
                    count: countByService.get(service.serviceName) ?? 0,
                  })}
                </span>
                {service.lastSyncedAt && (
                  <span>
                    {t('accessManagement.services.lastSynced', {
                      date: new Date(service.lastSyncedAt).toLocaleDateString(),
                    })}
                  </span>
                )}
              </div>

              {service.evidenceFileName && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {t('accessManagement.services.evidence', {
                    name: service.evidenceFileName,
                  })}
                </div>
              )}

              {service.serviceType === 'manual' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setUploadService(service)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {t('accessManagement.services.importAccounts')}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {showAddDialog && (
        <AddCustomServiceDialog onClose={() => setShowAddDialog(false)} />
      )}

      {uploadService && (
        <CsvUploadDialog
          service={uploadService}
          onClose={() => setUploadService(null)}
        />
      )}
    </div>
  );
}
