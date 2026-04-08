import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Loader2, Search, Plus, CheckCircle2, Library, AlertTriangle } from 'lucide-react';
import { riskLibraryService, RiskLibraryItemDto } from '@/services/api/risk-library';

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
};

const CATEGORY_COLORS: Record<string, string> = {
  Governance: 'bg-blue-100 text-blue-800',
  'Access Control': 'bg-indigo-100 text-indigo-800',
  'Asset Management': 'bg-teal-100 text-teal-800',
  Operations: 'bg-purple-100 text-purple-800',
  'Business Continuity': 'bg-amber-100 text-amber-800',
  Fraud: 'bg-red-100 text-red-800',
  Communications: 'bg-cyan-100 text-cyan-800',
  'Third Party': 'bg-orange-100 text-orange-800',
  Cryptography: 'bg-violet-100 text-violet-800',
  'Software Development': 'bg-emerald-100 text-emerald-800',
  Privacy: 'bg-pink-100 text-pink-800',
  Compliance: 'bg-slate-100 text-slate-800',
  'Incident Response': 'bg-rose-100 text-rose-800',
  'Physical Security': 'bg-lime-100 text-lime-800',
  People: 'bg-sky-100 text-sky-800',
};

export function RiskLibraryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const queryClient = useQueryClient();

  const { data: libData, isLoading } = useQuery({
    queryKey: ['risk-library'],
    queryFn: () => riskLibraryService.listLibrary(),
  });

  // Also load register to know which items are already added
  const { data: regData } = useQuery({
    queryKey: ['risk-register'],
    queryFn: () => riskLibraryService.listRegister(),
  });

  const addMutation = useMutation({
    mutationFn: (item: RiskLibraryItemDto) =>
      riskLibraryService.addToRegister({ libraryItemId: item.id }),
    onSuccess: () => {
      toast.success('Risk added to register');
      queryClient.invalidateQueries({ queryKey: ['risk-register'] });
    },
    onError: (err: Error & { message?: string }) => {
      if (err.message?.includes('already')) {
        toast.info('This risk is already in your register');
      } else {
        toast.error('Failed to add risk');
      }
    },
  });

  const items = useMemo(() => libData?.data ?? [], [libData]);
  const categories = libData?.categories ?? [];
  const registeredIds = new Set(
    (regData?.data ?? []).filter((r) => r.libraryItemId).map((r) => r.libraryItemId),
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const haystack = `${item.title} ${item.category}`.toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [items, categoryFilter, search]);

  return (
    <PageTemplate title="Risk Library" description="Browse risk scenarios and add applicable ones to your organization's risk register.">
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Library className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Library Items</span>
              </div>
              <p className="text-2xl font-bold">{items.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Categories</span>
              </div>
              <p className="text-2xl font-bold">{categories.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">In Register</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{registeredIds.size}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-gray-500">Available</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{items.length - registeredIds.size}</p>
            </Card>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search risk scenarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">All categories ({items.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({items.filter((i) => i.category === cat).length})
                </option>
              ))}
            </select>
          </div>

          {/* Risk List */}
          <div className="space-y-2">
            {filtered.map((item) => {
              const isAdded = registeredIds.has(item.id);
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-800'}`}>
                          {item.category}
                        </Badge>
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${IMPACT_COLORS[item.defaultImpact] ?? ''}`}>
                          Impact: {item.defaultImpact}
                        </span>
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${IMPACT_COLORS[item.defaultLikelihood] ?? ''}`}>
                          Likelihood: {item.defaultLikelihood}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isAdded ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          In Register
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addMutation.mutate(item)}
                          disabled={addMutation.isPending}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add to Register
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-8">No risk scenarios match your search.</p>
            )}
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
