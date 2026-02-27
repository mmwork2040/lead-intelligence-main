import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza telefone para formato WhatsApp internacional
 * - Remove caracteres não numéricos
 * - Garante DDI 55 (Brasil) para wa.me/
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, "");

  // Remove prefixos de discagem internacional (00, 0055)
  if (cleanPhone.startsWith("0055")) {
    cleanPhone = cleanPhone.slice(4);
  } else if (cleanPhone.startsWith("00")) {
    cleanPhone = cleanPhone.slice(2);
  }

  // Se já tem DDI 55 e comprimento correto, manter como está
  if (cleanPhone.startsWith("55") && cleanPhone.length >= 12) {
    return cleanPhone;
  }

  // Número brasileiro sem DDI: adicionar 55
  if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
    return "55" + cleanPhone;
  }

  return cleanPhone;
}

/**
 * Gera URL do WhatsApp. Retorna null se telefone inválido.
 */
export function getWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = normalizePhoneForWhatsApp(phone);
  // Mínimo 12 dígitos (55 + DDD + número) para ser válido
  if (normalized.length < 12) return null;
  return `https://wa.me/${normalized}`;
}
