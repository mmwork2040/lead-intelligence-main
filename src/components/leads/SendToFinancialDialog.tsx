import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCreateInvoiceRequest } from "@/hooks/useInvoiceRequests";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

interface SendToFinancialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  purchases?: Purchase[];
}

export const SendToFinancialDialog = ({
  open,
  onOpenChange,
  lead,
  purchases = [],
}: SendToFinancialDialogProps) => {
  const [selectedPurchase, setSelectedPurchase] = useState<string>("");
  const [customValue, setCustomValue] = useState<string>("");
  const createInvoiceRequest = useCreateInvoiceRequest();
  
  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: {
      lead_name: lead.name || "",
      lead_cpf: lead.cpf || "",
      lead_email: lead.email || "",
      lead_phone: lead.phone || "",
      description: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        lead_name: lead.name || "",
        lead_cpf: lead.cpf || "",
        lead_email: lead.email || "",
        lead_phone: lead.phone || "",
        description: "",
        notes: "",
      });
      setSelectedPurchase("");
      setCustomValue("");
    }
  }, [open, lead, reset]);

  const onSubmit = async (data: any) => {
    let finalValue = 0;
    let purchaseId = null;

    if (selectedPurchase) {
      const purchase = purchases.find((p) => p.id === selectedPurchase);
      if (purchase) {
        finalValue = Number(purchase.value) || 0;
        purchaseId = purchase.id;
      }
    } else if (customValue) {
      finalValue = parseFloat(customValue);
    }

    if (finalValue <= 0) {
      return;
    }

    await createInvoiceRequest.mutateAsync({
      lead_id: lead.lead_id,
      purchase_id: purchaseId,
      value: finalValue,
      description: data.description || "Serviço/Produto",
      notes: data.notes || "",
      lead_name: data.lead_name,
      lead_cpf: data.lead_cpf,
      lead_email: data.lead_email,
      lead_phone: data.lead_phone,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💼 Enviar para Financeiro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados do Cliente */}
          <div>
            <h3 className="font-semibold mb-4">📋 Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input {...register("lead_name")} />
              </div>
              <div>
                <Label>CPF</Label>
                <Input {...register("lead_cpf")} />
              </div>
              <div>
                <Label>Email</Label>
                <Input {...register("lead_email")} type="email" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input {...register("lead_phone")} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Valor da Nota Fiscal */}
          <div>
            <h3 className="font-semibold mb-4">💰 Valor da Nota Fiscal</h3>
            
            {purchases && purchases.length > 0 && (
              <div className="mb-4">
                <Label>Selecionar compra existente</Label>
                <Select value={selectedPurchase} onValueChange={(value) => {
                  setSelectedPurchase(value);
                  setCustomValue("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma compra..." />
                  </SelectTrigger>
                  <SelectContent>
                    {purchases.map((purchase) => (
                      <SelectItem key={purchase.id} value={purchase.id}>
                        {purchase.product_name} - R$ {Number(purchase.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} - {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString("pt-BR") : "-"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-center text-muted-foreground text-sm my-3">
              ─── OU ───
            </div>

            <div>
              <Label>Valor personalizado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setSelectedPurchase("");
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Descrição do Serviço */}
          <div>
            <Label>📝 Descrição do Serviço/Produto</Label>
            <Input
              {...register("description")}
              placeholder="Ex: Curso de Marketing Digital"
            />
          </div>

          {/* Observações */}
          <div>
            <Label>💬 Observações para o Contador</Label>
            <Textarea
              {...register("notes")}
              placeholder="Informações adicionais relevantes para emissão da NF..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInvoiceRequest.isPending}>
              {createInvoiceRequest.isPending ? "Enviando..." : "💼 Enviar para Financeiro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
