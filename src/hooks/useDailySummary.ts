import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUMMARY_KEY_PREFIX = 'ai_daily_summary_';

function getTodayKey() {
  const today = new Date().toISOString().split('T')[0];
  return `${SUMMARY_KEY_PREFIX}${today}`;
}

export function useDailySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Gere um resumo executivo breve (máximo 5 frases) das últimas 24 horas com base nos dados disponíveis. Considere APENAS os dados das últimas 24 horas, não dos últimos 30 dias. Inclua: total de leads captados, vendas realizadas, receita gerada e principais destaques. Ao final, inclua 1-2 dicas práticas de análise para o usuário melhorar seus resultados. Seja direto e objetivo, sem saudações.',
            },
          ],
          context: 'resumo_diario_24h',
          stream: false,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = errData.error || 'Erro ao gerar resumo';
        // Don't throw on credit/config issues — show fallback
        if (response.status === 402 || response.status === 429) {
          setSummary(null);
          setError(response.status === 402 
            ? 'Créditos de IA insuficientes. O resumo ficará disponível quando os créditos forem repostos.' 
            : 'Limite de requisições excedido. Tente novamente em alguns segundos.');
          return;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'Sem dados para resumo.';

      localStorage.setItem(getTodayKey(), content);
      setSummary(content);
    } catch (e) {
      console.error('Daily summary error:', e);
      setError(e instanceof Error ? e.message : 'Erro ao gerar resumo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount, only load from cache — don't auto-fetch
  useEffect(() => {
    const cached = localStorage.getItem(getTodayKey());
    if (cached) {
      setSummary(cached);
    }
  }, []);

  const generate = useCallback(() => {
    const cached = localStorage.getItem(getTodayKey());
    if (cached) {
      setSummary(cached);
    } else {
      fetchSummary();
    }
  }, [fetchSummary]);

  const refresh = useCallback(() => {
    localStorage.removeItem(getTodayKey());
    setSummary(null);
    fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, generate, refresh };
}
