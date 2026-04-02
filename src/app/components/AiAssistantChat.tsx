import { useCallback, useRef, useState, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { aiService, type ChatMessage } from '@/services/api/ai';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const INITIAL_MESSAGES: DisplayMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Hi! I'm the CloudAnzen AI assistant. I can help you navigate the platform, explain compliance concepts, and guide you through workflows. What can I help with?",
  },
];

const SUGGESTIONS = [
  'How do I connect an integration?',
  'What frameworks do you support?',
  'How does continuous monitoring work?',
  'How do I prepare for an audit?',
  'How do I manage vendor risk?',
];

export function AiAssistantChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counter = useRef(INITIAL_MESSAGES.length + 1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
          "I couldn't process that right now. Please try again or contact support.";

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
            text: "I hit a temporary issue. Please try again or check our Help Center for guidance.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages],
  );

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-blue-950 to-teal-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-[11px] text-slate-300">
              Platform guidance &amp; help
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-3"
        style={{ maxHeight: '24rem' }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            {msg.role === 'assistant' && (
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-card-foreground',
              )}
            >
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {/* Suggestions — only show at start */}
        {messages.length <= 2 && (
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-blue-500" />
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={isLoading}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                Thinking
                <span className="animate-pulse">...</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask about any feature or workflow..."
            className="h-10 flex-1 rounded-xl border border-border bg-muted px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-400 focus:bg-card"
            disabled={isLoading}
          />
          <button
            onClick={() => void sendMessage()}
            disabled={isLoading || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
