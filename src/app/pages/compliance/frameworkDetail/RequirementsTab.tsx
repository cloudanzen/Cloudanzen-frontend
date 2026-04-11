import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { frameworksService, type RequirementStatusDto } from '@/services/api/frameworks';
import { usersService } from '@/services/api/users';
import { toast } from 'sonner';
import { Loader2, ListChecks, User, Calendar, XCircle, CheckCircle2 } from 'lucide-react';
import { applicabilityBadge, reviewBadge, TabPlaceholder } from './shared';

export function RequirementsTab({ slug }: { slug: string }) {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const [ownerDialog, setOwnerDialog] = useState<RequirementStatusDto | null>(null);
  const [applicabilityDialog, setApplicabilityDialog] = useState<RequirementStatusDto | null>(null);
  const [applicabilityJustification, setApplicabilityJustification] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];

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
      toast.success(t('frameworkTabs.requirements.ownerAssigned'));
    },
    onError: () => toast.error(t('frameworkTabs.requirements.assignFailed')),
  });

  const applicabilityMutation = useMutation({
    mutationFn: ({ r, status, justification }: { r: RequirementStatusDto; status: 'applicable' | 'not_applicable'; justification?: string }) =>
      frameworksService.updateApplicability(r.id, { applicabilityStatus: status, justification }),
    onSuccess: () => {
      setApplicabilityDialog(null);
      setApplicabilityJustification('');
      qc.invalidateQueries({ queryKey: ['frameworks', 'org-requirements', slug] });
      qc.invalidateQueries({ queryKey: ['frameworks', 'coverage', slug] });
    },
  });

  if (isLoading) return <TabPlaceholder icon={ListChecks} text={t('frameworkTabs.requirements.loadingReqs')} />;

  if (reqs.length === 0) {
    return (
      <TabPlaceholder
        icon={ListChecks}
        text={t('frameworkTabs.requirements.noReqs')}
        sub={t('frameworkTabs.requirements.noReqsDesc')}
      />
    );
  }

  const byDomain = reqs.reduce<Record<string, RequirementStatusDto[]>>((acc, r) => {
    const d = r.domain ?? 'General';
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{t('frameworkTabs.requirements.reqCount', { total: reqs.length, na: reqs.filter(r => r.applicabilityStatus === 'not_applicable').length })}</span>
        <span className="text-gray-400">{t('frameworkTabs.requirements.clickHint')}</span>
      </div>

      {Object.entries(byDomain).map(([domain, items]) => (
        <Card key={domain} className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{domain}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {items.map(req => (
                <div
                  key={req.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setOwnerDialog(req);
                    setOwnerInput(req.ownerId ?? '');
                    setDueDateInput(req.dueDate ? req.dueDate.substring(0, 10) : '');
                  }}
                >
                  <span className="font-mono text-xs text-gray-400 w-16 shrink-0 mt-0.5">{req.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{req.title}</p>
                    {(req.ownerName || req.ownerId) && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> {req.ownerName ?? req.ownerId}
                        {req.dueDate && <><Calendar className="w-3 h-3 ml-1.5" /> {new Date(req.dueDate).toLocaleDateString()}</>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {reviewBadge(req.reviewStatus, t)}
                    {applicabilityBadge(req.applicabilityStatus, t)}
                    {req.applicabilityStatus === 'applicable' ? (
                      <button
                        className="text-xs text-gray-300 hover:text-gray-500 px-1"
                        onClick={e => {
                          e.stopPropagation();
                          setApplicabilityDialog(req);
                          setApplicabilityJustification(req.justification ?? '');
                        }}
                        title={t('frameworkTabs.requirements.markNA')}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="text-xs text-gray-300 hover:text-blue-500 px-1"
                        onClick={e => {
                          e.stopPropagation();
                          applicabilityMutation.mutate({ r: req, status: 'applicable' });
                        }}
                        title={t('frameworkTabs.requirements.markApplicable')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Owner assignment dialog */}
      <Dialog open={!!ownerDialog} onOpenChange={() => setOwnerDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('frameworkTabs.requirements.assignOwnerTitle')}</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">{ownerDialog?.code}</span>{' '}
              {ownerDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label htmlFor="owner" className="text-sm font-medium">{t('frameworkTabs.requirements.owner')}</Label>
              <select
                id="owner"
                value={ownerInput}
                onChange={e => setOwnerInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('frameworkTabs.requirements.selectUser')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium">{t('frameworkTabs.requirements.dueDate')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDateInput}
                onChange={e => setDueDateInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setOwnerDialog(null)}>{t('frameworkTabs.requirements.cancel')}</Button>
            <Button
              onClick={() => ownerDialog && ownerMutation.mutate(ownerDialog)}
              disabled={ownerMutation.isPending}
            >
              {ownerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {t('frameworkTabs.requirements.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!applicabilityDialog} onOpenChange={() => setApplicabilityDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('frameworkTabs.requirements.markNATitle')}</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">{applicabilityDialog?.code}</span>{' '}
              {applicabilityDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="na-justification" className="text-sm font-medium">{t('frameworkTabs.requirements.justification')}</Label>
            <Textarea
              id="na-justification"
              rows={4}
              value={applicabilityJustification}
              onChange={(e) => setApplicabilityJustification(e.target.value)}
              placeholder={t('frameworkTabs.requirements.justificationPlaceholder')}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setApplicabilityDialog(null)}>{t('frameworkTabs.requirements.cancel')}</Button>
            <Button
              onClick={() => applicabilityDialog && applicabilityMutation.mutate({
                r: applicabilityDialog,
                status: 'not_applicable',
                justification: applicabilityJustification.trim(),
              })}
              disabled={applicabilityMutation.isPending || !applicabilityJustification.trim()}
            >
              {applicabilityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {t('frameworkTabs.requirements.saveExclusion')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
