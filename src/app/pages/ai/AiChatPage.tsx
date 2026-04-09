import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { PageTemplate } from '@/app/components/PageTemplate';
import { aiService, type ChatMessage } from '@/services/api/ai';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AiChatPage() {
  const { t } = useTranslation('ai');

  const suggestions = useMemo(() => [
    t('chat.suggestions.awsIntegration'),
    t('chat.suggestions.frameworks'),
    t('chat.suggestions.monitoring'),
    t('chat.suggestions.soc2Audit'),
    t('chat.suggestions.vendorRisk'),
    t('chat.suggestions.riskTreatment'),
    t('chat.suggestions.policyApproval'),
    t('chat.suggestions.trustCenter'),
  ], [t]);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: 'welcome', role: 'assistant', text: t('chat.welcome') },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(2);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || isLoading) return;

      const nextId = counter.current;
      counter.current += 2;

      const userMsg: DisplayMessage = {
        id: `user-${nextId}`,
        role: 'user',
        text,
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');

      try {
        setIsLoading(true);
        const chatHistory: ChatMessage[] = nextMessages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const response = await aiService.chat(chatHistory);
        const replyText =
          response.data?.reply ??
          t('chat.errorReply');

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${nextId + 1}`,
            role: 'assistant',
            text: replyText,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${nextId + 1}`,
            role: 'assistant',
            text: t('chat.errorReply'),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages, t],
  );

  return (
    <PageTemplate
      title={t('chat.title')}
      description={t('chat.description')}
    >
      <div className="mx-auto flex max-w-3xl flex-col" style={{ height: 'calc(100vh - 13rem)' }}>
        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-muted/20 px-4 py-4"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role === 'assistant' && (
                <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-card-foreground',
                )}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={isLoading}
                    className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  {t('chat.thinking')}
                  <span className="animate-pulse"></span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="mt-3 flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={t('chat.placeholder')}
            className="h-12 flex-1 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
            disabled={isLoading}
          />
          <button
            onClick={() => void sendMessage()}
            disabled={isLoading || !input.trim()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </PageTemplate>
  );
}
