import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus, Workflow, Settings, Trash2, Edit } from "lucide-react";

export default function Funnels() {
    const navigate = useNavigate();

    // Fetch funnels
    const { data: funnels, isLoading } = useQuery({
        queryKey: ["funnels"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('funnels')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching funnels:", error);
                throw error;
            }
            return data || [];
        },
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                            <Workflow className="w-8 h-8 text-primary" />
                            Funis de Vendas
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Gerencie e acompanhe a conversão de cada etapa das suas campanhas.
                        </p>
                    </div>
                    <Button className="shrink-0 gap-2 shadow-sh-sm rounded-xl" onClick={() => navigate("/funnels/new")}>
                        <Plus className="w-4 h-4" />
                        Novo Funil
                    </Button>
                </div>

                <Card className="border-border/50 shadow-sh-sm rounded-2xl overflow-hidden glass">
                    <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Workflow className="w-5 h-5 text-primary" />
                            Meus Funis
                        </CardTitle>
                        <CardDescription>Visualização de todos os funis configurados</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b-border/50">
                                    <TableHead className="w-[300px]">Nome do Funil</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : funnels?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Workflow className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Nenhum funil configurado ainda.</p>
                                                <Button variant="link" onClick={() => navigate("/funnels/new")} className="mt-2 text-primary">
                                                    Crie o seu primeiro funil
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    funnels?.map((funnel) => (
                                        <TableRow key={funnel.id} className="group hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/funnels/${funnel.id}`)}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{funnel.name}</span>
                                                    {funnel.description && (
                                                        <span className="text-xs text-muted-foreground line-clamp-1">{funnel.description}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={funnel.is_active ? "default" : "secondary"} className={funnel.is_active ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : ""}>
                                                    {funnel.is_active ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(funnel.created_at).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/funnels/${funnel.id}`); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); /* TODO: Delete */ }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
