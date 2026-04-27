import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';

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
  VendorContact,
  VendorContactRole,
  CreateVendorContactInput,
  vendorsService,
} from '@/services/api/vendors';

const ROLES: VendorContactRole[] = [
  'SECURITY', 'ACCOUNT_MANAGER', 'PROCUREMENT', 'LEGAL', 'ENGINEERING', 'EXECUTIVE', 'OTHER',
];

function emptyForm(): CreateVendorContactInput {
  return { name: '', email: null, phone: null, role: 'OTHER', isPrimary: false, notes: null };
}

export function VendorContactsTab({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation('vendors');
  const qc = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: QK.vendorContacts(vendorId),
    queryFn: () => vendorsService.contacts.list(vendorId),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VendorContact | null>(null);
  const [form, setForm] = useState<CreateVendorContactInput>(emptyForm());

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(c: VendorContact) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      role: c.role,
      isPrimary: c.isPrimary,
      notes: c.notes,
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? vendorsService.contacts.update(vendorId, editing.id, form)
        : vendorsService.contacts.create(vendorId, form),
    onSuccess: () => {
      toast.success(editing ? t('contacts.updated') : t('contacts.created'));
      qc.invalidateQueries({ queryKey: QK.vendorContacts(vendorId) });
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('contacts.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => vendorsService.contacts.remove(vendorId, contactId),
    onSuccess: () => {
      toast.success(t('contacts.deleted'));
      qc.invalidateQueries({ queryKey: QK.vendorContacts(vendorId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('contacts.deleteFailed')),
  });

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t('contacts.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('contacts.add')}
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t('contacts.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between gap-3 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.isPrimary && (
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    )}
                    <Badge variant="outline" className="text-xs">{c.role.replace('_', ' ')}</Badge>
                  </div>
                  {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                  {c.notes && <p className="text-xs text-muted-foreground italic">{c.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('contacts.editTitle') : t('contacts.addTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('contacts.name')}</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>{t('contacts.email')}</Label>
              <Input type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))} />
            </div>
            <div>
              <Label>{t('contacts.phone')}</Label>
              <Input value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))} />
            </div>
            <div>
              <Label>{t('contacts.role')}</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as VendorContactRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="isPrimary" checked={form.isPrimary ?? false}
                onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
              />
              <Label htmlFor="isPrimary">{t('contacts.isPrimary')}</Label>
            </div>
            <div>
              <Label>{t('contacts.notes')}</Label>
              <Input value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('contacts.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? t('contacts.saving') : t('contacts.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
