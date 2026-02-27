import { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDailySummary } from '@/hooks/useDailySummary';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIMessage } from '@/components/ai/AIMessage';
import { cn } from '@/lib/utils';

export function DashboardAIChat() {
  const [input, setInput] = useState('');
  const [showReport, setShowReport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { summary, isLoading: summaryLoading, error: summaryError, generate, refresh } = useDailySummary();
  const { messages, isLoading: chatLoading, error: chatError, sendMessage } = useAIAssistant({ context: 'dashboard' });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGenerate = () => {
    setShowReport(true);
    generate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    setShowReport(true);
    sendMessage(input);
    setInput('');
  };

  // Collapsed: just a button to generate
  if (!showReport) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4" />
          Relatório IA
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/10 backdrop-blur-sm">
      {/* Banner row */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              Gerando resumo...
            </div>
          ) : summaryError ? (
            <p className="text-sm text-muted-foreground">{summaryError}</p>
          ) : summary ? (
            <ul className="text-sm text-foreground/80 space-y-1 list-none">
              {summary.split('\n').filter(line => line.trim()).map((line, i) => {
                const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
                if (!cleaned) return null;
                return (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Clique em atualizar para gerar o resumo.</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={summaryLoading}
            className="h-7 w-7 text-muted-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", summaryLoading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReport(false)}
            className="h-7 w-7 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="border-t border-primary/15">
          <ScrollArea className="max-h-[280px]" ref={scrollRef}>
            <div className="pb-2">
              {messages.map((message, i) => (
                <AIMessage key={i} role={message.role} content={message.content} />
              ))}
              {chatLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="p-3 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    Pensando...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Error */}
      {chatError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs border-t border-primary/15">
          {chatError}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-primary/15">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo sobre seus dados..."
            disabled={chatLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={chatLoading || !input.trim()}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
