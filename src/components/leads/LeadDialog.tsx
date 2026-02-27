import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { leadSchema, type LeadFormData } from "@/lib/validations";
import { useCreateLead, useUpdateLead } from "@/hooks/useLeads";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useTags } from "@/hooks/useTags";
import { fetchAddressByCEP } from "@/lib/cep";
import { toast } from "sonner";
import { getCampaignStatus, getCampaignStatusBadge } from "@/lib/translations";
import type { Database } from "@/integrations/supabase/types";

// Função para formatar telefone visualmente
function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  
  // Com DDI (55)
  if (digits.startsWith("55") && digits.length > 2) {
    const ddi = digits.slice(0, 2);
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    
    if (rest.length <= 4) {
      return `+${ddi} (${ddd}) ${rest}`;
    } else if (rest.length <= 8) {
      return `+${ddi} (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    } else {
      return `+${ddi} (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
    }
  }
  
  // Sem DDI (formato brasileiro)
  if (digits.length <= 2) {
    return `(${digits}`;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
}

// Validar se telefone está em formato válido
function getPhoneValidationStatus(value: string): { valid: boolean; message: string } {
  const digits = value.replace(/\D/g, "");
  
  if (digits.length === 0) {
    return { valid: false, message: "" };
  }
  
  if (digits.length < 10) {
    return { valid: false, message: "Número incompleto" };
  }
  
  if (digits.length > 15) {
    return { valid: false, message: "Número muito longo" };
  }
  
  // Validar DDD brasileiro (11-99)
  const ddd = digits.startsWith("55") ? digits.slice(2, 4) : digits.slice(0, 2);
  const dddNum = parseInt(ddd, 10);
  if (dddNum < 11 || dddNum > 99) {
    return { valid: false, message: "DDD inválido" };
  }
  
  return { valid: true, message: "Telefone válido" };
}

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadDialog({ open, onOpenChange, lead }: LeadDialogProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { data: campaigns = [] } = useCampaigns();
  const { data: existingTags = [] } = useTags();
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      source: "manual",
      crm_status: "lead",
      utm_source: "",
      utm_campaign: "",
      utm_medium: "",
      utm_content: "",
      utm_term: "",
      project_slug: "",
      zip_code: "",
      street: "",
      street_number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "Brasil",
      region: "",
      gender: "",
      birth_date: "",
    },
  });

  const sourceValue = watch("source");
  const zipCode = watch("zip_code");

  // Auto-fill address from CEP
  const handleCEPBlur = async () => {
    if (!zipCode || loadingCEP) return;
    
    setLoadingCEP(true);
    const addressData = await fetchAddressByCEP(zipCode);
    setLoadingCEP(false);

    if (addressData) {
      setValue("street", addressData.street);
      setValue("neighborhood", addressData.neighborhood);
      setValue("city", addressData.city);
      setValue("state", addressData.state);
      setValue("region", addressData.region);
      toast.success("Endereço preenchido automaticamente");
    } else {
      toast.error("CEP não encontrado");
    }
  };

  // Load lead data when editing
  useEffect(() => {
    if (lead && open) {
      reset({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        cpf: lead.cpf || "",
        source: lead.source || "manual",
        crm_status: lead.crm_status || "lead",
        utm_source: lead.utm_source || "",
        utm_campaign: lead.utm_campaign || "",
        utm_medium: lead.utm_medium || "",
        utm_content: lead.utm_content || "",
        utm_term: lead.utm_term || "",
        project_slug: lead.project_slug || "",
        zip_code: (lead as any).zip_code || "",
        street: (lead as any).street || "",
        street_number: (lead as any).street_number || "",
        complement: (lead as any).complement || "",
        neighborhood: (lead as any).neighborhood || "",
        city: (lead as any).city || "",
        state: (lead as any).state || "",
        country: (lead as any).country || "Brasil",
        region: (lead as any).region || "",
        gender: (lead as any).gender || "",
        birth_date: (lead as any).birth_date || "",
      });
      // Reset tags state
      setSelectedTagIds([]);
      setNewTags([]);
    } else if (!open) {
      reset();
      setSelectedTagIds([]);
      setNewTags([]);
      setNewTagInput("");
    }
  }, [lead, open, reset]);

  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    const normalized = newTagInput.trim().toLowerCase();
    if (newTags.includes(normalized)) return;
    setNewTags([...newTags, normalized]);
    setNewTagInput("");
  };

  const handleRemoveNewTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleToggleExistingTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    try {
      if (lead) {
        await updateLead.mutateAsync({
          leadId: lead.lead_id,
          updates: data,
        });
      } else {
        // Get created_at from form if provided
        const createdAtValue = (data as any).created_at;
        const createdAt = createdAtValue ? new Date(createdAtValue).toISOString() : undefined;
        
        await createLead.mutateAsync({
          ...data,
          created_at: createdAt,
          tags: selectedTagIds,
          newTags: newTags,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving lead:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          <DialogDescription>
            {lead
              ? "Atualize as informações do lead"
              : "Preencha as informações para criar um novo lead manualmente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="space-y-4">
            {/* Basic Info */}
            <fieldset className="space-y-4">
              <legend className="font-semibold text-sm">Informações Básicas</legend>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  Nome Completo <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input 
                  id="name" 
                  {...register("name")} 
                  placeholder="João Silva"
                  variant={errors.name ? "error" : undefined}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    Email <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    {...register("email")} 
                    placeholder="joao@email.com"
                    variant={errors.email ? "error" : undefined}
                    aria-invalid={errors.email ? "true" : undefined}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    Telefone <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="phone" 
                      {...register("phone", {
                        onChange: (e) => {
                          const formatted = formatPhoneDisplay(e.target.value);
                          e.target.value = formatted;
                        }
                      })} 
                      placeholder="(11) 99999-9999 ou +55 11 99999-9999"
                      variant={errors.phone ? "error" : undefined}
                      aria-invalid={errors.phone ? "true" : undefined}
                      aria-describedby="phone-error phone-hint"
                      className="pr-10"
                    />
                    {watch("phone") && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getPhoneValidationStatus(watch("phone")).valid ? (
                          <CheckCircle2 className="h-4 w-4 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.phone ? (
                    <p id="phone-error" className="text-sm text-destructive" role="alert">
                      {errors.phone.message}
                    </p>
                  ) : watch("phone") && !getPhoneValidationStatus(watch("phone")).valid ? (
                    <p id="phone-hint" className="text-sm text-amber-600 dark:text-amber-400">
                      {getPhoneValidationStatus(watch("phone")).message}
                    </p>
                  ) : (
                    <p id="phone-hint" className="text-xs text-muted-foreground">
                      Com DDI: +55 11 99999-9999 | Sem DDI: (11) 99999-9999
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input 
                  id="cpf" 
                  {...register("cpf")} 
                  placeholder="000.000.000-00"
                  variant={errors.cpf ? "error" : undefined}
                />
                {errors.cpf && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.cpf.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Origem</Label>
                <Select value={sourceValue} onValueChange={(value) => setValue("source", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Cadastro Manual</SelectItem>
                    <SelectItem value="import">Importação</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="manychat">ManyChat</SelectItem>
                    <SelectItem value="n8n">N8N</SelectItem>
                    <SelectItem value="tracking_pixel">Tracking Pixel</SelectItem>
                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                    <SelectItem value="organic">Orgânico</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email Marketing</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm_status">Status CRM</Label>
                <Select 
                  value={watch("crm_status") || "lead"} 
                  onValueChange={(value) => setValue("crm_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead Capturado</SelectItem>
                    <SelectItem value="engajado">Engajado</SelectItem>
                    <SelectItem value="aquecido">Aquecido</SelectItem>
                    <SelectItem value="carrinho">Carrinho</SelectItem>
                    <SelectItem value="comprador">Comprador</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground" id="crm-status-description">
                  Status atual do lead no funil de infoprodutos
                </p>
              </div>
            </fieldset>

            <fieldset className="space-y-4 pt-4 border-t border-border">
              <legend className="font-semibold text-sm">Parâmetros de Origem (Opcional)</legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm_source">UTM Source</Label>
                  <Input id="utm_source" {...register("utm_source")} placeholder="Meta Ads" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utm_campaign">UTM Campaign</Label>
                  <Input id="utm_campaign" {...register("utm_campaign")} placeholder="black-friday" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utm_medium">UTM Medium</Label>
                  <Input id="utm_medium" {...register("utm_medium")} placeholder="cpc" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utm_content">UTM Content</Label>
                  <Input id="utm_content" {...register("utm_content")} placeholder="carousel-video" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utm_term">UTM Term</Label>
                <Input
                  id="utm_term"
                  {...register("utm_term")}
                  placeholder="marketing digital"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_slug">Campanha Associada</Label>
                <Select 
                  value={watch("project_slug") || ""} 
                  onValueChange={(value) => setValue("project_slug", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma campanha</SelectItem>
                    <SelectItem value={`vendas-mes-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}>
                      📅 Vendas do Mês ({new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })})
                    </SelectItem>
                    {campaigns.map((campaign) => {
                      const status = getCampaignStatus(campaign);
                      const badge = getCampaignStatusBadge(status);
                      return (
                        <SelectItem key={campaign.id} value={campaign.slug}>
                          {badge} {campaign.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground" id="project-slug-description">
                  Selecione a campanha para associar este lead
                </p>
              </div>
            </fieldset>

            <fieldset className="space-y-4 pt-4 border-t border-border">
              <legend className="font-semibold text-sm">Endereço (Opcional)</legend>


              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input 
                  id="zip_code" 
                  {...register("zip_code")} 
                  placeholder="00000-000"
                  onBlur={handleCEPBlur}
                  disabled={loadingCEP}
                />
                {loadingCEP && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
                {errors.zip_code && <p className="text-sm text-destructive">{errors.zip_code.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="street">Logradouro</Label>
                  <Input id="street" {...register("street")} placeholder="Rua das Flores" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street_number">Número</Label>
                  <Input id="street_number" {...register("street_number")} placeholder="123" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" {...register("complement")} placeholder="Apto 45" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input id="neighborhood" {...register("neighborhood")} placeholder="Centro" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...register("city")} placeholder="São Paulo" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input id="state" {...register("state")} placeholder="SP" maxLength={2} />
                  {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input id="country" {...register("country")} placeholder="Brasil" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Região</Label>
                  <Input id="region" {...register("region")} placeholder="Sudeste" disabled />
                  <p className="text-xs text-muted-foreground" id="region-description">
                    Preenchido automaticamente
                  </p>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 pt-4 border-t border-border">
              <legend className="font-semibold text-sm">Dados Demográficos (Opcional)</legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select 
                    value={watch("gender") || ""} 
                    onValueChange={(value) => setValue("gender", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="nao_informado">Não informado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input id="birth_date" type="date" {...register("birth_date")} />
                  {errors.birth_date && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.birth_date.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Tags Section - Only for new leads */}
            {!lead && (
              <fieldset className="space-y-4 pt-4 border-t border-border">
                <legend className="font-semibold text-sm">Tags (Opcional)</legend>

                {/* Add new tags */}
                <div>
                  <Label className="text-sm">Criar novas tags</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nome da tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddNewTag} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  {newTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="cursor-pointer"
                          onClick={() => handleRemoveNewTag(tag)}
                        >
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Existing tags */}
                {existingTags.length > 0 && (
                  <div>
                    <Label className="text-sm">Tags existentes</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {existingTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleToggleExistingTag(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>
            )}

            {/* Custom creation date - Only for new leads */}
            {!lead && (
              <fieldset className="space-y-4 pt-4 border-t border-border">
                <legend className="font-semibold text-sm">Data de Cadastro (Opcional)</legend>

                <div className="space-y-2">
                  <Label htmlFor="created_at">Data de criação do lead</Label>
                  <Input 
                    id="created_at" 
                    type="datetime-local" 
                    {...register("created_at" as any)} 
                  />
                  <p className="text-xs text-muted-foreground">
                    Se não preenchido, será usada a data/hora atual
                  </p>
                </div>
              </fieldset>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLead.isPending || updateLead.isPending}>
              {createLead.isPending || updateLead.isPending ? "Salvando..." : "Salvar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
