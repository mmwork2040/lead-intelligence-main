import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMergeLogs, useReviewMerge } from "@/hooks/useLeadUnification";
import { GitMerge, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MergeLogsTimelineProps {
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

export function MergeLogsTimeline({ leadId }: MergeLogsTimelineProps) {
  const { data: logs, isLoading } = useMergeLogs(leadId);
  const reviewMutation = useReviewMerge();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="h-5 w-5" />
          <h3 className="font-semibold">Histórico de Unificações</h3>
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="h-5 w-5" />
          <h3 className="font-semibold">Histórico de Unificações</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhuma unificação registrada para este lead.
        </p>
      </Card>
    );
  }

  const handleReview = async (logId: string, approved: boolean) => {
    await reviewMutation.mutateAsync({ logId, reviewed: approved });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <GitMerge className="h-5 w-5" />
        <h3 className="font-semibold">Histórico de Unificações</h3>
        <Badge variant="secondary">{logs.length}</Badge>
      </div>

      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={log.id}>
            <div className="flex gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    log.reviewed ? "bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]" : "bg-[hsl(38,92%,50%)]"
                  }`}
                />
                {index < logs.length - 1 && (
                  <div className="w-px h-full bg-border my-1" />
                )}
              </div>

              {/* Log content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${reasonColors[log.merge_reason]} text-white dark:text-stone-900`}
                      variant="secondary"
                    >
                      {reasonLabels[log.merge_reason]}
                    </Badge>
                    {log.reviewed ? (
                      <Badge variant="outline" className="border-[hsl(160,55%,40%)] text-[hsl(160,55%,40%)] dark:border-[#CCFF00] dark:text-[#CCFF00]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Revisado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  Lead {log.merged_lead_id.substring(0, 8)}... foi unificado neste lead
                </p>

                {/* Conflitos */}
                {log.conflict_fields && log.conflict_fields.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 mb-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Conflitos detectados
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Campos com valores diferentes:{" "}
                        {log.conflict_fields.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dados do lead mesclado */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 rounded-lg p-3">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">
                      {(log.merged_data as any)?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">E-mail:</span>
                    <p className="font-medium">
                      {(log.merged_data as any)?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">
                      {(log.merged_data as any)?.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">
                      {(log.merged_data as any)?.cpf || "—"}
                    </p>
                  </div>
                </div>

                {/* Ações de revisão */}
                {!log.reviewed && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(log.id, true)}
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                )}

                {log.reviewed && log.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Revisado em{" "}
                    {format(new Date(log.reviewed_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>
            </div>
            {index < logs.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>
    </Card>
  );
}
