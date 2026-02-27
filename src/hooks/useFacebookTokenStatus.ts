import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TokenStatus {
  isExpired: boolean;
  isValid: boolean;
  errorMessage: string | null;
  lastCheckedAt: Date | null;
}

// Helper to check if error message indicates token expiration
function checkIfExpired(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  return (
    lowerMsg.includes("expired") ||
    lowerMsg.includes("session has expired") ||
    lowerMsg.includes("token expirado") ||
    lowerMsg.includes("isexpired")
  );
}

// Helper to parse error from edge function response
function parseTokenError(response: unknown): TokenStatus {
  const now = new Date();
  
  // Handle object responses
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    
    // Check for isExpired flag directly
    if (obj.isExpired === true) {
      return {
        isExpired: true,
        isValid: false,
        errorMessage: String(obj.message || obj.error || "Token expirado"),
        lastCheckedAt: now,
      };
    }
    
    // Check for success: false
    if (obj.success === false) {
      const errorMsg = String(obj.message || obj.error || "");
      return {
        isExpired: checkIfExpired(errorMsg),
        isValid: false,
        errorMessage: errorMsg || "Erro na verificação do token",
        lastCheckedAt: now,
      };
    }
    
    // Success case
    if (obj.success === true) {
      return {
        isExpired: false,
        isValid: true,
        errorMessage: null,
        lastCheckedAt: now,
      };
    }
  }
  
  return {
    isExpired: false,
    isValid: false,
    errorMessage: "Resposta inválida do servidor",
    lastCheckedAt: now,
  };
}

export function useFacebookTokenStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: ["facebook-token-status"],
    queryFn: async (): Promise<TokenStatus> => {
      try {
        const { data, error } = await supabase.functions.invoke("test-facebook-connection", {
          body: { checkOnly: true },
        });

        // Edge function errors (including 401) come through the error object
        if (error) {
          const errorMsg = error.message || "";
          
          // Try to parse JSON from the error message (edge function returns JSON in error)
          try {
            const parsed = JSON.parse(errorMsg.replace(/^.*?Error,?\s*/, ""));
            if (parsed && typeof parsed === "object") {
              return parseTokenError(parsed);
            }
          } catch {
            // Not JSON, use the raw message
          }
          
          return {
            isExpired: checkIfExpired(errorMsg),
            isValid: false,
            errorMessage: errorMsg,
            lastCheckedAt: new Date(),
          };
        }

        // Parse the successful response
        return parseTokenError(data);
      } catch (err: unknown) {
        // Network or other errors - don't crash the app
        const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
        
        return {
          isExpired: checkIfExpired(errorMsg),
          isValid: false,
          errorMessage: errorMsg,
          lastCheckedAt: new Date(),
        };
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    // Never throw errors - always return a valid TokenStatus object
    throwOnError: false,
  });
}
