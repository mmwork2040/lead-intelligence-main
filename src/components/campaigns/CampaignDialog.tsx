import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { campaignSchema, type CampaignFormData } from "@/lib/validations";
import { slugify } from "@/lib/utils/slugify";
import { useCreateCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import { useProducts } from "@/hooks/useProducts";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"] & { is_active?: boolean };

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
}

const colorPresets = [
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#10B981", // green
  "#F59E0B", // yellow
  "#EF4444", // red
  "#EC4899", // pink
];

export function CampaignDialog({ open, onOpenChange, campaign }: CampaignDialogProps) {
  const [autoSlug, setAutoSlug] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [isActive, setIsActive] = useState(true);

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const { data: products } = useProducts();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      slug: "",
      start_date: "",
      end_date: "",
      color: colorPresets[0],
      products: [],
      ad_spend: 0,
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && nameValue && !campaign) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, autoSlug, setValue, campaign]);

  // Load campaign data when editing
  useEffect(() => {
    if (campaign && open) {
      reset({
        name: campaign.name,
        slug: campaign.slug,
        start_date: campaign.start_date || "",
        end_date: campaign.end_date || "",
        color: campaign.color || colorPresets[0],
        products: campaign.products || [],
        ad_spend: Number(campaign.ad_spend) || 0,
      });
      setSelectedProducts(campaign.products || []);
      setSelectedColor(campaign.color || colorPresets[0]);
      setIsActive(campaign.is_active !== false);
      setAutoSlug(false);
    } else if (!open) {
      reset();
      setSelectedProducts([]);
      setSelectedColor(colorPresets[0]);
      setIsActive(true);
      setAutoSlug(true);
      setCopied(false);
    }
  }, [campaign, open, reset]);

  const toggleProduct = (productSlug: string) => {
    const newProducts = selectedProducts.includes(productSlug)
      ? selectedProducts.filter((p) => p !== productSlug)
      : [...selectedProducts, productSlug];
    setSelectedProducts(newProducts);
    setValue("products", newProducts);
  };

  const copyTrackingCode = () => {
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}?project=${slugValue}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast.success("Código de rastreamento copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const campaignData = {
        name: data.name,
        slug: data.slug,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        color: selectedColor,
        products: selectedProducts,
        ad_spend: data.ad_spend || 0,
        is_active: isActive,
      };

      if (campaign) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          updates: campaignData,
        });
      } else {
        await createCampaign.mutateAsync(campaignData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving campaign:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          <DialogDescription>
            {campaign
              ? "Atualize as informações da campanha"
              : "Preencha as informações para criar uma nova campanha"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input id="name" {...register("name")} placeholder="Ex: Black Friday 2024" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (Identificador) *</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="black-friday-2024"
                onChange={(e) => {
                  setAutoSlug(false);
                  register("slug").onChange(e);
                }}
              />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              {slugValue && (
                <div className="mt-3 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Código de Rastreamento</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyTrackingCode}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <code className="text-xs bg-background px-3 py-2 rounded border border-border block">
                    ?project={slugValue}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Adicione este parâmetro aos seus links para rastrear leads desta campanha
                  </p>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input id="start_date" type="date" {...register("start_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Término</Label>
                <Input id="end_date" type="date" {...register("end_date")} />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Cor da Campanha</Label>
              <div className="flex gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-full transition-smooth hover:scale-110 border-2"
                    style={{
                      backgroundColor: color,
                      borderColor: selectedColor === color ? color : "transparent",
                      opacity: selectedColor === color ? 1 : 0.6,
                    }}
                    onClick={() => {
                      setSelectedColor(color);
                      setValue("color", color);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Investment */}
            <div className="space-y-2">
              <Label htmlFor="ad_spend">Investimento Inicial (R$)</Label>
              <Input
                id="ad_spend"
                type="number"
                step="0.01"
                {...register("ad_spend", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="text-base">Campanha Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Campanhas inativas não aparecem nos relatórios principais
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Products */}
            <div className="space-y-2">
              <Label>Produtos Vinculados</Label>
              <div className="grid grid-cols-2 gap-2 p-4 rounded-lg border border-border bg-muted/30 max-h-48 overflow-y-auto">
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <Badge
                      key={product.id}
                      variant={selectedProducts.includes(product.slug) ? "default" : "outline"}
                      className="cursor-pointer justify-start px-3 py-2"
                      onClick={() => toggleProduct(product.slug)}
                    >
                      {product.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-2">
                    Nenhum produto cadastrado ainda
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>
              {createCampaign.isPending || updateCampaign.isPending
                ? "Salvando..."
                : "Salvar Campanha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
