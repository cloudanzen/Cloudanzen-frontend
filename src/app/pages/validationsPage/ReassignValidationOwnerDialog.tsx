import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

type OwnerOption = {
  id: string;
  name?: string | null;
  email: string;
};

export function ReassignValidationOwnerDialog({
  open,
  validationName,
  currentOwnerId,
  users,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  validationName?: string;
  currentOwnerId?: string;
  users: OwnerOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (ownerId: string) => void;
}) {
  const { t } = useTranslation('tests');
  const [ownerId, setOwnerId] = useState(currentOwnerId ?? '');

  useEffect(() => {
    setOwnerId(currentOwnerId ?? '');
  }, [currentOwnerId, open]);

  const selectedUser = users.find((user) => user.id === ownerId);
  const disabled =
    saving || !ownerId || ownerId === currentOwnerId || users.length === 0;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('validationsPage.reassignDialog.title')}</DialogTitle>
          <DialogDescription>
            {validationName
              ? t('validationsPage.reassignDialog.description', {
                name: validationName,
              })
              : t('validationsPage.reassignDialog.descriptionFallback')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>{t('validationsPage.reassignDialog.ownerLabel')}</Label>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger>
              <SelectValue
                placeholder={t(
                  'validationsPage.reassignDialog.ownerPlaceholder',
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUser?.email ? (
            <p className="text-xs text-muted-foreground">
              {selectedUser.email}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('validationsPage.reassignDialog.cancel')}
          </Button>
          <Button disabled={disabled} onClick={() => onSubmit(ownerId)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('validationsPage.reassignDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
