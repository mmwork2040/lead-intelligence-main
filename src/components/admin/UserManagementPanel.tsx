import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserManagementDialog } from "@/components/admin/UserManagementDialog";
import { InviteTeamDialog } from "@/components/admin/InviteTeamDialog";
import { useUsers } from "@/hooks/useUsers";
import { Users, Shield, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const getRoleBadgeVariant = (role?: string) => {
  switch (role) {
    case "admin": return "destructive" as const;
    case "commercial": return "default" as const;
    case "financial": return "secondary" as const;
    case "support": return "outline" as const;
    default: return "outline" as const;
  }
};

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "admin": return "Administrador";
    case "commercial": return "Comercial";
    case "financial": return "Financeiro";
    case "support": return "Suporte";
    default: return "Sem permissão";
  }
};

export function UserManagementPanel() {
  const { data: users, isLoading } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie contas, papéis e permissões de acesso ao sistema
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar Membro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setDialogOpen(true);
                        }}
                      >
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </CardContent>

      <UserManagementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={selectedUserId}
      />

      <InviteTeamDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </Card>
  );
}
