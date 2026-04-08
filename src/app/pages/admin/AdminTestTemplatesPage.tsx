import { useState } from 'react';
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
import { adminService } from '@/services/api/admin';
import { Search, Loader2, FlaskConical, ChevronRight } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  IT: 'bg-blue-100 text-blue-800',
  Engineering: 'bg-purple-100 text-purple-800',
  HR: 'bg-pink-100 text-pink-800',
  Policy: 'bg-green-100 text-green-800',
  Risks: 'bg-orange-100 text-orange-800',
  Custom: 'bg-gray-100 text-gray-800',
};

const TYPE_COLORS: Record<string, string> = {
  Document: 'bg-amber-100 text-amber-800',
  Automated: 'bg-cyan-100 text-cyan-800',
};

export function AdminTestTemplatesPage() {
  const isSuperAdmin = useHasRole('SUPER_ADMIN');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'test-templates'],
    queryFn: () => adminService.listTestTemplates(),
    enabled: isSuperAdmin,
  });

  const templates = data?.data ?? [];
  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.controlRef.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );

  const selected = templates.find((t) => t.id === selectedId);

  // Stats
  const categories = [...new Set(templates.map((t) => t.category))];
  const automated = templates.filter((t) => t.testType === 'Automated').length;

  if (!isSuperAdmin) {
    return (
      <PageTemplate title="Unauthorized">
        <p className="text-gray-500">SUPER_ADMIN role required.</p>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Test Templates" description="Pre-built test definitions cloned into organizations on framework activation.">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Tests</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{templates.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Categories</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{categories.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Automated</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{automated}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Document</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{templates.length - automated}</p></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search test templates..."
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
              <FlaskConical className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.name}</p>
                <p className="text-xs text-gray-500 truncate">{t.controlRef} — {t.controlTitle}</p>
              </div>
              <Badge variant="outline" className={`text-xs shrink-0 ${CATEGORY_COLORS[t.category] ?? 'bg-gray-100 text-gray-800'}`}>
                {t.category}
              </Badge>
              <Badge variant="outline" className={`text-xs shrink-0 ${TYPE_COLORS[t.testType] ?? ''}`}>
                {t.testType}
              </Badge>
              <span className="text-xs text-gray-400 shrink-0">{t.frequencyDays}d</span>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8">No test templates found.</p>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600">{selected.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Control:</span>{' '}
                    <span className="font-medium">{selected.controlRef}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>{' '}
                    <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[selected.category] ?? ''}`}>{selected.category}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>{' '}
                    <Badge variant="outline" className={`text-xs ${TYPE_COLORS[selected.testType] ?? ''}`}>{selected.testType}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>{' '}
                    <span className="font-medium">{selected.frequencyDays} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Evidence:</span>{' '}
                    <span className="font-medium">{selected.evidenceType}</span>
                  </div>
                </div>
                {selected.guidance && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-800 mb-1">Guidance</p>
                    <p className="text-xs text-blue-700">{selected.guidance}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
