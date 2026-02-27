import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
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
import { useCampaignGoals, useDeleteCampaignGoal, type CampaignGoal } from "@/hooks/useCampaignGoals";
import { CampaignGoalProgress } from "./CampaignGoalProgress";
import { CampaignGoalDialog } from "./CampaignGoalDialog";

interface CampaignGoalsSectionProps {
  campaignId: string;
  campaignStartDate: string;
  campaignEndDate: string;
}

export function CampaignGoalsSection({ 
  campaignId, 
  campaignStartDate, 
  campaignEndDate 
}: CampaignGoalsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const { data: goals, isLoading } = useCampaignGoals(campaignId);
  const deleteGoal = useDeleteCampaignGoal();

  const handleEdit = (goal: CampaignGoal) => {
    setSelectedGoal(goal);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setGoalToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (goalToDelete) {
      await deleteGoal.mutateAsync({ id: goalToDelete, campaign_id: campaignId });
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const handleNewGoal = () => {
    setSelectedGoal(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4" />
            Metas
          </div>
        </div>
        <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4" />
            Metas
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5"
            onClick={handleNewGoal}
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </Button>
        </div>

        {goals && goals.length > 0 ? (
          <div className="space-y-2">
            {goals.map((goal) => (
              <CampaignGoalProgress
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border text-center">
            <p className="text-xs text-muted-foreground">
              Nenhuma meta definida
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs mt-1"
              onClick={handleNewGoal}
            >
              Adicionar primeira meta
            </Button>
          </div>
        )}
      </div>

      <CampaignGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={campaignId}
        campaignStartDate={campaignStartDate}
        campaignEndDate={campaignEndDate}
        goal={selectedGoal}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
