import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import type { Database } from "@/integrations/supabase/types";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  purchase?: Purchase | null;
  onSave: (data: PurchaseFormData) => Promise<void>;
}

const purchaseSchema = z.object({
  product_name: z.string().min(1, "Produto é obrigatório"),
  product_slug: z.string().nullable(),
  value: z.coerce.number().min(0, "Valor deve ser positivo").nullable(),
  status: z.string().min(1, "Status é obrigatório"),
  purchase_date: z.string().nullable(),
  payment_method: z.string().nullable(),
  installments: z.coerce.number().min(1).nullable(),
  transaction_id: z.string().nullable(),
  platform: z.string().nullable(),
  source: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_campaign: z.string().nullable(),
  commission: z.coerce.number().nullable(),
  is_recurring: z.boolean().default(false),
  subscription_id: z.string().nullable(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export function PurchaseDialog({
  open,
  onOpenChange,
  leadId,
  purchase,
  onSave,
}: PurchaseDialogProps) {
  const { data: products } = useProducts();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      product_name: "",
      product_slug: null,
      value: null,
      status: "approved",
      purchase_date: null,
      payment_method: null,
      installments: 1,
      transaction_id: null,
      platform: null,
      source: null,
      utm_source: null,
      utm_campaign: null,
      commission: null,
      is_recurring: false,
      subscription_id: null,
    },
  });

  const selectedProductSlug = watch("product_slug");

  // Load purchase data when editing
  useEffect(() => {
    if (purchase && open) {
      reset({
        product_name: purchase.product_name,
        product_slug: purchase.product_slug,
        value: purchase.value,
        status: purchase.status,
        purchase_date: purchase.purchase_date
          ? new Date(purchase.purchase_date).toISOString().split("T")[0]
          : null,
        payment_method: purchase.payment_method,
        installments: purchase.installments,
        transaction_id: purchase.transaction_id,
        platform: (purchase as any).platform,
        source: purchase.source,
        utm_source: purchase.utm_source,
        utm_campaign: purchase.utm_campaign,
        commission: purchase.commission,
        is_recurring: (purchase as any).is_recurring || false,
        subscription_id: (purchase as any).subscription_id || null,
      });
    } else if (!open) {
      reset();
    }
  }, [purchase, open, reset]);

  // Auto-fill product name and price when product is selected
  // Only auto-fill value for NEW purchases, not when editing
  useEffect(() => {
    if (selectedProductSlug && products) {
      const product = products.find((p) => p.slug === selectedProductSlug);
      if (product) {
        setValue("product_name", product.name);
        // Only auto-fill price if it's a NEW purchase (not editing)
        if (!purchase) {
          setValue("value", product.price);
        }
      }
    }
  }, [selectedProductSlug, products, setValue, purchase]);

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving purchase:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchase ? "Editar Compra" : "Nova Compra"}
          </DialogTitle>
          <DialogDescription>
            {purchase
              ? "Atualize as informações da compra"
              : "Registre uma nova compra manualmente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Produto e Valor</h3>

              <div className="space-y-2">
                <Label htmlFor="product_slug">Produto</Label>
                <Select
                  value={watch("product_slug") || "custom"}
                  onValueChange={(value) => setValue("product_slug", value === "custom" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Produto personalizado</SelectItem>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.slug}>
                        {product.name} - R$ {product.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Nome do Produto *</Label>
                  <Input
                    id="product_name"
                    {...register("product_name")}
                    placeholder="Nome do produto"
                  />
                  {errors.product_name && (
                    <p className="text-sm text-destructive">
                      {errors.product_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Valor *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    {...register("value")}
                    placeholder="0.00"
                  />
                  {errors.value && (
                    <p className="text-sm text-destructive">
                      {errors.value.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Details */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-sm">Detalhes da Compra</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) => setValue("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="completed">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Data da Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    {...register("purchase_date")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pagamento</Label>
                  <Select
                    value={watch("payment_method") || ""}
                    onValueChange={(value) =>
                      setValue("payment_method", value || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    {...register("installments")}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_id">ID da Transação</Label>
                <Input
                  id="transaction_id"
                  {...register("transaction_id")}
                  placeholder="TRX123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Comissão (R$)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  {...register("commission")}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  {...register("is_recurring")}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="is_recurring" className="cursor-pointer font-normal">
                  É Assinatura/Recorrência (cobranças mensais automáticas)
                </Label>
              </div>

              {watch("is_recurring") && (
                <div className="space-y-2">
                  <Label htmlFor="subscription_id">ID da Assinatura</Label>
                  <Input
                    id="subscription_id"
                    {...register("subscription_id")}
                    placeholder="sub_123456789"
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único da assinatura fornecido pela plataforma
                  </p>
                </div>
              )}
            </div>

            {/* Platform & Origin */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-sm">Plataforma de Vendas e Origem do Tráfego</h3>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma de Vendas</Label>
                <Select
                  value={watch("platform") || ""}
                  onValueChange={(value) => setValue("platform", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="eduzz">Eduzz</SelectItem>
                    <SelectItem value="kiwify">Kiwify</SelectItem>
                    <SelectItem value="monetizze">Monetizze</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="pagarme">Pagar.me</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Onde a venda foi processada (checkout)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Origem do Tráfego</Label>
                <Select
                  value={watch("source") || ""}
                  onValueChange={(value) => setValue("source", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="organic">Orgânico</SelectItem>
                    <SelectItem value="email">Email Marketing</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  De onde veio o lead antes de comprar
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm_source">UTM Source</Label>
                  <Input
                    id="utm_source"
                    {...register("utm_source")}
                    placeholder="Meta Ads"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utm_campaign">UTM Campaign</Label>
                  <Input
                    id="utm_campaign"
                    {...register("utm_campaign")}
                    placeholder="black-friday"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Compra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
