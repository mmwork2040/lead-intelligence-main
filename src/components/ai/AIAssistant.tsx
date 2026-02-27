import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIMessage } from './AIMessage';

interface AIAssistantProps {
  context?: string;
}

const SUGGESTIONS = [
  "Performance das campanhas",
  "Vendas dos últimos 30 dias",
  "Melhores fontes de tráfego",
  "Sugestões de melhoria",
];

export function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIAssistant({ context });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // On mobile, always fullscreen when open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      setIsFullscreen(true);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsFullscreen(false);
  };

  // Floating button
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 h-14 w-14 rounded-2xl shadow-xl z-40"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 flex flex-col transition-all duration-300 ease-out",
      isFullscreen 
        ? "inset-0 md:bottom-4 md:right-4 md:left-auto md:top-auto md:w-[500px] md:h-[600px] md:rounded-2xl" 
        : "bottom-24 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-[400px] h-[60vh] md:h-[500px] rounded-2xl",
      "bg-background border border-border shadow-2xl overflow-hidden"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-neon glow-sm flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistente IA</h3>
            <p className="text-[10px] text-muted-foreground">
              {isLoading ? 'Pensando...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={clearMessages}
            title="Limpar conversa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hidden md:flex"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Minimizar" : "Expandir"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="p-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 glow-sm">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-semibold mb-1">Como posso ajudar?</h4>
              <p className="text-xs text-muted-foreground">
                Analiso dados e sugiro melhorias.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(suggestion)}
                  className="text-left text-xs p-3 rounded-xl border border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:glow-sm transition-all touch-target"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pb-2">
            {messages.map((message, i) => (
              <AIMessage key={i} role={message.role} content={message.content} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Pensando...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs border-t border-destructive/20">
          {error}
        </div>
      )}

      {/* Input - Fixed at bottom */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-muted/50 safe-bottom">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo..."
            disabled={isLoading}
            variant="glow"
            className="flex-1"
          />
          <Button 
            type="submit"
            size="icon" 
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
