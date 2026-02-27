import { useState, useEffect } from "react";
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
import { useCreateCampaignGoal, useUpdateCampaignGoal, type CampaignGoal } from "@/hooks/useCampaignGoals";

interface CampaignGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignStartDate: string;
  campaignEndDate: string;
  goal?: CampaignGoal | null;
}

export function CampaignGoalDialog({
  open,
  onOpenChange,
  campaignId,
  campaignStartDate,
  campaignEndDate,
  goal,
}: CampaignGoalDialogProps) {
  const [metricType, setMetricType] = useState<string>("leads");
  const [targetValue, setTargetValue] = useState<string>("");
  const [productSlug, setProductSlug] = useState<string>("");

  const { data: products } = useProducts();
  const createGoal = useCreateCampaignGoal();
  const updateGoal = useUpdateCampaignGoal();

  useEffect(() => {
    if (goal) {
      setMetricType(goal.metric_type);
      setTargetValue(goal.target_value.toString());
      setProductSlug(goal.product_slug || "__all__");
    } else {
      setMetricType("leads");
      setTargetValue("");
      setProductSlug("__all__");
    }
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const goalData = {
      campaign_id: campaignId,
      metric_type: metricType as "leads" | "sales" | "revenue",
      target_value: Number(targetValue),
      product_slug: productSlug === "__all__" ? undefined : productSlug,
      start_date: campaignStartDate,
      end_date: campaignEndDate,
    };

    try {
      if (goal) {
        await updateGoal.mutateAsync({
          id: goal.id,
          campaign_id: campaignId,
          metric_type: goalData.metric_type,
          target_value: goalData.target_value,
          product_slug: goalData.product_slug,
        });
      } else {
        await createGoal.mutateAsync(goalData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving campaign goal:', error);
    }
  };

  const showProductSelector = metricType === "sales" || metricType === "revenue";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar Meta" : "Adicionar Meta"}</DialogTitle>
          <DialogDescription>
            Defina uma meta para acompanhar o desempenho da campanha
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="metric_type">Tipo de Métrica</Label>
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_value">
              Valor Alvo {metricType === "revenue" && "(em R$)"}
            </Label>
            <Input
              id="target_value"
              type="number"
              min="1"
              step={metricType === "revenue" ? "0.01" : "1"}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder={metricType === "revenue" ? "30000.00" : "100"}
              required
            />
          </div>

          {showProductSelector && (
            <div className="space-y-2">
              <Label htmlFor="product">Produto (opcional)</Label>
              <Select value={productSlug} onValueChange={setProductSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os produtos</SelectItem>
                  {products?.map((product) => (
                    <SelectItem key={product.slug} value={product.slug}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
              {goal ? "Salvar" : "Criar Meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
