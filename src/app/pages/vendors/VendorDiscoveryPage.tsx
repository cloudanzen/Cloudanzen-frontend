import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { QK } from '@/lib/queryKeys';
import { usersService } from '@/services/api/users';
import {
  vendorsService,
  type BusinessCriticality,
  type DataClass,
  type VendorDiscoveryCandidate,
} from '@/services/api/vendors';
import { ApiError } from '@/services/api/client';

export function VendorDiscoveryPage() {
  const { t } = useTranslation('vendors');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<VendorDiscoveryCandidate | null>(null);
  const [category, setCategory] = useState('SaaS');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [businessCriticality, setBusinessCriticality] =
    useState<BusinessCriticality>('Business-important');
  const [dataClass, setDataClass] = useState<DataClass>('Sensitive');

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: QK.vendorDiscoveryCandidates({ search, status: 'PENDING' }),
    queryFn: () =>
      vendorsService.discovery.list({
        search: search.trim() || undefined,
        status: 'PENDING',
      }),
  });
  const { data: vendors = [] } = useQuery({
    queryKey: QK.vendors(),
    queryFn: () => vendorsService.list(),
  });
  const { data: orgUsers = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: () => usersService.listUsers(),
    staleTime: 5 * 60_000,
  });

  const promoteMutation = useMutation({
    mutationFn: () =>
      vendorsService.discovery.promote(selected!.id, {
        name: vendorName.trim() || selected!.appName,
        category: category.trim(),
        ownerUserId,
        businessCriticality,
        dataClass,
      }),
    onSuccess: async () => {
      setSelected(null);
      toast.success(t('discovery.promotedSuccess'));
      await Promise.all([
        qc.invalidateQueries({ queryKey: QK.vendorDiscoveryCandidates() }),
        qc.invalidateQueries({ queryKey: QK.vendors() }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('discovery.promoteFailed'),
      );
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (candidateId: string) => vendorsService.discovery.dismiss(candidateId),
    onSuccess: async () => {
      toast.success(t('discovery.dismissedSuccess'));
      await qc.invalidateQueries({ queryKey: QK.vendorDiscoveryCandidates() });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('discovery.dismissFailed'),
      );
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({ candidateId, targetVendorId }: { candidateId: string; targetVendorId: string }) =>
      vendorsService.discovery.merge(candidateId, targetVendorId),
    onSuccess: async () => {
      toast.success(t('discovery.mergedSuccess'));
      await qc.invalidateQueries({ queryKey: QK.vendorDiscoveryCandidates() });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('discovery.mergeFailed'),
      );
    },
  });

  return (
    <PageTemplate
      title={t('discovery.title')}
      description={t('discovery.description')}
      actions={
        <Button variant="outline" onClick={() => navigate('/vendors')}>
          {t('detail.backToVendors')}
        </Button>
      }
    >
      <div className="space-y-6">
        <Input
          placeholder={t('discovery.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Card>
          <CardHeader>
            <CardTitle>
              {t('discovery.pendingCandidates', { count: candidates.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <p className="text-sm text-muted-foreground">
                {t('detail.loadingDescription')}
              </p>
            )}
            {!isLoading && candidates.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('discovery.empty')}</p>
            )}
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{candidate.appName}</p>
                  <p className="text-sm text-muted-foreground">
                    {candidate.source} •{' '}
                    {candidate.ssoEnabled
                      ? t('discovery.ssoEnabled')
                      : t('discovery.ssoUnknown')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        void mergeMutation.mutate({
                          candidateId: candidate.id,
                          targetVendorId: e.target.value,
                        });
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">{t('discovery.mergeInto')}</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => dismissMutation.mutate(candidate.id)}
                    disabled={dismissMutation.isPending || mergeMutation.isPending}
                  >
                    {t('discovery.dismiss')}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelected(candidate);
                      setVendorName(candidate.appName);
                      setOwnerUserId(orgUsers[0]?.id ?? '');
                    }}
                    disabled={dismissMutation.isPending || mergeMutation.isPending}
                  >
                    {t('discovery.promote')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('discovery.promoteTitle')}</DialogTitle>
            <DialogDescription>{selected?.appName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder={t('dialog.nameField')}
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('dialog.categoryField')}
            />
            <select
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t('dialog.ownerPlaceholder')}</option>
              {orgUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </option>
              ))}
            </select>
            <select
              value={businessCriticality}
              onChange={(e) =>
                setBusinessCriticality(e.target.value as BusinessCriticality)
              }
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="Mission-critical">{t('detail.missionCritical')}</option>
              <option value="Business-important">{t('detail.businessImportant')}</option>
              <option value="Operational">{t('detail.operational')}</option>
            </select>
            <select
              value={dataClass}
              onChange={(e) => setDataClass(e.target.value as DataClass)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="PII">PII</option>
              <option value="Sensitive">Sensitive</option>
              <option value="Internal">Internal</option>
              <option value="Public">Public</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t('dialog.cancel')}
            </Button>
            <Button
              disabled={
                promoteMutation.isPending ||
                !vendorName.trim() ||
                !category.trim() ||
                !ownerUserId
              }
              onClick={() => promoteMutation.mutate()}
            >
              {promoteMutation.isPending
                ? t('dialog.creating')
                : t('discovery.promote')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
