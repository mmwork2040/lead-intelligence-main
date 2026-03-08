import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current authenticated user's ID.
 * Throws an error if the user is not authenticated.
 * Used to enforce multi-tenant data isolation on all INSERT operations.
 */
export async function getCurrentUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
    }
    return session.user.id;
}
