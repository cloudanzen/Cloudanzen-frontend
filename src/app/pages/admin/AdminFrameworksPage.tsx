import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useHasRole } from '@/hooks/useCurrentUser';
import {
  adminService,
  FrameworkListDto,
  RequirementDto,
  RequirementMappingsDto,
} from '@/services/api/admin';
import { Search, Loader2, Plus, X } from 'lucide-react';

// ── Color maps ────────────────────────────────────────────────────────────────

const FW_COLORS: Record<string, string> = {
  'iso-27001': 'border-blue-500 bg-blue-50',
  'soc-2': 'border-green-500 bg-green-50',
  'nist-csf': 'border-purple-500 bg-purple-50',
  'hipaa': 'border-red-500 bg-red-50',
};

const DOMAIN_COLORS: Record<string, string> = {
  'Organisational controls': 'bg-blue-100 text-blue-800',
  'People controls': 'bg-pink-100 text-pink-800',
  'Physical controls': 'bg-amber-100 text-amber-800',
  'Technological controls': 'bg-purple-100 text-purple-800',
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

function domainBadge(domain: string | null) {
  if (!domain) return <Badge className="bg-gray-100 text-gray-800">--</Badge>;
  const cls = DOMAIN_COLORS[domain] ?? 'bg-gray-100 text-gray-800';
  return <Badge className={cls}>{domain}</Badge>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminFrameworksPage() {
  const { t } = useTranslation('admin');
  const isSuperAdmin = useHasRole('SUPER_ADMIN');
  const qc = useQueryClient();
  const [selectedFramework, setSelectedFramework] = useState<FrameworkListDto | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementDto | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: frameworks, isLoading: frameworksLoading } = useQuery({
    queryKey: ['admin', 'frameworks'],
    queryFn: () => adminService.listFrameworks(),
    enabled: isSuperAdmin,
  });

  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['admin', 'frameworks', selectedFramework?.id, 'requirements'],
    queryFn: () => adminService.listRequirements(selectedFramework!.id),
    enabled: !!selectedFramework,
  });

  if (!isSuperAdmin) {
    return (
      <PageTemplate title={t('common.accessDenied')}>
        <p className="text-muted-foreground">{t('common.superAdminRequired')}</p>
      </PageTemplate>
    );
  }

  const fwList = frameworks?.data ?? [];
  const reqList = requirements?.data ?? [];
  const filtered = reqList.filter(
    (r) =>
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.domain ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageTemplate
      title={t('frameworks.title')}
      description={t('frameworks.description')}
    >
      {/* Framework selector cards */}
      {frameworksLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading frameworks...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {fwList.map((fw) => {
            const colorCls = FW_COLORS[fw.slug] ?? 'border-gray-400 bg-gray-50';
            const isSelected = selectedFramework?.id === fw.id;
            return (
              <Card
                key={fw.id}
                className={`cursor-pointer border-2 transition-colors ${colorCls} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-md'}`}
                onClick={() => {
                  setSelectedFramework(fw);
                  setSearch('');
                  setSelectedRequirement(null);
                }}
              >
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="font-semibold text-foreground">{fw.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Version {fw.version}
                  </div>
                  <div className="text-sm font-medium mt-2">
                    {fw.requirementCount} requirements
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Requirements table */}
      {selectedFramework && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {selectedFramework.name} Requirements
            </h2>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('frameworks.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {requirementsLoading ? (
            <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading requirements...
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-4 py-3 font-medium">Code</th>
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium">Domain</th>
                    <th className="text-center px-4 py-3 font-medium">Controls</th>
                    <th className="text-center px-4 py-3 font-medium">Tests</th>
                    <th className="text-center px-4 py-3 font-medium">Policies</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((req) => (
                    <tr
                      key={req.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedRequirement(req)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {req.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-md">{req.title}</div>
                      </td>
                      <td className="px-4 py-3">{domainBadge(req.domain)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{req.controlTemplateCount}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{req.testTemplateCount}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{req.policyTemplateCount}</Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted-foreground py-8">
                        No requirements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Requirement detail dialog */}
      {selectedRequirement && selectedFramework && (
        <RequirementDetailDialog
          key={selectedRequirement.id}
          frameworkId={selectedFramework.id}
          requirement={selectedRequirement}
          open={!!selectedRequirement}
          onClose={() => setSelectedRequirement(null)}
          onMappingChanged={() => {
            qc.invalidateQueries({
              queryKey: ['admin', 'frameworks', selectedFramework.id, 'requirements'],
            });
          }}
        />
      )}
    </PageTemplate>
  );
}

// ── Requirement Detail Dialog ─────────────────────────────────────────────────

function RequirementDetailDialog({
  frameworkId,
  requirement,
  open,
  onClose,
  onMappingChanged,
}: {
  frameworkId: string;
  requirement: RequirementDto;
  open: boolean;
  onClose: () => void;
  onMappingChanged: () => void;
}) {
  const qc = useQueryClient();
  const [addControlId, setAddControlId] = useState<string>('');
  const [addControlStrength, setAddControlStrength] = useState<string>('strong');
  const [addPolicyId, setAddPolicyId] = useState<string>('');

  const mappingsKey = ['admin', 'frameworks', 'requirement', requirement.id, 'mappings'];

  const { data: mappings, isLoading: mappingsLoading, isError: mappingsError } = useQuery({
    queryKey: mappingsKey,
    queryFn: () => adminService.getRequirementMappings(frameworkId, requirement.id),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch all control templates for the dropdown
  const { data: allControls } = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: () => adminService.listTemplates(),
    enabled: open,
  });

  // Fetch all policy templates for the dropdown
  const { data: allPolicies } = useQuery({
    queryKey: ['admin', 'policy-templates'],
    queryFn: () => adminService.listPolicyTemplates(),
    enabled: open,
  });

  const addControlMutation = useMutation({
    mutationFn: () =>
      adminService.addControlMapping(requirement.id, addControlId, addControlStrength),
    onSuccess: () => {
      setAddControlId('');
      qc.invalidateQueries({ queryKey: mappingsKey });
      onMappingChanged();
    },
  });

  const removeControlMutation = useMutation({
    mutationFn: (mappingId: string) => adminService.removeControlMapping(mappingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mappingsKey });
      onMappingChanged();
    },
  });

  const addPolicyMutation = useMutation({
    mutationFn: () => adminService.addPolicyMapping(requirement.id, addPolicyId),
    onSuccess: () => {
      setAddPolicyId('');
      qc.invalidateQueries({ queryKey: mappingsKey });
      onMappingChanged();
    },
  });

  const removePolicyMutation = useMutation({
    mutationFn: (mappingId: string) => adminService.removePolicyMapping(mappingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mappingsKey });
      onMappingChanged();
    },
  });

  const m: RequirementMappingsDto = mappings?.data ?? { controls: [], tests: [], policies: [] };

  // Filter out already-mapped items from dropdowns
  const mappedControlIds = new Set(m.controls.map((c) => c.id));
  const availableControls = (allControls?.data ?? []).filter(
    (ct) => !mappedControlIds.has(ct.id),
  );

  const mappedPolicyIds = new Set(m.policies.map((p) => p.id));
  const availablePolicies = (allPolicies?.data ?? []).filter(
    (pt) => !mappedPolicyIds.has(pt.id),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {requirement.code}
            </span>
            {requirement.title}
          </DialogTitle>
        </DialogHeader>
        {mappingsLoading ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading mappings...
          </div>
        ) : mappingsError ? (
          <div className="py-8 text-center text-sm text-destructive">
            Failed to load mappings. Please close and try again.
          </div>
        ) : (
          <>

            <div className="space-y-6">
              {/* Requirement meta */}
              <div className="space-y-2">
                {requirement.domain && (
                  <div className="text-sm">
                    <span className="font-medium">Domain:</span>{' '}
                    {domainBadge(requirement.domain)}
                  </div>
                )}
                {requirement.description && (
                  <div>
                    <div className="text-sm font-medium mb-1">Description</div>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {requirement.description}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Control Templates ─────────────────────────────────────────── */}
              <div>
                <div className="text-sm font-medium mb-2">
                  Control Templates ({m.controls.length})
                </div>
                {m.controls.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No control templates mapped.</p>
                ) : (
                  <div className="border rounded divide-y max-h-48 overflow-y-auto">
                    {m.controls.map((c) => (
                      <div key={c.mappingId} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {c.referenceCode}
                        </span>
                        <span className="truncate flex-1">{c.title}</span>
                        {domainBadge(c.domain)}
                        <Badge className="text-xs">{c.mappingStrength}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeControlMutation.mutate(c.mappingId)}
                          disabled={removeControlMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add control mapping */}
                <div className="flex items-center gap-2 mt-2">
                  <Select value={addControlId} onValueChange={setAddControlId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select control template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableControls.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id}>
                          {ct.referenceCode} - {ct.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={addControlStrength} onValueChange={setAddControlStrength}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strong">Strong</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="weak">Weak</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => addControlMutation.mutate()}
                    disabled={!addControlId || addControlMutation.isPending}
                  >
                    {addControlMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              </div>

              {/* ── Test Templates (read-only) ───────────────────────────────── */}
              <div>
                <div className="text-sm font-medium mb-2">
                  Test Templates ({m.tests.length})
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    (linked through control templates)
                  </span>
                </div>
                {m.tests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No test templates linked.</p>
                ) : (
                  <div className="border rounded divide-y max-h-48 overflow-y-auto">
                    {m.tests.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="truncate flex-1">{t.name}</span>
                        <Badge variant="outline">{t.category}</Badge>
                        <Badge variant="outline">{t.testType}</Badge>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {t.controlRef}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Policy Templates ──────────────────────────────────────────── */}
              <div>
                <div className="text-sm font-medium mb-2">
                  Policy Templates ({m.policies.length})
                </div>
                {m.policies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No policy templates mapped.</p>
                ) : (
                  <div className="border rounded divide-y max-h-48 overflow-y-auto">
                    {m.policies.map((p) => (
                      <div key={p.mappingId} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {p.slug}
                        </span>
                        <Badge variant="outline">{p.category}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removePolicyMutation.mutate(p.mappingId)}
                          disabled={removePolicyMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add policy mapping */}
                <div className="flex items-center gap-2 mt-2">
                  <Select value={addPolicyId} onValueChange={setAddPolicyId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select policy template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePolicies.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.name} ({pt.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => addPolicyMutation.mutate()}
                    disabled={!addPolicyId || addPolicyMutation.isPending}
                  >
                    {addPolicyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
