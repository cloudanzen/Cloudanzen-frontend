import { useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
  Shield,
  ShieldOff,
  ShieldQuestion,
  Laptop,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  UserCog,
  X,
} from 'lucide-react';
import { mdmService, ManagedDevice } from '@/services/api/mdm';
import { usersService } from '@/services/api/users';
import type { UserWithGit } from '@/services/api/users';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusIcon({
  status,
}: {
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN' | undefined;
}) {
  if (status === 'COMPLIANT')
    return <Shield className="w-4 h-4 text-green-600" />;
  if (status === 'NON_COMPLIANT')
    return <ShieldOff className="w-4 h-4 text-red-500" />;
  return <ShieldQuestion className="w-4 h-4 text-gray-400" />;
}

function ComplianceCheck({ label, value }: { label: string; value: boolean }) {
  const { t } = useTranslation('personnel');
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-gray-600">{label}</span>
      {value ? (
        <span className="flex items-center gap-1 text-green-700 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> {t('computers.pass')}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-600 font-medium">
          <XCircle className="w-3.5 h-3.5" /> {t('computers.fail')}
        </span>
      )}
    </div>
  );
}

// ─── Reassign Owner Modal ─────────────────────────────────────────────────────

interface ReassignModalProps {
  device: ManagedDevice;
  users: UserWithGit[];
  onClose: () => void;
  onSave: (deviceId: string, ownerId: string) => Promise<void>;
}

function ReassignModal({ device, users, onClose, onSave }: ReassignModalProps) {
  const { t } = useTranslation('personnel');
  const [selectedUserId, setSelectedUserId] = useState(device.ownerId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(device.id, selectedUserId);
      onClose();
    } catch (e: unknown) {
      setError(
        (e as { message?: string })?.message ?? t('computers.reassign.failed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {t('computers.reassign.title')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {device.hostname ?? device.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            {t('computers.reassign.description')}
          </p>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('computers.reassign.newOwner')}
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('computers.reassign.selectUser')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={
              saving || !selectedUserId || selectedUserId === device.ownerId
            }
          >
            {saving ? t('computers.reassign.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComputersPage() {
  const { t } = useTranslation('personnel');
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState<string | null>(null);
  const [reassignDevice, setReassignDevice] = useState<ManagedDevice | null>(
    null,
  );

  const {
    data: devicesData,
    isLoading: loading,
    isFetching,
    error: devicesError,
  } = useQuery({
    queryKey: QK.mdmDevices(),
    queryFn: async () => {
      const res = await mdmService.listDevices();
      return res.devices;
    },
    staleTime: STALE.MDM,
  });

  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      return usersService.listUsers();
    },
    staleTime: STALE.USERS,
  });

  const devices: ManagedDevice[] = devicesData ?? [];
  const users: UserWithGit[] = usersData ?? [];
  const error: string | null = devicesError
    ? ((devicesError as { message?: string })?.message ??
      t('computers.failedToLoad'))
    : null;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRevoke = async (device: ManagedDevice) => {
    if (!confirm(t('computers.confirmRevoke', { name: device.name }))) return;
    setRevoking(device.id);
    try {
      await mdmService.revokeDevice(device.id);
      // Invalidate so the cache gets fresh revocation status
      qc.invalidateQueries({ queryKey: QK.mdmDevices() });
    } catch (e: unknown) {
      alert(
        (e as { message?: string })?.message ?? t('computers.failedToRevoke'),
      );
    } finally {
      setRevoking(null);
    }
  };

  const handleReassignOwner = async (deviceId: string, ownerId: string) => {
    await mdmService.reassignOwner(deviceId, ownerId);
    // Invalidate devices + onboarding data (MDM task credit may change)
    qc.invalidateQueries({ queryKey: QK.mdmDevices() });
    qc.invalidateQueries({ queryKey: ['onboarding'] });
  };

  const ownerLabel = (ownerId: string | null) => {
    if (!ownerId) return null;
    const u = users.find((u) => u.id === ownerId);
    return u ? u.name || u.email : null;
  };

  const compliant = devices.filter(
    (d) => d.compliance?.complianceStatus === 'COMPLIANT',
  ).length;
  const nonCompliant = devices.filter(
    (d) => d.compliance?.complianceStatus === 'NON_COMPLIANT',
  ).length;

  return (
    <PageTemplate
      title={t('computers.title')}
      description={t('computers.description')}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: QK.mdmDevices() })}
          disabled={isFetching}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
          />
          {t('computers.refresh')}
        </Button>
      }
    >
      {!loading && devices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            {
              label: t('computers.stats.totalDevices'),
              value: devices.length,
              color: 'text-gray-700',
            },
            {
              label: t('computers.stats.compliant'),
              value: compliant,
              color: 'text-green-700',
            },
            {
              label: t('computers.stats.nonCompliant'),
              value: nonCompliant,
              color: 'text-red-600',
            },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('computers.columns.device')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('computers.columns.os')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('computers.columns.owner')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('computers.columns.lastSeen')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('computers.columns.compliance')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('computers.columns.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('computers.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    {t('computers.loading')}
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    {t('computers.emptyPrefix')}{' '}
                    <a href="/integrations" className="text-blue-600 underline">
                      {t('computers.integrationsLink')}
                    </a>{' '}
                    {t('computers.emptySuffix')}
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isExpanded = expanded.has(device.id);
                  const cs = device.compliance?.complianceStatus;
                  const revoked = device.enrollment?.revoked;
                  const owner = ownerLabel(device.ownerId);

                  return (
                    <>
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                              <div className="text-sm font-mono font-medium text-gray-900">
                                {device.hostname ?? device.name}
                              </div>
                              {device.serialNumber && (
                                <div className="text-xs text-gray-400">
                                  {device.serialNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {device.osType === 'darwin'
                            ? 'macOS'
                            : (device.osType ?? '—')}{' '}
                          <span className="text-gray-400">
                            {device.osVersion}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {owner ?? (
                            <span className="text-gray-300 italic">
                              {t('computers.unassigned')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.enrollment?.lastSeenAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(device.enrollment.lastSeenAt)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon status={cs} />
                            <span className="text-xs font-medium text-gray-700">
                              {cs === 'COMPLIANT'
                                ? t('computers.complianceStatus.compliant')
                                : cs === 'NON_COMPLIANT'
                                  ? t('computers.complianceStatus.nonCompliant')
                                  : t('computers.complianceStatus.unknown')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={revoked ? 'destructive' : 'default'}>
                            {revoked
                              ? t('computers.deviceStatus.revoked')
                              : t('computers.deviceStatus.active')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(device.id)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              {t('computers.details')}
                            </button>
                            <button
                              onClick={() => setReassignDevice(device)}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                              title={t('computers.reassignOwner')}
                            >
                              <UserCog className="w-3.5 h-3.5" />
                            </button>
                            {!revoked && (
                              <button
                                onClick={() => handleRevoke(device)}
                                disabled={revoking === device.id}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title={t('computers.revokeDevice')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && device.compliance && (
                        <tr key={`${device.id}-detail`} className="bg-blue-50">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-0 divide-y divide-blue-100">
                              <ComplianceCheck
                                label={t('computers.checks.diskEncryption')}
                                value={device.compliance.diskEncryptionEnabled}
                              />
                              <ComplianceCheck
                                label={t('computers.checks.screenLock')}
                                value={device.compliance.screenLockEnabled}
                              />
                              <ComplianceCheck
                                label={t('computers.checks.firewall')}
                                value={device.compliance.firewallEnabled}
                              />
                              <ComplianceCheck
                                label={t('computers.checks.antivirus')}
                                value={device.compliance.antivirusEnabled}
                              />
                              <ComplianceCheck
                                label={t('computers.checks.systemIntegrity')}
                                value={device.compliance.systemIntegrityEnabled}
                              />
                              <ComplianceCheck
                                label={t('computers.checks.autoUpdates')}
                                value={device.compliance.autoUpdateEnabled}
                              />
                              <ComplianceCheck
                                label={t('computers.checks.gatekeeper')}
                                value={device.compliance.gatekeeperEnabled}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              {t('computers.lastChecked')}{' '}
                              {new Date(
                                device.compliance.lastCheckedAt,
                              ).toLocaleString()}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && devices.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
            {t('computers.managedDevices', { count: devices.length })}
          </div>
        )}
      </Card>

      {reassignDevice && (
        <ReassignModal
          device={reassignDevice}
          users={users}
          onClose={() => setReassignDevice(null)}
          onSave={handleReassignOwner}
        />
      )}
    </PageTemplate>
  );
}
