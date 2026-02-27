import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers, useUpdateUserRole, useRemoveUserRole } from "@/hooks/useUsers";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["app_role"];

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export function UserManagementDialog({
  open,
  onOpenChange,
  userId,
}: UserManagementDialogProps) {
  const { data: users } = useUsers();
  const updateRole = useUpdateUserRole();
  const removeRole = useRemoveUserRole();
  const [selectedRole, setSelectedRole] = useState<UserRole | "none">("none");

  const user = users?.find((u) => u.id === userId);

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    } else {
      setSelectedRole("none");
    }
  }, [user]);

  const handleSave = async () => {
    if (!userId) return;

    if (selectedRole === "none") {
      await removeRole.mutateAsync(userId);
    } else {
      await updateRole.mutateAsync({ userId, role: selectedRole as UserRole });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>
            Defina o nível de acesso para {user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Permissão</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole | "none")}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione uma permissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem permissão</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedRole === "admin" && "Acesso total ao sistema"}
              {selectedRole === "commercial" && "Acesso a leads, CRM e campanhas"}
              {selectedRole === "financial" && "Acesso a dados financeiros e relatórios"}
              {selectedRole === "support" && "Acesso a leads e atendimento"}
              {selectedRole === "none" && "Nenhum acesso especial ao sistema"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRole.isPending || removeRole.isPending}
          >
            Salvar Permissão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
