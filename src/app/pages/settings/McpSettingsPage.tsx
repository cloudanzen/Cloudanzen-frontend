import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Copy,
  Eye,
  EyeOff,
  Key,
  Link,
  Loader2,
  Plus,
  ScrollText,
  Trash2,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import {
  mcpService,
  type McpApiKey,
  type McpExecutionLog,
} from '@/services/api/mcp';
import { ApiError } from '@/services/api/client';
import { fmtDate, fmtDateTime } from '@/lib/format-date';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

// ── MCP Settings Page ────────────────────────────────────────────────────────

export function McpSettingsPage() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const settingsQuery = useQuery({
    queryKey: QK.mcpSettings(),
    queryFn: () => mcpService.getSettings(),
  });

  const keysQuery = useQuery({
    queryKey: QK.mcpKeys(),
    queryFn: () => mcpService.listKeys(),
  });

  const logsQuery = useQuery({
    queryKey: QK.mcpLogs(),
    queryFn: () => mcpService.getLogs(50),
    refetchInterval: 30_000,
  });

  const settings = settingsQuery.data;
  const keys = keysQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateSettings = useMutation({
    mutationFn: mcpService.updateSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK.mcpSettings() });
      toast.success(t('mcp.updated'));
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : t('mcp.updateFailed'));
    },
  });

  const revokeKey = useMutation({
    mutationFn: mcpService.revokeKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK.mcpKeys() });
      toast.success(t('mcp.keyRevoked'));
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : t('mcp.revokeFailed'));
    },
  });

  const toggleSetting = useCallback(
    (field: 'enabled' | 'allowMutations' | 'allowScans', value: boolean) => {
      updateSettings.mutate({ [field]: value });
    },
    [updateSettings],
  );

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(t('mcp.copied'));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const MCP_SERVER_URL = 'https://api.cloudanzen.com/api/mcp';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Connection Info ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Link className="w-4 h-4 text-blue-600" />
            {t('mcp.serverUrl')}
          </CardTitle>
          <CardDescription>{t('mcp.serverDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-mono text-gray-800 select-all">
              {MCP_SERVER_URL}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => copyToClipboard(MCP_SERVER_URL)}
            >
              <Copy className="w-3.5 h-3.5" />
              {t('mcp.copy')}
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-500">{t('mcp.serverHint')}</p>
        </CardContent>
      </Card>

      {/* ── Enable / Disable ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            MCP Access
          </CardTitle>
          <CardDescription>
            Allow AI agents (Claude, GPT, etc.) to query your ISMS data via the
            Model Context Protocol.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ToggleRow
            id="mcp-enabled"
            label="Enable MCP"
            description="When enabled, AI agents can authenticate with an MCP API key and call read tools."
            checked={settings?.enabled ?? false}
            onCheckedChange={(v) => toggleSetting('enabled', v)}
            disabled={updateSettings.isPending}
          />
          <Separator />
          <ToggleRow
            id="mcp-mutations"
            label="Allow Mutations"
            description="Permit AI agents to create or update records (risks, controls, etc.). Leave off for read-only access."
            checked={settings?.allowMutations ?? false}
            onCheckedChange={(v) => toggleSetting('allowMutations', v)}
            disabled={updateSettings.isPending || !settings?.enabled}
          />
          <ToggleRow
            id="mcp-scans"
            label="Allow Scans"
            description="Permit AI agents to trigger integration scans. Jobs run asynchronously and are audited."
            checked={settings?.allowScans ?? false}
            onCheckedChange={(v) => toggleSetting('allowScans', v)}
            disabled={updateSettings.isPending || !settings?.enabled}
          />
        </CardContent>
      </Card>

      {/* ── API Keys ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4 flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              API Keys
            </CardTitle>
            <CardDescription>
              Create keys for each AI agent or integration. Keys are shown once
              on creation — store them securely.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateKey(true)}
            disabled={!settings?.enabled}
            className="gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Key
          </Button>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => (
                    <ApiKeyRow
                      key={k.id}
                      apiKey={k}
                      onRevoke={() => revokeKey.mutate(k.id)}
                      revoking={revokeKey.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Execution Logs ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-blue-600" />
            Execution Logs
          </CardTitle>
          <CardDescription>
            Recent MCP tool calls — auto-refreshes every 30 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No execution logs yet.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create Key Dialog ─────────────────────────────────────────────── */}
      <CreateKeyDialog
        open={showCreateKey}
        onOpenChange={(open) => {
          setShowCreateKey(open);
          if (!open) {
            setNewRawKey(null);
            setKeyVisible(false);
          }
        }}
        newRawKey={newRawKey}
        keyVisible={keyVisible}
        setKeyVisible={setKeyVisible}
        onCreated={(rawKey) => {
          setNewRawKey(rawKey);
          void queryClient.invalidateQueries({ queryKey: QK.mcpKeys() });
        }}
        onCopy={copyToClipboard}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

function ApiKeyRow({
  apiKey,
  onRevoke,
  revoking,
}: {
  apiKey: McpApiKey;
  onRevoke: () => void;
  revoking: boolean;
}) {
  const isRevoked = !!apiKey.revokedAt || !apiKey.isActive;
  return (
    <TableRow className={isRevoked ? 'opacity-50' : ''}>
      <TableCell className="font-medium">{apiKey.label}</TableCell>
      <TableCell>
        {isRevoked ? (
          <Badge variant="secondary">Revoked</Badge>
        ) : (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {apiKey.lastUsedAt ? fmtDateTime(apiKey.lastUsedAt) : 'Never'}
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {apiKey.expiresAt ? fmtDate(apiKey.expiresAt) : 'No expiry'}
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {fmtDate(apiKey.createdAt)}
      </TableCell>
      <TableCell>
        {!isRevoked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevoke}
            disabled={revoking}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function LogRow({ log }: { log: McpExecutionLog }) {
  const statusColor =
    log.status === 'SUCCESS'
      ? 'bg-green-50 text-green-700 border-green-200'
      : log.status === 'VALIDATION_ERROR'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{log.toolName}</TableCell>
      <TableCell>
        <Badge className={statusColor}>{log.status}</Badge>
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {log.mcpApiKey.label}
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {log.durationMs != null ? `${log.durationMs}ms` : '—'}
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {fmtDateTime(log.createdAt)}
      </TableCell>
    </TableRow>
  );
}

function CreateKeyDialog({
  open,
  onOpenChange,
  newRawKey,
  keyVisible,
  setKeyVisible,
  onCreated,
  onCopy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newRawKey: string | null;
  keyVisible: boolean;
  setKeyVisible: (v: boolean) => void;
  onCreated: (rawKey: string) => void;
  onCopy: (text: string) => Promise<void>;
}) {
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const result = await mcpService.createKey({ label: label.trim() });
      onCreated(result.data.key);
      toast.success('API key created');
      setLabel('');
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {newRawKey ? 'API Key Created' : 'Create MCP API Key'}
          </DialogTitle>
          <DialogDescription>
            {newRawKey
              ? 'Copy this key now — it will not be shown again.'
              : 'Give this key a label to identify its purpose.'}
          </DialogDescription>
        </DialogHeader>

        {newRawKey ? (
          <div className="space-y-4">
            <div className="relative">
              <Input
                readOnly
                value={keyVisible ? newRawKey : '•'.repeat(40)}
                className="font-mono text-sm pr-20"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyVisible(!keyVisible)}
                  className="h-7 w-7 p-0"
                >
                  {keyVisible ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void onCopy(newRawKey)}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                Store this key securely. You will not be able to see it again
                after closing this dialog.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="key-label">Label</Label>
              <Input
                id="key-label"
                placeholder="e.g. Claude Desktop — Dev"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1.5"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={creating || !label.trim()}
                className="gap-1.5"
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Key
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
