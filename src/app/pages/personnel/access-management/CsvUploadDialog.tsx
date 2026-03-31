import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { accessManagementService, type AccessService } from '@/services/api/access-management';

interface Props {
  service: AccessService;
  onClose: () => void;
}

export function CsvUploadDialog({ service, onClose }: Props) {
  const queryClient = useQueryClient();
  const csvRef = useRef<HTMLInputElement>(null);
  const evidenceRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ accountsImported: number; parseErrors: string[] } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      accessManagementService.uploadCsv(service.id, csvFile!, evidenceFile ?? undefined),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['access-services'] });
      queryClient.invalidateQueries({ queryKey: ['access-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['access-stats'] });
    },
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload CSV — {service.serviceName}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600 font-medium">
              {result.accountsImported} accounts imported successfully.
            </p>
            {result.parseErrors.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="text-amber-600 font-medium">Warnings:</p>
                {result.parseErrors.map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{e}</p>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">CSV File (required)</p>
              <p className="text-xs text-muted-foreground">
                Columns: account_name (or name), email, role, status, external_id (or username).
                Header row is required.
              </p>
              <input
                ref={csvRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
              {csvFile ? (
                <div className="flex items-center gap-2 p-2 border rounded text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{csvFile.name}</span>
                  <button onClick={() => setCsvFile(null)}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => csvRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Select CSV
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Evidence File (optional)</p>
              <p className="text-xs text-muted-foreground">
                Screenshot or PDF of the service's user list page for audit evidence.
              </p>
              <input
                ref={evidenceRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                className="hidden"
                onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
              />
              {evidenceFile ? (
                <div className="flex items-center gap-2 p-2 border rounded text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{evidenceFile.name}</span>
                  <button onClick={() => setEvidenceFile(null)}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => evidenceRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Select Evidence
                </Button>
              )}
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={!csvFile || mutation.isPending}
              >
                {mutation.isPending ? 'Uploading...' : 'Upload & Import'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
