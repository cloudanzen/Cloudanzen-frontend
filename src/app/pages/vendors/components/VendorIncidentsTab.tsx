import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/app/components/ui/select';
import { QK } from '@/lib/queryKeys';
import {
  VendorIncidentKind,
  CreateVendorIncidentInput,
  vendorsService,
} from '@/services/api/vendors';

const KINDS: VendorIncidentKind[] = ['BREACH', 'OUTAGE', 'SUBPROCESSOR_CHANGE', 'OTHER'];

const kindClass: Record<VendorIncidentKind, string> = {
  BREACH:              'bg-red-100 text-red-700',
  OUTAGE:              'bg-orange-100 text-orange-700',
  SUBPROCESSOR_CHANGE: 'bg-amber-100 text-amber-700',
  OTHER:               'bg-gray-100 text-gray-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function emptyForm(): CreateVendorIncidentInput {
  return { kind: 'OTHER', summary: '', occurredAt: new Date().toISOString().slice(0, 10), scoreDelta: 0 };
}

export function VendorIncidentsTab({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation('vendors');
  const qc = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: QK.vendorIncidents(vendorId),
    queryFn: () => vendorsService.incidents.list(vendorId),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateVendorIncidentInput>(emptyForm());

  const createMutation = useMutation({
    mutationFn: () => vendorsService.incidents.create(vendorId, {
      ...form,
      occurredAt: new Date(form.occurredAt).toISOString(),
    }),
    onSuccess: () => {
      toast.success(t('incidents.created'));
      qc.invalidateQueries({ queryKey: QK.vendorIncidents(vendorId) });
      qc.invalidateQueries({ queryKey: QK.vendor(vendorId) });
      setOpen(false);
      setForm(emptyForm());
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('incidents.createFailed')),
  });

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t('incidents.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('incidents.log')}
        </Button>
      </div>

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t('incidents.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {incidents.map((inc) => (
            <Card key={inc.id}>
              <CardContent className="flex items-start justify-between gap-3 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={kindClass[inc.kind]}>
                      {inc.kind.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{fmtDate(inc.occurredAt)}</span>
                    {inc.scoreDelta !== 0 && (
                      <Badge variant="outline" className={inc.scoreDelta < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
                        {inc.scoreDelta > 0 ? '+' : ''}{inc.scoreDelta} {t('incidents.score')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{inc.summary}</p>
                  {inc.sourceUrl && (
                    <a href={inc.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                      {t('incidents.source')}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('incidents.logTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('incidents.kind')}</Label>
              <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v as VendorIncidentKind }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => <SelectItem key={k} value={k}>{k.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('incidents.summary')}</Label>
              <Input value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
            </div>
            <div>
              <Label>{t('incidents.occurredAt')}</Label>
              <Input type="date" value={form.occurredAt as string} onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))} />
            </div>
            <div>
              <Label>{t('incidents.scoreDelta')}</Label>
              <Input
                type="number" min="-100" max="100"
                value={form.scoreDelta ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, scoreDelta: Number(e.target.value) }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('incidents.scoreDeltaHint')}</p>
            </div>
            <div>
              <Label>{t('incidents.sourceUrl')}</Label>
              <Input value={form.sourceUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value || null }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('incidents.cancel')}</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.summary || createMutation.isPending}>
              {createMutation.isPending ? t('incidents.saving') : t('incidents.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
