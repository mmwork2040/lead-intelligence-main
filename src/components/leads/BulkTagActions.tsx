import { useState } from "react";
import { Tag, Plus, Minus, X, UserCog, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useTags } from "@/hooks/useTags";
import { useBulkAddTag, useBulkRemoveTag, useBulkUpdateStatus, useBulkDeleteLeads } from "@/hooks/useBulkTagOperations";

interface BulkTagActionsProps {
  selectedLeadIds: string[];
  onClearSelection: () => void;
}

const CRM_STATUSES = [
  { value: "novo", label: "Novo", color: "bg-foreground/20" },
  { value: "lead", label: "Lead", color: "bg-primary" },
  { value: "engajado", label: "Engajado", color: "bg-[hsl(38,92%,50%)]" },
  { value: "qualificado", label: "Qualificado", color: "bg-[hsl(160,55%,40%)]" },
  { value: "negociando", label: "Negociando", color: "bg-[hsl(38,92%,50%)]" },
  { value: "comprador", label: "Comprador", color: "bg-[hsl(160,55%,40%)]" },
  { value: "perdido", label: "Perdido", color: "bg-destructive" },
];

export const BulkTagActions = ({ selectedLeadIds, onClearSelection }: BulkTagActionsProps) => {
  const { data: tags } = useTags();
  const bulkAddTag = useBulkAddTag();
  const bulkRemoveTag = useBulkRemoveTag();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkDeleteLeads = useBulkDeleteLeads();

  const [addPopoverOpen, setAddPopoverOpen] = useState(false);
  const [removePopoverOpen, setRemovePopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'add' | 'remove' | 'status' | 'delete';
    tagId?: string;
    tagName?: string;
    status?: string;
    statusLabel?: string;
  } | null>(null);

  const handleAddTag = (tagId: string, tagName: string) => {
    setAddPopoverOpen(false);
    setConfirmDialog({ open: true, action: 'add', tagId, tagName });
  };

  const handleRemoveTag = (tagId: string, tagName: string) => {
    setRemovePopoverOpen(false);
    setConfirmDialog({ open: true, action: 'remove', tagId, tagName });
  };

  const handleUpdateStatus = (status: string, statusLabel: string) => {
    setStatusPopoverOpen(false);
    setConfirmDialog({ open: true, action: 'status', status, statusLabel });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({ open: true, action: 'delete' });
  };

  const confirmAction = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.action === 'add' && confirmDialog.tagId) {
      await bulkAddTag.mutateAsync({ 
        leadIds: selectedLeadIds, 
        tagId: confirmDialog.tagId 
      });
    } else if (confirmDialog.action === 'remove' && confirmDialog.tagId) {
      await bulkRemoveTag.mutateAsync({ 
        leadIds: selectedLeadIds, 
        tagId: confirmDialog.tagId 
      });
    } else if (confirmDialog.action === 'status' && confirmDialog.status) {
      await bulkUpdateStatus.mutateAsync({
        leadIds: selectedLeadIds,
        status: confirmDialog.status
      });
    } else if (confirmDialog.action === 'delete') {
      await bulkDeleteLeads.mutateAsync({
        leadIds: selectedLeadIds
      });
    }

    setConfirmDialog(null);
    onClearSelection();
  };

  const isLoading = bulkAddTag.isPending || bulkRemoveTag.isPending || bulkUpdateStatus.isPending || bulkDeleteLeads.isPending;

  if (selectedLeadIds.length === 0) return null;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {selectedLeadIds.length} {selectedLeadIds.length === 1 ? "lead selecionado" : "leads selecionados"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Tag Button */}
          <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Tag</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-2" align="end">
              <p className="text-sm font-medium mb-2 px-2">Adicionar Tag</p>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {tags && tags.length > 0 ? (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => handleAddTag(tag.id, tag.name)}
                    >
                      <Badge
                        variant="outline"
                        style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tag cadastrada
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Remove Tag Button */}
          <Popover open={removePopoverOpen} onOpenChange={setRemovePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
                <Minus className="h-4 w-4" />
                <span className="hidden sm:inline">Tag</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-2" align="end">
              <p className="text-sm font-medium mb-2 px-2">Remover Tag</p>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {tags && tags.length > 0 ? (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => handleRemoveTag(tag.id, tag.name)}
                    >
                      <Badge
                        variant="outline"
                        style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tag cadastrada
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Update Status Button */}
          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Status</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="end">
              <p className="text-sm font-medium mb-2 px-2">Alterar Status CRM</p>
              <div className="space-y-1">
                {CRM_STATUSES.map((status) => (
                  <div
                    key={status.value}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleUpdateStatus(status.value, status.label)}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                    <span className="text-sm">{status.label}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Delete Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            disabled={isLoading}
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Excluir</span>
          </Button>

          {/* Clear Selection */}
          <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog?.open} 
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'add' && 'Adicionar Tag'}
              {confirmDialog?.action === 'remove' && 'Remover Tag'}
              {confirmDialog?.action === 'status' && 'Alterar Status'}
              {confirmDialog?.action === 'delete' && 'Excluir Leads'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'add' && (
                <>Tem certeza que deseja adicionar a tag "<strong>{confirmDialog?.tagName}</strong>" a {selectedLeadIds.length} leads?</>
              )}
              {confirmDialog?.action === 'remove' && (
                <>Tem certeza que deseja remover a tag "<strong>{confirmDialog?.tagName}</strong>" de {selectedLeadIds.length} leads?</>
              )}
              {confirmDialog?.action === 'status' && (
                <>Tem certeza que deseja alterar o status de {selectedLeadIds.length} leads para "<strong>{confirmDialog?.statusLabel}</strong>"?</>
              )}
              {confirmDialog?.action === 'delete' && (
                <>
                  <span className="text-destructive font-medium">Atenção: Esta ação não pode ser desfeita!</span>
                  <br /><br />
                  Tem certeza que deseja excluir permanentemente {selectedLeadIds.length} leads e todos os seus dados associados (eventos, tags, respostas de pesquisa)?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              disabled={isLoading}
              className={confirmDialog?.action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isLoading ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
