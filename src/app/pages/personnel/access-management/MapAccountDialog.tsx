import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Search } from 'lucide-react';
import {
  accessManagementService,
  type AccessAccount,
} from '@/services/api/access-management';

interface Props {
  account: AccessAccount;
  users: Array<{ id: string; name?: string | null; email: string }>;
  onClose: () => void;
}

export function MapAccountDialog({ account, users, onClose }: Props) {
  const { t } = useTranslation('personnel');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const filtered = users.filter(
    (u) =>
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const mapMutation = useMutation({
    mutationFn: (userId: string | null) =>
      accessManagementService.mapAccount(account.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['access-stats'] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('accessManagement.mapAccount.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {t('accessManagement.mapAccount.accountLabel')}
            </span>{' '}
            <span className="font-medium">{account.accountName}</span>
            {account.accountEmail && (
              <span className="text-muted-foreground">
                {' '}
                ({account.accountEmail})
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('accessManagement.mapAccount.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {account.mappedUserId && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b text-red-600"
                onClick={() => mapMutation.mutate(null)}
                disabled={mapMutation.isPending}
              >
                {t('accessManagement.mapAccount.removeMapping')}
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {t('accessManagement.mapAccount.noUsers')}
              </div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0 ${
                    u.id === account.mappedUserId
                      ? 'bg-primary/5 font-medium'
                      : ''
                  }`}
                  onClick={() => mapMutation.mutate(u.id)}
                  disabled={mapMutation.isPending}
                >
                  <div>{u.name ?? u.email}</div>
                  {u.name && (
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
