import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Trash2, Sparkles, BarChart3, Users, TrendingUp, Target, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import DashboardLayout from '@/components/DashboardLayout';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIMessage } from '@/components/ai/AIMessage';
import { cn } from '@/lib/utils';

const QUICK_SUGGESTIONS = [
  { text: 'Performance', question: 'Qual foi o desempenho geral das campanhas este mês?' },
  { text: 'Leads', question: 'Quantos leads foram captados nos últimos 30 dias?' },
  { text: 'Vendas', question: 'Resuma as vendas dos últimos 30 dias' },
  { text: 'ROAS', question: 'Compare o ROAS das minhas campanhas ativas' },
  { text: 'Otimizar', question: 'Sugira melhorias para minhas campanhas' },
  { text: 'Funil', question: 'Como está a distribuição de leads por etapa do funil?' },
];

export default function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIAssistant({
    context: 'page_assistant'
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Hide suggestions when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleSuggestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <DashboardLayout>
      {/* Mobile: Full height chat, Desktop: Normal layout */}
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
        {/* Header - Compact on mobile */}
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl gradient-neon glow flex items-center justify-center">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Assistente IA</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Analise dados e receba sugestões inteligentes
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="gap-1.5 text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden md:inline">Limpar</span>
          </Button>
        </div>

        {/* Chat Container - Glass effect */}
        <div className="flex-1 flex flex-col glass rounded-2xl border border-border/50 overflow-hidden min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 text-center min-h-[300px]">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 glow-sm">
                  <Bot className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg md:text-xl mb-2">Olá! Como posso ajudar?</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Posso analisar leads, vendas, campanhas e sugerir melhorias.
                </p>
                
                {/* Tips - Desktop only */}
                <div className="hidden md:grid grid-cols-2 gap-3 max-w-lg text-left">
                  <div className="p-3 rounded-xl bg-muted/50 text-sm">
                    <BarChart3 className="h-4 w-4 text-primary mb-1" />
                    <span className="text-muted-foreground">Pergunte sobre métricas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-sm">
                    <TrendingUp className="h-4 w-4 text-secondary mb-1" />
                    <span className="text-muted-foreground">Peça comparações</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-sm">
                    <Users className="h-4 w-4 text-chart-3 mb-1" />
                    <span className="text-muted-foreground">Analise leads</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-sm">
                    <Target className="h-4 w-4 text-chart-4 mb-1" />
                    <span className="text-muted-foreground">Receba sugestões</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-4">
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
                      <span>Analisando dados...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Quick Suggestions - Horizontal scroll on mobile */}
          {showSuggestions && messages.length === 0 && (
            <div className="border-t border-border/50 p-3 bg-muted/30">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {QUICK_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(suggestion.question)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-4 py-2 rounded-full bg-background border border-border/50 text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary hover:glow-sm transition-all disabled:opacity-50 touch-target"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t border-destructive/20">
              {error}
            </div>
          )}

          {/* Input - Fixed at bottom with glass effect */}
          <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t border-border/50 bg-background/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre seus dados..."
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
      </div>
    </DashboardLayout>
  );
}
