import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Upload, FileText, X, ScanLine, Loader2 } from 'lucide-react';
import { accessManagementService, type AccessService } from '@/services/api/access-management';

interface Props {
  service: AccessService;
  onClose: () => void;
}

export function CsvUploadDialog({ service, onClose }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<string>('csv');

  // ── CSV state ───────────────────────────────────────────────────────────
  const csvRef = useRef<HTMLInputElement>(null);
  const evidenceRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<{ accountsImported: number; parseErrors: string[] } | null>(null);

  const csvMutation = useMutation({
    mutationFn: () =>
      accessManagementService.uploadCsv(service.id, csvFile!, evidenceFile ?? undefined),
    onSuccess: (data) => {
      setCsvResult(data);
      invalidateAll();
    },
  });

  // ── Image scan state ────────────────────────────────────────────────────
  const imageRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    accountsImported: number;
    accounts: Array<{
      externalAccountId: string;
      accountName: string;
      accountEmail: string | null;
      role: string | null;
      status: string;
    }>;
    provider: string;
  } | null>(null);

  const scanMutation = useMutation({
    mutationFn: () => accessManagementService.scanImage(service.id, imageFile!),
    onSuccess: (data) => {
      setScanResult(data);
      invalidateAll();
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['access-services'] });
    queryClient.invalidateQueries({ queryKey: ['access-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['access-stats'] });
  }

  function handleImageSelect(file: File | null) {
    setImageFile(file);
    setScanResult(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  const isDone = csvResult !== null || scanResult !== null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Accounts — {service.serviceName}</DialogTitle>
        </DialogHeader>

        {isDone ? (
          <SuccessView
            csvResult={csvResult}
            scanResult={scanResult}
            onClose={onClose}
          />
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="csv" className="flex-1">
                <FileText className="w-4 h-4 mr-1" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex-1">
                <ScanLine className="w-4 h-4 mr-1" />
                Scan Image
              </TabsTrigger>
            </TabsList>

            {/* ── CSV Tab ──────────────────────────────────────────── */}
            <TabsContent value="csv" className="mt-4 space-y-4">
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
                  <FileChip name={csvFile.name} onRemove={() => setCsvFile(null)} />
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => csvRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" />
                    Select CSV
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Evidence File (optional)</p>
                <p className="text-xs text-muted-foreground">
                  Screenshot or PDF of the user list page for audit evidence.
                </p>
                <input
                  ref={evidenceRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="hidden"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                />
                {evidenceFile ? (
                  <FileChip name={evidenceFile.name} onRemove={() => setEvidenceFile(null)} />
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => evidenceRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" />
                    Select Evidence
                  </Button>
                )}
              </div>

              {csvMutation.isError && (
                <p className="text-sm text-red-600">{(csvMutation.error as Error).message}</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={() => csvMutation.mutate()} disabled={!csvFile || csvMutation.isPending}>
                  {csvMutation.isPending ? 'Uploading...' : 'Upload & Import'}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Scan Image Tab ──────────────────────────────────── */}
            <TabsContent value="scan" className="mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Screenshot of User List</p>
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot of the tool's user management or team page.
                  AI will extract account names, emails, and roles automatically.
                </p>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                />
                {imageFile ? (
                  <div className="space-y-2">
                    <FileChip name={imageFile.name} onRemove={() => handleImageSelect(null)} />
                    {imagePreview && (
                      <div className="border rounded-md overflow-hidden max-h-[200px]">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto object-contain max-h-[200px]"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => imageRef.current?.click()}>
                    <ScanLine className="w-4 h-4 mr-1" />
                    Select Screenshot
                  </Button>
                )}
              </div>

              {scanMutation.isPending && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-600">
                    Scanning image with AI... This may take a few seconds.
                  </span>
                </div>
              )}

              {scanMutation.isError && (
                <p className="text-sm text-red-600">{(scanMutation.error as Error).message}</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={() => scanMutation.mutate()} disabled={!imageFile || scanMutation.isPending}>
                  {scanMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4 mr-1" />
                      Scan & Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded text-sm">
      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 truncate">{name}</span>
      <button onClick={onRemove}>
        <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  );
}

function SuccessView({
  csvResult,
  scanResult,
  onClose,
}: {
  csvResult: { accountsImported: number; parseErrors: string[] } | null;
  scanResult: {
    accountsImported: number;
    accounts: Array<{
      accountName: string;
      accountEmail: string | null;
      role: string | null;
      status: string;
    }>;
    provider: string;
  } | null;
  onClose: () => void;
}) {
  const imported = csvResult?.accountsImported ?? scanResult?.accountsImported ?? 0;
  const accounts = scanResult?.accounts ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-green-600 font-medium">
        {imported} accounts imported successfully.
      </p>

      {csvResult?.parseErrors && csvResult.parseErrors.length > 0 && (
        <div className="text-sm space-y-1">
          <p className="text-amber-600 font-medium">Warnings:</p>
          {csvResult.parseErrors.map((e, i) => (
            <p key={i} className="text-xs text-muted-foreground">{e}</p>
          ))}
        </div>
      )}

      {scanResult && accounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            Extracted accounts
            <Badge variant="secondary" className="text-xs">
              via {scanResult.provider}
            </Badge>
          </p>
          <div className="max-h-[200px] overflow-y-auto border rounded-md">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-left p-2 font-medium">Role</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{a.accountName}</td>
                    <td className="p-2 text-muted-foreground">{a.accountEmail ?? '—'}</td>
                    <td className="p-2">{a.role ?? '—'}</td>
                    <td className="p-2">
                      <Badge variant={a.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}
