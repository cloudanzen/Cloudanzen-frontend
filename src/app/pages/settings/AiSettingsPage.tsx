import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Key, Loader2, Trash2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { aiService, type AiConfig } from '@/services/api/ai';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

export function AiSettingsPage() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');
  const [completionModel, setCompletionModel] = useState('');
  const [embeddingModel, setEmbeddingModel] = useState('');
  const [enabled, setEnabled] = useState(false);

  const configQuery = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => aiService.getConfig(),
  });

  const statusQuery = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => aiService.getSettings(),
  });

  // Sync local state when config loads
  const config = configQuery.data;
  const hasInitialized = useState(false);
  if (config && !hasInitialized[0]) {
    setProvider(config.provider);
    setCompletionModel(config.completionModel ?? '');
    setEmbeddingModel(config.embeddingModel ?? '');
    setEnabled(config.enabled);
    hasInitialized[1](true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      aiService.updateConfig({
        provider,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        completionModel: completionModel.trim() || null,
        embeddingModel: embeddingModel.trim() || null,
        enabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      setApiKey('');
      toast.success('AI settings saved.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save settings.');
    },
  });

  const testMutation = useMutation({
    mutationFn: () => aiService.testKey(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      if (data.success) {
        toast.success(`API key verified! Model: ${data.model}`);
      } else {
        toast.error(data.error || 'Test failed.');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Test failed.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => aiService.removeKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      setApiKey('');
      setEnabled(false);
      toast.success('API key removed. Using platform default.');
    },
  });

  if (configQuery.isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading AI settings...</div>;
  }

  const usingOrgKey = statusQuery.data?.data?.usingOrgKey ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your own AI API key to power all AI features (evidence synthesis, questionnaire
          assistant, image scanning, risk enrichment, and more).
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Provider</span>
            <Badge variant={usingOrgKey ? 'default' : 'secondary'}>
              {usingOrgKey
                ? `Your Key (${config?.provider ?? 'openai'})`
                : 'Platform Default'}
            </Badge>
          </div>
          {config?.configured && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Key Fingerprint</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {config.keyFingerprint}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Test</span>
                <div className="flex items-center gap-1.5">
                  {config.lastTestResult === 'success' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : config.lastTestResult ? (
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  ) : null}
                  <span className="text-xs">
                    {config.lastTestResult === 'success'
                      ? 'Passed'
                      : config.lastTestResult
                        ? `Failed: ${config.lastTestResult}`
                        : 'Not tested'}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Configuration Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Key Configuration
          </CardTitle>
          <CardDescription>
            Enter your OpenAI or Anthropic API key. The key is encrypted at rest and never displayed
            after saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
            {provider === 'anthropic' && (
              <p className="text-xs text-muted-foreground">
                Anthropic does not provide embeddings. The platform's OpenAI key will be used for
                embeddings automatically.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder={
                config?.configured
                  ? `Current key: ${config.keyFingerprint} (enter new key to replace)`
                  : provider === 'openai'
                    ? 'sk-...'
                    : 'sk-ant-...'
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Completion Model (optional)</Label>
            <Input
              placeholder={provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-20250514'}
              value={completionModel}
              onChange={(e) => setCompletionModel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the provider's default model.
            </p>
          </div>

          {provider === 'openai' && (
            <div className="space-y-2">
              <Label>Embedding Model (optional)</Label>
              <Input
                placeholder="text-embedding-3-small"
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable BYOK</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, all AI features will use your key instead of the platform's.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>

            {config?.configured && (
              <>
                <Button
                  variant="outline"
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Key'
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (confirm('Remove your API key? AI features will revert to the platform default.')) {
                      removeMutation.mutate();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Features Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Powered AI Features</CardTitle>
          <CardDescription>
            Your API key will be used for all of these features when BYOK is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1.5 text-muted-foreground">
            <li>Evidence synthesis &amp; control mapping</li>
            <li>Questionnaire assistant (draft answers)</li>
            <li>Knowledge base embeddings &amp; RAG retrieval</li>
            <li>Auditor note generation</li>
            <li>Scan finding risk enrichment</li>
            <li>Access management image scanning</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
