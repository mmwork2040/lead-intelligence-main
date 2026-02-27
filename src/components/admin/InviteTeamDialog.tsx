import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useCreateInvitation, useTeamInvitations, useDeleteInvitation } from "@/hooks/useTeamInvitations";
import { Copy, Check, Trash2, Mail, Clock, UserCheck, Link2 } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  commercial: "Comercial",
  financial: "Financeiro",
  support: "Suporte",
};

interface InviteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteTeamDialog({ open, onOpenChange }: InviteTeamDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("commercial");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const { data: invitations, isLoading } = useTeamInvitations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;

    try {
      await createInvitation.mutateAsync({ email, role });
      setEmail("");
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error("Erro ao criar convite");
    }
  };

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/auth?invite=${token}`;
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(getInviteLink(token));
    setCopiedToken(token);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const pendingInvitations = invitations?.filter((inv) => !inv.used_at) || [];
  const usedInvitations = invitations?.filter((inv) => inv.used_at) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Convidar Membro da Equipe
          </DialogTitle>
          <DialogDescription>
            Gere um link de convite para um membro da equipe. O cargo será atribuído automaticamente ao se cadastrar.
          </DialogDescription>
        </DialogHeader>

        {/* Create invitation form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email do membro</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="membro@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cargo</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createInvitation.isPending || !email}
          >
            {createInvitation.isPending ? "Criando..." : "Gerar Link de Convite"}
          </Button>
        </form>

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Convites pendentes ({pendingInvitations.length})
            </h4>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{inv.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {roleLabels[inv.role] || inv.role}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        Expira: {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyLink(inv.token)}
                    >
                      {copiedToken === inv.token ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteInvitation.mutate(inv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Used invitations */}
        {usedInvitations.length > 0 && (
          <div className="space-y-3 mt-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              Convites aceitos ({usedInvitations.length})
            </h4>
            <div className="space-y-2">
              {usedInvitations.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-success/5 border border-success/20"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-success flex-shrink-0" />
                    <span className="text-sm truncate">{inv.email}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {roleLabels[inv.role] || inv.role}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {new Date(inv.used_at!).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
