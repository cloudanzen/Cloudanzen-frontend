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
  type VendorIntakeRequest,
} from '@/services/api/vendors';
import { ApiError } from '@/services/api/client';

export function VendorIntakeRequestsPage() {
  const { t } = useTranslation('vendors');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<VendorIntakeRequest | null>(null);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [category, setCategory] = useState('SaaS');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [businessCriticality, setBusinessCriticality] =
    useState<BusinessCriticality>('Business-important');
  const [dataClass, setDataClass] = useState<DataClass>('Sensitive');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: QK.vendorIntakeRequests({ status: 'PENDING' }),
    queryFn: () => vendorsService.intake.list({ status: 'PENDING' }),
  });
  const { data: orgUsers = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: () => usersService.listUsers(),
    staleTime: 5 * 60_000,
  });

  const decideMutation = useMutation({
    mutationFn: () =>
      vendorsService.intake.decide(selected!.id, {
        decision,
        reviewerNotes: reviewerNotes.trim(),
        ...(decision === 'APPROVE'
          ? {
              category: category.trim(),
              ownerUserId,
              businessCriticality,
              dataClass,
            }
          : {}),
      }),
    onSuccess: async () => {
      setSelected(null);
      setReviewerNotes('');
      toast.success(
        decision === 'APPROVE'
          ? t('intake.approvedSuccess')
          : t('intake.rejectedSuccess'),
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: QK.vendorIntakeRequests() }),
        qc.invalidateQueries({ queryKey: QK.vendors() }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('intake.decisionFailed'),
      );
    },
  });

  return (
    <PageTemplate
      title={t('intake.queueTitle')}
      description={t('intake.queueDescription')}
      actions={
        <Button variant="outline" onClick={() => navigate('/vendors')}>
          {t('detail.backToVendors')}
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>
            {t('intake.pendingRequests', { count: requests.length })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              {t('detail.loadingDescription')}
            </p>
          )}
          {!isLoading && requests.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('intake.empty')}</p>
          )}
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{request.vendorName}</p>
                <p className="text-sm text-muted-foreground">
                  {request.requester?.name ?? request.requester?.email}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {request.businessJustification}
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelected(request);
                  setDecision('APPROVE');
                  setReviewerNotes('');
                  setOwnerUserId(orgUsers[0]?.id ?? '');
                }}
              >
                {t('intake.reviewRequest')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('intake.reviewTitle')}</DialogTitle>
            <DialogDescription>{selected?.vendorName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as 'APPROVE' | 'REJECT')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="APPROVE">{t('intake.approve')}</option>
              <option value="REJECT">{t('intake.reject')}</option>
            </select>
            {decision === 'APPROVE' && (
              <>
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
              </>
            )}
            <textarea
              className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t('intake.reviewerNotes')}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t('dialog.cancel')}
            </Button>
            <Button
              disabled={
                decideMutation.isPending ||
                !reviewerNotes.trim() ||
                (decision === 'APPROVE' && (!category.trim() || !ownerUserId))
              }
              onClick={() => decideMutation.mutate()}
            >
              {decideMutation.isPending
                ? t('dialog.saving')
                : t('intake.submitDecision')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
