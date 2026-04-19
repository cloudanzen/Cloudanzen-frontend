import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { frameworksService, type RequirementStatusDto } from '@/services/api/frameworks';
import { controlsService } from '@/services/api/controls';
import { usersService } from '@/services/api/users';
import type { Control } from '@/services/api/types';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import { reviewBadge, TabPlaceholder } from './shared';

export function GapsTab({ slug }: { slug: string }) {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const [ownerDialog, setOwnerDialog] = useState<RequirementStatusDto | null>(null);
  const [ownerInput, setOwnerInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });
  const { data: mappingsRes } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });
  const { data: controlsRes } = useQuery({
    queryKey: ['controls', 'framework-gaps'],
    queryFn: () => controlsService.getControls({ limit: 500 }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];
  const controlsById = new Map(((controlsRes?.data ?? []) as Control[]).map((c) => [c.id, c]));
  const implementedRequirementIds = new Set(
    (mappingsRes?.data?.controls ?? [])
      .filter((m) => controlsById.get(m.controlId)?.status === 'IMPLEMENTED')
      .map((m) => m.frameworkRequirementId),
  );
  const gaps = reqs.filter((req) => req.applicabilityStatus === 'applicable' && !implementedRequirementIds.has(req.frameworkRequirementId));

  const ownerMutation = useMutation({
    mutationFn: (r: RequirementStatusDto) =>
      frameworksService.updateRequirementOwner(r.id, {
        ownerId: ownerInput || null,
        dueDate: dueDateInput || null,
      }),
    onSuccess: () => {
      setOwnerDialog(null);
      qc.invalidateQueries({ queryKey: ['frameworks', 'org-requirements', slug] });
      qc.invalidateQueries({ queryKey: ['frameworks', 'coverage', slug] });
      toast.success(t('frameworkTabs.gaps.ownerAssigned'));
    },
    onError: () => toast.error(t('frameworkTabs.gaps.assignFailed')),
  });

  if (isLoading) return <TabPlaceholder icon={AlertTriangle} text={t('frameworkTabs.gaps.loadingGaps')} />;

  if (gaps.length === 0) {
    return (
      <TabPlaceholder
        icon={CheckCircle2}
        text={t('frameworkTabs.gaps.noGaps')}
        sub={t('frameworkTabs.gaps.noGapsDesc')}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{t('frameworkTabs.gaps.gapCount', { count: gaps.length })}</p>
      <Card className="border-gray-100">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {gaps.map(req => (
              <div
                key={req.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50/40 cursor-pointer transition-colors"
                onClick={() => {
                  setOwnerDialog(req);
                  setOwnerInput(req.ownerId ?? '');
                  setDueDateInput(req.dueDate ? req.dueDate.substring(0, 10) : '');
                }}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-mono text-xs text-gray-400 mr-2">{req.code}</span>
                    {req.title}
                  </p>
                  {req.domain && <p className="text-xs text-gray-400 mt-0.5">{req.domain}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {reviewBadge(req.reviewStatus, t)}
                  <Button size="sm" variant="outline" className="h-6 text-xs">
                    <User className="w-3 h-3 mr-1" /> {t('frameworkTabs.gaps.assign')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!ownerDialog} onOpenChange={() => setOwnerDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('frameworkTabs.gaps.assignTitle')}</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">{ownerDialog?.code}</span>{' '}
              {ownerDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label htmlFor="gap-owner" className="text-sm font-medium">{t('frameworkTabs.gaps.owner')}</Label>
              <select
                id="gap-owner"
                value={ownerInput}
                onChange={e => setOwnerInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('frameworkTabs.gaps.selectUser')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="gap-due" className="text-sm font-medium">{t('frameworkTabs.gaps.dueDate')}</Label>
              <Input
                id="gap-due"
                type="date"
                value={dueDateInput}
                onChange={e => setDueDateInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setOwnerDialog(null)}>{t('frameworkTabs.gaps.cancel')}</Button>
            <Button
              onClick={() => ownerDialog && ownerMutation.mutate(ownerDialog)}
              disabled={ownerMutation.isPending}
            >
              {ownerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {t('frameworkTabs.gaps.assignOwner')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
