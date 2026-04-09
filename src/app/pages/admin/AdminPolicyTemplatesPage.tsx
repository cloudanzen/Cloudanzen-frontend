import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
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
import { adminService, PolicyTemplateDetailDto } from '@/services/api/admin';
import { Search, Loader2, FileText, ChevronRight } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Governance: 'bg-blue-100 text-blue-800',
  'Access Control': 'bg-indigo-100 text-indigo-800',
  'Data Protection': 'bg-green-100 text-green-800',
  Technical: 'bg-purple-100 text-purple-800',
  Operations: 'bg-orange-100 text-orange-800',
  Physical: 'bg-amber-100 text-amber-800',
  People: 'bg-pink-100 text-pink-800',
};

export function AdminPolicyTemplatesPage() {
  const { t } = useTranslation('admin');
  const isSuperAdmin = useHasRole('SUPER_ADMIN');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'policy-templates'],
    queryFn: () => adminService.listPolicyTemplates(),
    enabled: isSuperAdmin,
  });

  const detail = useQuery({
    queryKey: ['admin', 'policy-templates', selectedId],
    queryFn: () => adminService.getPolicyTemplate(selectedId!),
    enabled: !!selectedId,
  });

  const templates = data?.data ?? [];
  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );

  const selected = detail.data?.data as PolicyTemplateDetailDto | undefined;

  // Stats
  const categories = [...new Set(templates.map((t) => t.category))];
  const totalReqMappings = templates.reduce((s, t) => s + t.requirementMappingCount, 0);
  const totalCtrlMappings = templates.reduce((s, t) => s + t.controlMappingCount, 0);

  if (!isSuperAdmin) {
    return (
      <PageTemplate title="Unauthorized">
        <p className="text-gray-500">SUPER_ADMIN role required.</p>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title={t('policyTemplates.title')} description={t('policyTemplates.description')}>
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Policies</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{templates.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Categories</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{categories.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Requirement Links</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalReqMappings}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Control Links</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalCtrlMappings}</p></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={t('policyTemplates.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedId(t.id)}
            >
              <FileText className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.name}</p>
                <p className="text-xs text-gray-500 truncate">{t.description}</p>
              </div>
              <Badge variant="outline" className={`text-xs shrink-0 ${CATEGORY_COLORS[t.category] ?? 'bg-gray-100 text-gray-800'}`}>
                {t.category}
              </Badge>
              <span className="text-xs text-gray-400 shrink-0">{t.requirementMappingCount} req</span>
              <span className="text-xs text-gray-400 shrink-0">{t.controlMappingCount} ctrl</span>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8">{t('policyTemplates.noTemplates')}</p>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {detail.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="text-gray-600">{selected.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[selected.category] ?? ''}`}>{selected.category}</Badge>
                  <Badge variant="outline" className="text-xs">v{selected.version}</Badge>
                </div>

                {/* Requirement mappings */}
                {selected.requirementMappings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Framework Requirements</p>
                    <div className="space-y-1">
                      {selected.requirementMappings.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                          <Badge variant="outline" className="text-xs">{m.frameworkSlug}</Badge>
                          <span className="font-medium">{m.requirementCode}</span>
                          <span className="text-gray-500 truncate">{m.requirementTitle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Control mappings */}
                {selected.controlMappings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Linked Control Templates</p>
                    <div className="space-y-1">
                      {selected.controlMappings.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                          <span className="font-mono font-medium">{m.controlRef}</span>
                          <span className="text-gray-500 truncate">{m.controlTitle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
