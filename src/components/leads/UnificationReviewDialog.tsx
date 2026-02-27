import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCheckDuplicates, useUnifyLeads } from "@/hooks/useLeadUnification";
import { useLead } from "@/hooks/useLeads";
import { Loader2, AlertTriangle, Check, X, Users, ArrowRight } from "lucide-react";

interface UnificationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}

const reasonLabels: Record<string, string> = {
  phone: "Telefone",
  email: "E-mail",
  cpf: "CPF",
  name_phone_partial: "Nome + 4 dígitos",
};

const reasonColors: Record<string, string> = {
  phone: "bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]",
  email: "bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]",
  cpf: "bg-[hsl(38,92%,50%)]",
  name_phone_partial: "bg-[hsl(38,92%,50%)]",
};

interface FieldConflict {
  field: string;
  masterValue: string | null;
  duplicateValue: string | null;
  duplicateLeadId: string;
}

const fieldLabels: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  cpf: "CPF",
  city: "Cidade",
  state: "Estado",
  source: "Origem",
  utm_source: "UTM Source",
  utm_campaign: "UTM Campaign",
};

export function UnificationReviewDialog({
  open,
  onOpenChange,
  leadId,
}: UnificationReviewDialogProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"review" | "conflicts">("review");
  
  const { data: masterLead } = useLead(leadId);
  const { data: checkResult, isLoading } = useCheckDuplicates(leadId);
  const unifyMutation = useUnifyLeads();

  const duplicates = checkResult?.duplicates || [];
  const hasConflicts = duplicates.some((d) => d.reason === "name_phone_partial");

  // Detect field conflicts between master lead and duplicates
  const getConflicts = (): FieldConflict[] => {
    if (!masterLead) return [];
    
    const conflicts: FieldConflict[] = [];
    const fieldsToCheck = ["name", "email", "phone", "cpf", "city", "state", "source", "utm_source", "utm_campaign"];
    
    duplicates.forEach((duplicate) => {
      fieldsToCheck.forEach((field) => {
        const masterValue = (masterLead as unknown as Record<string, string | null>)[field];
        const duplicateValue = (duplicate as unknown as Record<string, string | null>)[field];
        
        // Only flag as conflict if both have values and they differ
        if (masterValue && duplicateValue && masterValue !== duplicateValue) {
          conflicts.push({
            field,
            masterValue,
            duplicateValue,
            duplicateLeadId: duplicate.lead_id,
          });
        }
      });
    });
    
    return conflicts;
  };

  const conflicts = getConflicts();

  const handleUnify = async () => {
    // If there are unresolved conflicts, go to conflict resolution step
    if (conflicts.length > 0 && step === "review") {
      // Initialize selected values with master lead values by default
      const initialSelections: Record<string, string> = {};
      conflicts.forEach((conflict) => {
        const key = `${conflict.field}_${conflict.duplicateLeadId}`;
        initialSelections[key] = "master"; // Default to master value
      });
      setSelectedValues(initialSelections);
      setStep("conflicts");
      return;
    }

    await unifyMutation.mutateAsync({ leadId, autoMerge: true });
    onOpenChange(false);
    setStep("review");
    setSelectedValues({});
  };

  const handleBack = () => {
    setStep("review");
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("review");
    setSelectedValues({});
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unificação de Leads
          </DialogTitle>
          <DialogDescription>
            {step === "review" 
              ? "Leads duplicados encontrados. Revise e confirme a unificação."
              : "Resolva os conflitos de dados antes de unificar."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : duplicates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Check className="mx-auto h-12 w-12 text-[hsl(160,55%,40%)] dark:text-[#CCFF00] mb-4" />
            <p className="text-lg font-medium">Nenhuma duplicata encontrada</p>
            <p className="text-sm">Este lead não possui duplicatas no sistema.</p>
          </div>
        ) : step === "review" ? (
          <>
            {hasConflicts && (
              <div className="flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Atenção: Correspondência Fraca Detectada
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Alguns leads foram encontrados usando "Nome + 4 dígitos". Revise cuidadosamente
                    antes de unificar.
                  </p>
                </div>
              </div>
            )}

            {/* Master Lead Info */}
            {masterLead && (
              <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary text-primary-foreground">Lead Principal</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{masterLead.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">E-mail:</span>
                    <p className="font-medium">{masterLead.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{masterLead.phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">{masterLead.cpf || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {duplicates.map((duplicate) => (
                  <div
                    key={duplicate.lead_id}
                    className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${reasonColors[duplicate.reason]} text-white dark:text-stone-900`}
                          variant="secondary"
                        >
                          {reasonLabels[duplicate.reason]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(duplicate.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nome:</span>
                        <p className="font-medium">{duplicate.name || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">E-mail:</span>
                        <p className="font-medium">{duplicate.email || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Telefone:</span>
                        <p className="font-medium">{duplicate.phone || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CPF:</span>
                        <p className="font-medium">{duplicate.cpf || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>
                  {duplicates.length} lead(s) duplicado(s) será(ão) unificado(s).
                </p>
                {conflicts.length > 0 && (
                  <p className="text-xs mt-1 text-yellow-600">
                    {conflicts.length} conflito(s) de dados para resolver.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleUnify}
                  disabled={unifyMutation.isPending}
                  className="bg-primary"
                >
                  {conflicts.length > 0 ? (
                    <>
                      Resolver Conflitos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : unifyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unificando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Unificar Leads
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Conflict Resolution Step */
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Selecione qual valor manter para cada campo em conflito:
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {conflicts.map((conflict) => {
                  const key = `${conflict.field}_${conflict.duplicateLeadId}`;
                  return (
                    <div key={key} className="rounded-lg border p-4">
                      <Label className="text-sm font-medium mb-3 block">
                        {fieldLabels[conflict.field] || conflict.field}
                      </Label>
                      <RadioGroup
                        value={selectedValues[key] || "master"}
                        onValueChange={(value) => 
                          setSelectedValues(prev => ({ ...prev, [key]: value }))
                        }
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2 p-2 rounded border bg-primary/5">
                          <RadioGroupItem value="master" id={`${key}-master`} />
                          <Label htmlFor={`${key}-master`} className="flex-1 cursor-pointer">
                            <span className="text-xs text-muted-foreground">Lead Principal:</span>
                            <p className="font-medium">{conflict.masterValue}</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded border">
                          <RadioGroupItem value="duplicate" id={`${key}-duplicate`} />
                          <Label htmlFor={`${key}-duplicate`} className="flex-1 cursor-pointer">
                            <span className="text-xs text-muted-foreground">Lead Duplicado:</span>
                            <p className="font-medium">{conflict.duplicateValue}</p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button
                onClick={handleUnify}
                disabled={unifyMutation.isPending}
                className="bg-primary"
              >
                {unifyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Unificando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Unificação
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
