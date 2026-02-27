import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function AIMessage({ role, content }: AIMessageProps) {
  const isAssistant = role === 'assistant';

  // Simple markdown rendering for common patterns
  const renderContent = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const code = part.slice(3, -3);
        const firstLine = code.indexOf('\n');
        const codeContent = firstLine > -1 ? code.slice(firstLine + 1) : code;
        return (
          <pre key={i} className="bg-muted/50 rounded-xl p-3 my-2 overflow-x-auto text-xs md:text-sm border border-border/50">
            <code>{codeContent}</code>
          </pre>
        );
      }
      
      // Process inline formatting
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part.split('\n').map((line, j) => {
            // Headers
            if (line.startsWith('### ')) {
              return <h3 key={j} className="font-semibold text-sm md:text-base mt-3 mb-1">{line.slice(4)}</h3>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={j} className="font-semibold text-base md:text-lg mt-4 mb-2">{line.slice(3)}</h2>;
            }
            if (line.startsWith('# ')) {
              return <h1 key={j} className="font-bold text-lg md:text-xl mt-4 mb-2">{line.slice(2)}</h1>;
            }
            
            // Lists
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return <li key={j} className="ml-4 list-disc">{formatInline(line.slice(2))}</li>;
            }
            if (/^\d+\.\s/.test(line)) {
              return <li key={j} className="ml-4 list-decimal">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>;
            }
            
            // Empty lines
            if (line.trim() === '') {
              return <br key={j} />;
            }
            
            return <p key={j} className="mb-1">{formatInline(line)}</p>;
          })}
        </span>
      );
    });
  };

  const formatInline = (text: string): React.ReactNode => {
    // Parse inline formatting into React elements (no dangerouslySetInnerHTML)
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/s);
      if (boldMatch) {
        if (boldMatch[1]) tokens.push(boldMatch[1]);
        tokens.push(<strong key={key++} className="font-semibold text-foreground">{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
        continue;
      }

      // Italic *text*
      const italicMatch = remaining.match(/^(.*?)\*(.*?)\*(.*)/s);
      if (italicMatch) {
        if (italicMatch[1]) tokens.push(italicMatch[1]);
        tokens.push(<em key={key++}>{italicMatch[2]}</em>);
        remaining = italicMatch[3];
        continue;
      }

      // Inline code `text`
      const codeMatch = remaining.match(/^(.*?)`(.*?)`(.*)/s);
      if (codeMatch) {
        if (codeMatch[1]) tokens.push(codeMatch[1]);
        tokens.push(<code key={key++} className="bg-muted/50 px-1.5 py-0.5 rounded-md text-xs font-mono">{codeMatch[2]}</code>);
        remaining = codeMatch[3];
        continue;
      }

      // No more patterns, push rest as text
      tokens.push(remaining);
      break;
    }

    return <>{tokens}</>;
  };

  return (
    <div className={cn(
      "flex gap-2 md:gap-3 p-3 md:p-4",
      isAssistant ? "bg-muted/20" : ""
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
        isAssistant 
          ? "gradient-neon glow-sm" 
          : "bg-secondary/20 text-secondary"
      )}>
        {isAssistant ? (
          <Bot className="w-4 h-4 text-white" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-xs md:text-sm leading-relaxed">
        {renderContent(content)}
      </div>
    </div>
  );
}
