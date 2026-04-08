import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { useHasRole } from '@/hooks/useCurrentUser';
import { adminService, ControlTemplateDetailDto } from '@/services/api/admin';
import { Search, Plus, Trash2, ChevronRight, Loader2 } from 'lucide-react';

const DOMAIN_COLORS: Record<string, string> = {
  'Access Control': 'bg-blue-100 text-blue-800',
  'Asset Management': 'bg-green-100 text-green-800',
  'Cryptography': 'bg-purple-100 text-purple-800',
  'Business Continuity': 'bg-orange-100 text-orange-800',
  'Change Management': 'bg-yellow-100 text-yellow-800',
  'Incident Response': 'bg-red-100 text-red-800',
  'Logging and Monitoring': 'bg-cyan-100 text-cyan-800',
  'Network Security': 'bg-indigo-100 text-indigo-800',
  'Physical Security': 'bg-amber-100 text-amber-800',
  'People Security': 'bg-pink-100 text-pink-800',
  'Policy and Governance': 'bg-slate-100 text-slate-800',
  'Risk Management': 'bg-rose-100 text-rose-800',
  'Data Protection': 'bg-violet-100 text-violet-800',
  'Vulnerability Management': 'bg-teal-100 text-teal-800',
};

function domainBadge(domain: string) {
  const cls = DOMAIN_COLORS[domain] ?? 'bg-gray-100 text-gray-800';
  return <Badge className={cls}>{domain}</Badge>;
}

export function AdminTemplatesPage() {
  const isSuperAdmin = useHasRole('SUPER_ADMIN');
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: () => adminService.listTemplates(),
    enabled: isSuperAdmin,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'templates', selectedId],
    queryFn: () => adminService.getTemplate(selectedId!),
    enabled: !!selectedId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      setSelectedId(null);
    },
  });

  if (!isSuperAdmin) {
    return (
      <PageTemplate title="Access Denied">
        <p className="text-muted-foreground">SUPER_ADMIN role required.</p>
      </PageTemplate>
    );
  }

  const list = templates?.data ?? [];
  const filtered = list.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.referenceCode.toLowerCase().includes(search.toLowerCase()) ||
      t.domain.toLowerCase().includes(search.toLowerCase()),
  );

  const domains = [...new Set(list.map((t) => t.domain))].sort();

  return (
    <PageTemplate
      title="Control Template Library"
      description="Manage the platform-wide control templates that get deployed to customer organizations on framework activation."
      actions={
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Template
        </Button>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{list.length}</div>
            <div className="text-xs text-muted-foreground">Total Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{domains.length}</div>
            <div className="text-xs text-muted-foreground">Domains</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{list.reduce((s, t) => s + t.mappingCount, 0)}</div>
            <div className="text-xs text-muted-foreground">Total Mappings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">4</div>
            <div className="text-xs text-muted-foreground">Frameworks</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading templates...
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className={`cursor-pointer hover:border-primary/50 transition-colors ${selectedId === t.id ? 'border-primary' : ''}`}
              onClick={() => setSelectedId(t.id)}
            >
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="font-mono text-xs text-muted-foreground w-24 shrink-0">
                  {t.referenceCode}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                </div>
                {domainBadge(t.domain)}
                <Badge variant="outline">{t.mappingCount} mappings</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No templates found.</p>
          )}
        </div>
      )}

      {/* Detail panel */}
      <TemplateDetailDialog
        detail={detail?.data ?? null}
        loading={detailLoading}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        onDelete={(id) => {
          if (confirm('Delete this template and all its mappings?')) {
            deleteMutation.mutate(id);
          }
        }}
      />

      {/* Create dialog */}
      <CreateTemplateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
          setShowCreate(false);
        }}
      />
    </PageTemplate>
  );
}

// ── Detail Dialog ─────────────────────────────────────────────────────────────

function TemplateDetailDialog({
  detail,
  loading,
  open,
  onClose,
  onDelete,
}: {
  detail: ControlTemplateDetailDto | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {loading || !detail ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{detail.referenceCode}</span>
                {detail.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Description</div>
                <p className="text-sm text-muted-foreground">{detail.description}</p>
              </div>

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-medium">Domain:</span>{' '}
                  {domainBadge(detail.domain)}
                </div>
                <div>
                  <span className="font-medium">Frequency:</span>{' '}
                  <Badge variant="outline">{detail.defaultFrequency}</Badge>
                </div>
              </div>

              {detail.testGuidance && (
                <div>
                  <div className="text-sm font-medium mb-1">Test Guidance</div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{detail.testGuidance}</p>
                </div>
              )}

              <div>
                <div className="text-sm font-medium mb-2">
                  Framework Requirement Mappings ({detail.mappings.length})
                </div>
                {detail.mappings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No mappings yet.</p>
                ) : (
                  <div className="border rounded divide-y max-h-60 overflow-y-auto">
                    {detail.mappings.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <Badge variant="outline" className="shrink-0">{m.frameworkSlug}</Badge>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">{m.requirementCode}</span>
                        <span className="truncate flex-1">{m.requirementTitle}</span>
                        <Badge className="text-xs">{m.mappingStrength}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="destructive" size="sm" onClick={() => onDelete(detail.id)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Create Dialog ─────────────────────────────────────────────────────────────

function CreateTemplateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    referenceCode: '',
    title: '',
    description: '',
    domain: '',
    testGuidance: '',
    defaultFrequency: 'quarterly',
  });

  const mutation = useMutation({
    mutationFn: () => adminService.createTemplate(form),
    onSuccess: () => {
      setForm({ referenceCode: '', title: '', description: '', domain: '', testGuidance: '', defaultFrequency: 'quarterly' });
      onCreated();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Control Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Reference Code</label>
            <Input placeholder="CT-AC-XXX" value={form.referenceCode} onChange={(e) => setForm({ ...form, referenceCode: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Domain</label>
            <Input placeholder="Access Control" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Test Guidance</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={2}
              value={form.testGuidance}
              onChange={(e) => setForm({ ...form, testGuidance: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Frequency</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.defaultFrequency}
              onChange={(e) => setForm({ ...form, defaultFrequency: e.target.value })}
            >
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.referenceCode || !form.title || !form.domain || !form.description}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
