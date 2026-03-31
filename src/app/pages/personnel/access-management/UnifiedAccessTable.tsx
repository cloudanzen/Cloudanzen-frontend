import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  RefreshCw,
  Download,
  Search,
  Users,
  Link2,
  Unlink,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  accessManagementService,
  type AccessAccount,
  type AccountStats,
  type AccessService,
} from '@/services/api/access-management';
import { usersService } from '@/services/api/users';
import { MapAccountDialog } from './MapAccountDialog';

const PAGE_SIZE = 50;

export function UnifiedAccessTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mappingFilter, setMappingFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [mapDialogAccount, setMapDialogAccount] = useState<AccessAccount | null>(null);

  // Fetch accounts
  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['access-accounts', search, serviceFilter, statusFilter, mappingFilter, page],
    queryFn: () =>
      accessManagementService.listAccounts({
        search: search || undefined,
        serviceId: serviceFilter !== 'all' ? serviceFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        mappingStatus: mappingFilter !== 'all' ? mappingFilter : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['access-stats'],
    queryFn: () => accessManagementService.getStats(),
  });

  // Fetch services for filter dropdown
  const { data: services } = useQuery({
    queryKey: ['access-services'],
    queryFn: () => accessManagementService.listServices(),
  });

  // Fetch users for mapping
  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await usersService.listUsers();
      return Array.isArray(res) ? res : [];
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => accessManagementService.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['access-stats'] });
      queryClient.invalidateQueries({ queryKey: ['access-services'] });
    },
  });

  // Type update mutation
  const typeMutation = useMutation({
    mutationFn: ({ id, accountType }: { id: string; accountType: string }) =>
      accessManagementService.updateAccountType(id, accountType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['access-stats'] });
    },
  });

  const handleExport = useCallback(() => {
    const url = accessManagementService.getExportUrl();
    window.open(url, '_blank');
  }, []);

  const accounts = accountsData?.rows ?? [];
  const total = accountsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const safeStats: AccountStats = stats ?? { total: 0, mapped: 0, unmapped: 0, serviceAccounts: 0, byService: [] };
  const safeServices: AccessService[] = Array.isArray(services) ? services : [];

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Accounts" value={safeStats.total} icon={<Users className="w-4 h-4" />} />
        <StatCard label="Mapped" value={safeStats.mapped} icon={<Link2 className="w-4 h-4" />} color="text-green-600" />
        <StatCard label="Unmapped" value={safeStats.unmapped} icon={<Unlink className="w-4 h-4" />} color="text-amber-600" />
        <StatCard label="Service Accounts" value={safeStats.serviceAccounts} icon={<Bot className="w-4 h-4" />} />
      </div>

      {/* Service breakdown */}
      {safeStats.byService.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safeStats.byService.map((s) => (
            <Badge key={s.serviceName} variant="outline" className="text-xs">
              {s.serviceName}: {s.count}
              {s.serviceType === 'manual' && <span className="ml-1 text-muted-foreground">(manual)</span>}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>

        <Select value={serviceFilter} onValueChange={(v) => { setServiceFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {safeServices.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.serviceName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>

        <Select value={mappingFilter} onValueChange={(v) => { setMappingFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Mapping" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mapping</SelectItem>
            <SelectItem value="mapped">Mapped</SelectItem>
            <SelectItem value="unmapped">Unmapped</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Service</th>
                <th className="text-left p-3 font-medium">Account</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Role</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Mapped To</th>
                <th className="text-left p-3 font-medium w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {search || serviceFilter !== 'all' || statusFilter !== 'all' || mappingFilter !== 'all'
                      ? 'No accounts match your filters.'
                      : 'No accounts yet. Click "Sync" to pull data from integrations, or add a custom service.'}
                  </td>
                </tr>
              ) : (
                accounts.map((acct) => (
                  <tr key={acct.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {acct.serviceName ?? 'Unknown'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{acct.accountName}</div>
                      <div className="text-xs text-muted-foreground">{acct.externalAccountId}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {acct.accountEmail ?? '—'}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {acct.role ? <Badge variant="secondary" className="text-xs">{acct.role}</Badge> : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant={acct.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                        {acct.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Select
                        value={acct.accountType}
                        onValueChange={(v) => typeMutation.mutate({ id: acct.id, accountType: v })}
                      >
                        <SelectTrigger className="h-7 text-xs w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="service_account">Service Account</SelectItem>
                          <SelectItem value="external_user">External User</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      {acct.mappedUserId ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                          Mapped
                        </Badge>
                      ) : (
                        <span className="text-xs text-amber-600">Unmapped</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setMapDialogAccount(acct)}
                      >
                        {acct.mappedUserId ? 'Remap' : 'Map'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t">
            <span className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Map dialog */}
      {mapDialogAccount && (
        <MapAccountDialog
          account={mapDialogAccount}
          users={users ?? []}
          onClose={() => setMapDialogAccount(null)}
        />
      )}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={color ?? 'text-muted-foreground'}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-semibold ${color ?? ''}`}>{value}</div>
    </Card>
  );
}
