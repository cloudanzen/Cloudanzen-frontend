/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Layers3, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { testsService, type TestTemplate } from '@/services/api/tests';

export function FrameworkSuiteLibrary({
  title = 'Available Frameworks',
  description = 'Launch pre-built framework test suites directly into your tests workspace.',
}: {
  title?: string;
  description?: string;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useQuery<TestTemplate[]>({
    queryKey: ['tests', 'library'],
    queryFn: async () => {
      const res = await testsService.getLibrary();
      return res.data ?? [];
    },
  });

  const createSuite = useMutation({
    mutationFn: (template: TestTemplate) => testsService.createSuiteFromTemplate(template.id),
    onSuccess: (response, template) => {
      const count = response.data?.length ?? 0;
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['tests', 'library'] });
      qc.invalidateQueries({ queryKey: ['tests', 'summary'] });
      toast.success(count > 0 ? `${template.framework} suite created with ${count} tests.` : `${template.framework} suite created.`);
      navigate('/tests');
    },
    onError: (error: any, template) => {
      toast.error(error?.message ?? `Failed to create ${template.framework} suite.`);
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl">{description}</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-10 text-center text-sm text-gray-500">Loading framework suites...</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const isPending = createSuite.isPending && createSuite.variables?.id === template.id;
            return (
              <Card key={template.id} className="p-6 space-y-4 border-gray-200 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{template.framework}</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">{template.name}</h3>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <BookOpen className="h-5 w-5 text-slate-700" />
                  </div>
                </div>

                <p className="text-sm leading-6 text-gray-600">{template.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Cadence</p>
                    <p className="mt-1 font-medium text-gray-900 capitalize">{template.recurrenceRule}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                    <p className="mt-1 font-medium text-gray-900">{template.type}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Mapped controls</p>
                  <div className="flex flex-wrap gap-2">
                    {template.controls.map((control) => (
                      <span key={control} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                        <Layers3 className="mr-1 h-3 w-3" />
                        {control}
                      </span>
                    ))}
                  </div>
                </div>

                <Button onClick={() => createSuite.mutate(template)} disabled={createSuite.isPending} className="w-full">
                  <Rocket className="mr-2 h-4 w-4" />
                  {isPending ? 'Creating suite...' : 'Create Test Suite'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
