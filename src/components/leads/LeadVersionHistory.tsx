import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, RotateCcw, Eye, Clock } from "lucide-react";
import { useLeadVersions, useRestoreLeadVersion, type LeadVersion } from "@/hooks/useLeadVersions";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeadVersionHistoryProps {
  leadId: string;
}

export function LeadVersionHistory({ leadId }: LeadVersionHistoryProps) {
  const { data: versions, isLoading } = useLeadVersions(leadId);
  const restoreVersion = useRestoreLeadVersion();
  const [selectedVersion, setSelectedVersion] = useState<LeadVersion | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<LeadVersion | null>(null);

  const handleRestore = async () => {
    if (!versionToRestore) return;
    
    await restoreVersion.mutateAsync({
      leadId,
      versionData: versionToRestore.data,
    });
    
    setRestoreDialogOpen(false);
    setVersionToRestore(null);
  };

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse bg-muted/30">
        <div className="h-20" />
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Nenhuma versão anterior registrada
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          As versões serão salvas automaticamente ao editar o lead
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Histórico de Versões</h4>
          <Badge variant="secondary" className="text-xs">
            {versions.length} {versions.length === 1 ? "versão" : "versões"}
          </Badge>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {versions.map((version, index) => (
              <Card
                key={version.id}
                className="p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        v{version.version_number}
                      </Badge>
                      {index === 0 && (
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                          Última
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(version.changed_at).toLocaleString("pt-BR")}
                    </div>
                    {version.change_summary && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {version.change_summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:text-primary"
                      onClick={() => {
                        setVersionToRestore(version);
                        setRestoreDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Versão {selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              Salva em {selectedVersion && new Date(selectedVersion.changed_at).toLocaleString("pt-BR")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] mt-4">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">Nome</span>
                  <p className="font-medium">{selectedVersion?.data.name || "-"}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <p className="font-medium truncate">{selectedVersion?.data.email || "-"}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">Telefone</span>
                  <p className="font-medium">{selectedVersion?.data.phone || "-"}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">CPF</span>
                  <p className="font-medium">{selectedVersion?.data.cpf || "-"}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">Status CRM</span>
                  <p className="font-medium">{selectedVersion?.data.crm_status || "-"}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">Origem</span>
                  <p className="font-medium">{selectedVersion?.data.source || "-"}</p>
                </div>
              </div>

              {selectedVersion?.change_summary && (
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">Resumo da alteração</span>
                  <p className="font-medium">{selectedVersion.change_summary}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedVersion(null)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setVersionToRestore(selectedVersion);
                setSelectedVersion(null);
                setRestoreDialogOpen(true);
              }}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar esta versão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar versão anterior?</AlertDialogTitle>
            <AlertDialogDescription>
              O estado atual do lead será salvo antes de restaurar.
              Você poderá desfazer esta ação restaurando a versão mais recente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreVersion.isPending}
            >
              {restoreVersion.isPending ? "Restaurando..." : "Restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
