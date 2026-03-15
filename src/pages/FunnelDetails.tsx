import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Plus, Settings, BarChart3, Workflow, Save, Trash2, Users, Search, Eye, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Code2, BookOpen, Link as LinkIcon, CheckCircle2 } from "lucide-react";

export default function FunnelDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const isNew = id === 'new';

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<any>(null);

    // Local state for funnel creation
    const [funnelName, setFunnelName] = useState("");
    const [funnelDesc, setFunnelDesc] = useState("");
    const [funnelActive, setFunnelActive] = useState(true);

    // Local state for steps
    const [stepsList, setStepsList] = useState([
        { id: '1', step_order: 1, name: "Landing Page", url_pattern: "/*", event_name: "", is_conversion_point: false },
        { id: '2', step_order: 2, name: "Checkout", url_pattern: "/checkout*", event_name: "", is_conversion_point: false },
        { id: '3', step_order: 3, name: "Obrigado (Compra)", url_pattern: "*/obrigado*", event_name: "PURCHASE", is_conversion_point: true },
    ]);

    // Fetch funnel details
    const { data: funnel, isLoading: isLoadingFunnel } = useQuery({
        queryKey: ["funnel", id],
        queryFn: async () => {
            if (isNew) return null;
            const { data, error } = await supabase
                .from('funnels')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !isNew,
    });

    // Fetch funnel steps
    const { data: steps, isLoading: isLoadingSteps } = useQuery({
        queryKey: ["funnel-steps", id],
        queryFn: async () => {
            if (isNew) return [];
            const { data, error } = await supabase
                .from('funnel_steps')
                .select('*')
                .eq('funnel_id', id)
                .order('step_order', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        enabled: !isNew,
    });

    // Create Funnel Mutation
    const createFunnelMutation = useMutation({
        mutationFn: async () => {
            // 1. Create Funnel
            const { data: newFunnel, error: funnelError } = await supabase
                .from('funnels')
                .insert({
                    name: funnelName,
                    description: funnelDesc,
                    is_active: funnelActive,
                })
                .select('id')
                .single();

            if (funnelError) throw funnelError;

            // 2. Create Steps
            const stepsToInsert = stepsList.map(s => ({
                funnel_id: newFunnel.id,
                step_order: s.step_order,
                name: s.name,
                url_pattern: s.url_pattern,
                event_name: s.event_name,
                is_conversion_point: s.is_conversion_point
            }));

            const { error: stepsError } = await supabase
                .from('funnel_steps')
                .insert(stepsToInsert);

            if (stepsError) throw stepsError;

            return newFunnel;
        },
        onSuccess: (data) => {
            toast.success("Funil criado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["funnels"] });
            navigate(`/funnels/${data.id}`, { replace: true });
        },
        onError: (error) => {
            console.error(error);
            toast.error("Erro ao criar funil.");
        }
    });

    // Add Step Mutation (View Mode)
    const addStepMutation = useMutation({
        mutationFn: async () => {
            const nextOrder = steps ? steps.length + 1 : 1;
            const { error } = await supabase
                .from('funnel_steps')
                .insert({
                    funnel_id: id,
                    step_order: nextOrder,
                    name: `Nova Etapa ${nextOrder}`,
                    url_pattern: "",
                    event_name: "",
                    is_conversion_point: false
                });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Nova etapa adicionada!");
            queryClient.invalidateQueries({ queryKey: ["funnel-steps", id] });
        },
        onError: (error) => {
            console.error(error);
            toast.error("Erro ao adicionar etapa.");
        }
    });

    // Update Step Mutation (View Mode)
    const updateStepMutation = useMutation({
        mutationFn: async (updatedStep: any) => {
            const { error } = await supabase
                .from('funnel_steps')
                .update({
                    name: updatedStep.name,
                    url_pattern: updatedStep.url_pattern,
                    event_name: updatedStep.event_name,
                    is_conversion_point: updatedStep.is_conversion_point
                })
                .eq('id', updatedStep.id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Etapa atualizada!");
            setEditingStep(null);
            queryClient.invalidateQueries({ queryKey: ["funnel-steps", id] });
        },
        onError: (error) => {
            console.error(error);
            toast.error("Erro ao atualizar etapa.");
        }
    });

    const handleDeleteStep = async (stepId: string) => {
        if (!confirm("Tem certeza que deseja remover esta etapa?")) return;

        try {
            const { error } = await supabase.from('funnel_steps').delete().eq('id', stepId);
            if (error) throw error;
            toast.success("Etapa removida!");
            queryClient.invalidateQueries({ queryKey: ["funnel-steps", id] });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover etapa.");
        }
    };

    const handleAddStep = () => {
        setStepsList(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                step_order: prev.length + 1,
                name: `Nova Etapa ${prev.length + 1}`,
                url_pattern: "",
                event_name: "",
                is_conversion_point: false
            }
        ]);
    };

    const handleUpdateStep = (index: number, field: string, value: any) => {
        const updated = [...stepsList];
        updated[index] = { ...updated[index], [field]: value };
        setStepsList(updated);
    };

    const handleRemoveStep = (index: number) => {
        const updated = stepsList.filter((_, i) => i !== index);
        // Reorder
        const reordered = updated.map((s, i) => ({ ...s, step_order: i + 1 }));
        setStepsList(reordered);
    };

    const handleSave = () => {
        if (!funnelName.trim()) {
            toast.error("O nome do funil é obrigatório.");
            return;
        }
        if (stepsList.length === 0) {
            toast.error("Adicione pelo menos uma etapa.");
            return;
        }

        createFunnelMutation.mutate();
    };

    // Fetch captured leads with metadata
    const { data: funnelLeads, isLoading: isLoadingLeads } = useQuery({
        queryKey: ["funnel-leads", id],
        queryFn: async () => {
            if (isNew) return [];

            const { data: routeSteps, error: stepError } = await supabase
                .from('funnel_steps')
                .select('id')
                .eq('funnel_id', id);

            if (stepError) throw stepError;
            if (!routeSteps || routeSteps.length === 0) return [];

            const stepIds = routeSteps.map((s: any) => s.id);

            const { data: events, error: eventsError } = await supabase
                .from('tracking_events')
                .select(`
                    id,
                    metadata,
                    created_at,
                    lead:leads (
                        id,
                        name,
                        email,
                        phone,
                        created_at
                    )
                `)
                .in('funnel_step_id', stepIds)
                .not('lead_id', 'is', null)
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;

            const leadsMap = new Map();
            events?.forEach((evt: any) => {
                if (!evt.lead) return;
                const leadData = Array.isArray(evt.lead) ? evt.lead[0] : evt.lead;
                if (!leadData) return;

                const existing = leadsMap.get(leadData.id) || {
                    ...leadData,
                    interactions: 0,
                    capturedData: {}
                };

                existing.interactions += 1;

                if (evt.metadata && typeof evt.metadata === 'object') {
                    existing.capturedData = {
                        ...(evt.metadata as object),
                        ...existing.capturedData,
                    };
                }

                leadsMap.set(leadData.id, existing);
            });

            return Array.from(leadsMap.values());
        },
        enabled: !isNew,
    });

    const isLoading = isLoadingFunnel || isLoadingSteps || isLoadingLeads;

    if (isNew) {
        return (
            <DashboardLayout>
                <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/funnels")} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold tracking-tight">Criar Novo Funil</h1>
                            <p className="text-muted-foreground">Configure os passos que os leads devem percorrer.</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={createFunnelMutation.isPending}
                            className="shadow-sh-sm rounded-xl gap-2"
                        >
                            {createFunnelMutation.isPending ? "Salvando..." : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Funil
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="glass rounded-2xl shadow-sh-sm">
                                <CardHeader className="bg-muted/20 border-b border-border/50">
                                    <CardTitle className="text-lg">Informações Gerais</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="funnel-name">Nome do Funil</Label>
                                        <Input
                                            id="funnel-name"
                                            placeholder="Ex: Funil de Lançamento"
                                            value={funnelName}
                                            onChange={e => setFunnelName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="funnel-desc">Descrição</Label>
                                        <Textarea
                                            id="funnel-desc"
                                            placeholder="Objetivo principal deste funil..."
                                            className="resize-none"
                                            value={funnelDesc}
                                            onChange={e => setFunnelDesc(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <Label htmlFor="active-status" className="cursor-pointer">Ativar Imediatamente</Label>
                                        <Switch
                                            id="active-status"
                                            checked={funnelActive}
                                            onCheckedChange={setFunnelActive}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Steps Builder */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="glass rounded-2xl shadow-sh-sm">
                                <CardHeader className="bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between py-4">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Workflow className="w-5 h-5 text-primary" />
                                            Etapas do Funil
                                        </CardTitle>
                                        <CardDescription>Defina a jornada do visitante (topo, meio e fundo de funil)</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleAddStep} className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Nova Etapa
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6 overflow-hidden">
                                    <div className="flex overflow-x-auto pb-6 pt-2 px-2 items-start gap-6 hide-scrollbar cursor-grab active:cursor-grabbing">
                                        {stepsList.map((step, index) => (
                                            <div key={step.id} className="flex items-center gap-6 shrink-0">
                                                <div className="flex flex-col items-center gap-4 relative w-[320px]">
                                                    {/* Step Number Circle */}
                                                    <div className="relative z-10 w-10 h-10 rounded-full glass flex items-center justify-center shrink-0 border border-primary/20 text-base font-bold text-primary">
                                                        {step.step_order}
                                                    </div>

                                                    {/* Step Editor Card */}
                                                    <Card className="w-full flex-1 border-[var(--glass-border-subtle)] hover:border-border transition-colors group">
                                                        <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-border/50 bg-muted/10">
                                                            <Input
                                                                value={step.name}
                                                                onChange={(e) => handleUpdateStep(index, 'name', e.target.value)}
                                                                className="font-semibold text-base max-w-[220px] h-8 shrink-0"
                                                                placeholder="Nome da Etapa"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                                onClick={() => handleRemoveStep(index)}
                                                                disabled={stepsList.length === 1}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </CardHeader>
                                                        <CardContent className="p-4 space-y-4">
                                                            <div className="space-y-3">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider">Mapeamento por URL (Padrão)</Label>
                                                                    <Input
                                                                        value={step.url_pattern || ""}
                                                                        onChange={(e) => handleUpdateStep(index, 'url_pattern', e.target.value)}
                                                                        placeholder="Ex: */checkout/*"
                                                                        className="h-8 text-sm font-mono placeholder:text-muted-foreground/50"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider">Mapeamento por Evento (Opcional)</Label>
                                                                    <Input
                                                                        value={step.event_name || ""}
                                                                        onChange={(e) => handleUpdateStep(index, 'event_name', e.target.value)}
                                                                        placeholder="Ex: PURCHASE"
                                                                        className="h-8 text-sm font-mono placeholder:text-muted-foreground/50"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-2 pt-3 border-t border-border/50">
                                                                <Switch
                                                                    id={`conversion-${step.id}`}
                                                                    checked={step.is_conversion_point}
                                                                    onCheckedChange={(val) => handleUpdateStep(index, 'is_conversion_point', val)}
                                                                    className="scale-75 origin-left"
                                                                />
                                                                <Label htmlFor={`conversion-${step.id}`} className="text-xs text-primary font-medium cursor-pointer">
                                                                    Marcar como Ponto de Conversão
                                                                </Label>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                {/* Arrow Separator */}
                                                {index < stepsList.length - 1 && (
                                                    <div className="flex-shrink-0 text-muted-foreground/30 mt-14">
                                                        <ArrowRight className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // --- View Mode / Analytics Mode ---
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/funnels")} className="rounded-full shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            {isLoading ? (
                                <Skeleton className="h-10 w-64 mb-2" />
                            ) : (
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
                                    {funnel?.name}
                                </h1>
                            )}
                            {isLoading ? (
                                <Skeleton className="h-5 w-48" />
                            ) : (
                                <p className="text-muted-foreground text-lg">
                                    {funnel?.description || "Acompanhe as taxas de conversão entre cada passo."}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="shadow-sh-sm rounded-xl gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Guia de Integração
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                        <Code2 className="w-6 h-6 text-primary" />
                                        Como configurar o Funil e o Tracking
                                    </DialogTitle>
                                    <DialogDescription className="text-base mt-2">
                                        Para que os funis acompanhem as visitas e as métricas de conversão perfeitamente, siga o guia passo-a-passo abaixo.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-8 mt-4">
                                    {/* Passo 1 */}
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">1</div>
                                            Instale o Script de Tracking
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Vá até a aba de <strong>Criador de Links e Traqueamento</strong>, copie o código JavaScript fornecido no botão <em>"Copiar Script de Tracking"</em>.
                                        </p>
                                        <div className="bg-muted p-4 rounded-xl border border-border/50 text-sm">
                                            Cole este código na tag <code>&lt;head&gt;</code> de <strong>todas as páginas</strong> do seu site (Landing Pages, Checkout, Página de Obrigado). Isso permite que nosso sistema gere o visitante anônimo e intercepte dados UTM e de formulários automaticamente.
                                        </div>
                                    </div>

                                    {/* Passo 2 */}
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">2</div>
                                            Configure as Etapas do Funil
                                        </h3>
                                        <p className="text-muted-foreground">
                                            O funil mapeia as páginas em que o script de tracking é ativado. Cada etapa adicionada aqui deve ter pelo menos uma regra:
                                        </p>
                                        <ul className="space-y-2 mt-2 ml-2">
                                            <li className="flex items-start gap-2 text-sm text-foreground">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <span><strong>Mapeamento por URL (Mais comum):</strong> Você diz a URL ou parte dela onde a pessoa deve estar. Exemplo: Se sua URL de Landing Page for <code>meusite.com/oferta</code>, digite <code>*/oferta*</code>. O asterisco atua como qualquer caractere.</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-foreground">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <span><strong>Pontos de Conversão:</strong> Ative o botão <em>"Marcar como Ponto de Conversão"</em> na última etapa do funil (Ex: Checkout concluído ou URL de Obrigado) para gerar a métrica de vendas e identificar compradores reais.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Passo 3 */}
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">3</div>
                                            Automação de Checkout (Backend)
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Para o fechamento de um evento de Purchase (Venda Concluída), instale o <strong>Webhook de Conversão Externa</strong> na sua plataforma (ex: Hotmart, Kiwify).
                                        </p>
                                        <div className="bg-muted/50 p-4 rounded-xl border-l-2 border-primary text-sm flex gap-3">
                                            <LinkIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                            <span>Assim que a conversão ocorre, a nossa API irá tentar "casar" os dados do seu rastreamento anônimo com o Email/Contato do pagamento, unindo e fechando a jornada analítica do cliente.</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button onClick={() => setIsConfigOpen(false)}>Entendido!</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            className="shadow-sh-sm rounded-xl gap-2"
                            onClick={() => addStepMutation.mutate()}
                            disabled={addStepMutation.isPending}
                        >
                            <Plus className="w-4 h-4" />
                            {addStepMutation.isPending ? "Adicionando..." : "Adicionar Etapa"}
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    {/* Funnel Map & Leads (Left Column - 2/3) */}
                    <div className="lg:col-span-2 space-y-4">
                        <Tabs defaultValue="map" className="w-full">
                            <TabsList className="mb-4 bg-muted/50 p-1 rounded-xl">
                                <TabsTrigger value="map" className="rounded-lg data-[state=active]:shadow-sm">Mapeamento</TabsTrigger>
                                <TabsTrigger value="leads" className="rounded-lg data-[state=active]:shadow-sm">Leads Captados</TabsTrigger>
                            </TabsList>

                            <TabsContent value="map" className="mt-0">
                                <Card className="border-border/50 shadow-sh-sm rounded-2xl glass overflow-hidden">
                                    <CardHeader className="border-b border-border/50 bg-muted/20">
                                        <CardTitle className="flex items-center gap-2">
                                            <Workflow className="w-5 h-5 text-primary" />
                                            Mapeamento do Funil
                                        </CardTitle>
                                        <CardDescription>Visualização do fluxo do cliente etapa por etapa</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {isLoading ? (
                                            <div className="space-y-4">
                                                {[1, 2, 3].map(i => (
                                                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                                ))}
                                            </div>
                                        ) : steps?.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
                                                <Workflow className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                                <h3 className="font-medium text-lg mb-1">Funil Vazio</h3>
                                                <p className="text-sm text-muted-foreground mb-4 max-w-sm">Adicione os passos da jornada de compra (Ex: Landing Page, Checkout, Obrigado) para começar a mapear a conversão.</p>
                                                <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10">
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Criar a primeira Etapa
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex overflow-x-auto pb-6 pt-4 px-2 items-center gap-6 hide-scrollbar cursor-grab active:cursor-grabbing">
                                                {steps?.map((step: any, index: number) => (
                                                    <div key={step.id} className="flex items-center gap-6 shrink-0">
                                                        <div className="flex flex-col items-center gap-4 relative w-[280px]">
                                                            {/* Step Number Circle */}
                                                            <div className="relative z-10 w-12 h-12 rounded-full glass flex items-center justify-center shrink-0 border border-primary/20 text-lg font-bold text-primary">
                                                                {step.step_order}
                                                            </div>

                                                            {/* Step Card */}
                                                            <div onClick={() => setEditingStep(step)} className="w-full cursor-pointer">
                                                                <Card className="w-full glass-high shadow-sh-sm border-[var(--glass-border-subtle)] hover:border-primary/50 transition-all group">
                                                                    <CardHeader className="bg-muted/10 pb-3 border-b border-border/50 flex flex-row items-center justify-between p-4 space-y-0 relative">
                                                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                                                                        <h3 className="font-semibold text-base truncate pr-2 relative z-10" title={step.name}>{step.name}</h3>
                                                                        {step.is_conversion_point ? (
                                                                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md shrink-0 border border-primary/20 relative z-10">
                                                                                Conversão Final
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md shrink-0 border border-border/50 relative z-10">
                                                                                Página
                                                                            </div>
                                                                        )}
                                                                    </CardHeader>
                                                                    <CardContent className="p-4 space-y-4">
                                                                        <div className="text-xs text-muted-foreground font-mono bg-muted/50 truncate px-2 py-1.5 rounded-md border border-border/50" title={step.url_pattern || step.event_name}>
                                                                            {step.url_pattern ? `URL: ${step.url_pattern}` : `Evento: ${step.event_name}`}
                                                                        </div>

                                                                        <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                                                            <div className="text-center w-1/2">
                                                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Visitas</p>
                                                                                <p className="font-medium text-sm mt-0.5">0</p>
                                                                            </div>
                                                                            <div className="w-px h-8 bg-border/50 mx-2"></div>
                                                                            <div className="text-center w-1/2">
                                                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Conversões</p>
                                                                                <p className="font-semibold text-sm text-primary mt-0.5">0</p>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </div>

                                                            {/* Arrow Separator */}
                                                            {index < steps.length - 1 && (
                                                                <div className="flex-shrink-0 text-muted-foreground/30 px-2">
                                                                    <ArrowRight className="w-8 h-8" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>)}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="leads" className="mt-0">
                                <Card className="border-border/50 shadow-sh-sm rounded-2xl glass overflow-hidden">
                                    <CardHeader className="border-b border-border/50 bg-muted/20 flex flex-row items-baseline justify-between py-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Users className="w-5 h-5 text-primary" />
                                                Leads do Funil
                                            </CardTitle>
                                            <CardDescription className="mt-1">Pessoas que interagiram com este funil e seus dados capturados</CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="rounded-xl shrink-0">
                                            {funnelLeads?.length || 0} Leads
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {isLoadingLeads ? (
                                            <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                                        ) : funnelLeads?.length === 0 ? (
                                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Nenhum lead converteu ou interagiu neste funil ainda.</p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="pl-6">Lead</TableHead>
                                                        <TableHead>Contato</TableHead>
                                                        <TableHead>Interações</TableHead>
                                                        <TableHead className="text-right pr-6">Dados Extras</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {funnelLeads?.map((lead: any) => (
                                                        <TableRow key={lead.id} className="hover:bg-muted/30">
                                                            <TableCell className="font-medium pl-6">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                            {lead.name ? lead.name.substring(0, 2).toUpperCase() : '?'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{lead.name || 'Sem Nome'}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                <div className="flex flex-col">
                                                                    {lead.email && <span>{lead.email}</span>}
                                                                    {lead.phone && <span className="text-muted-foreground">{lead.phone}</span>}
                                                                    {!lead.email && !lead.phone && <span className="text-muted-foreground italic">Desconhecido</span>}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="font-mono">{lead.interactions}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                {Object.keys(lead.capturedData || {}).length > 0 ? (
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs text-primary bg-primary/5 hover:bg-primary/10">
                                                                                <Eye className="w-3 h-3" />
                                                                                Ver Respostas
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="sm:max-w-[425px]">
                                                                            <DialogHeader>
                                                                                <DialogTitle>Dados Adicionais Capturados</DialogTitle>
                                                                            </DialogHeader>
                                                                            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto w-full">
                                                                                {Object.entries(lead.capturedData).map(([key, value]) => (
                                                                                    <div key={key} className="grid grid-cols-1 gap-1 border-b border-border/50 pb-2 last:border-0">
                                                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                                                                                        <span className="text-sm break-words">{String(value)}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">Nenhum dado</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Analytics Summary (Right Column - 1/3) */}
                    <div className="space-y-6">
                        <Card className="border-border/50 shadow-sh-sm rounded-2xl glass">
                            <CardHeader className="bg-primary/5 border-b border-border/50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    Desempenho Geral
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Visitantes Únicos Totais</p>
                                    <p className="text-3xl font-bold">0</p>
                                </div>
                                <div className="pt-4 border-t border-border/50">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Leads Captados</p>
                                    <p className="text-3xl font-bold text-primary">0</p>
                                    <p className="text-xs text-muted-foreground mt-1">Taxa: 0.00%</p>
                                </div>
                                <div className="pt-4 border-t border-border/50">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Vendas Concluídas</p>
                                    <p className="text-3xl font-bold text-emerald-500">0</p>
                                    <p className="text-xs text-muted-foreground mt-1">Taxa: 0.00%</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 shadow-sh-sm rounded-2xl glass">
                            <CardHeader>
                                <CardTitle className="text-base text-muted-foreground">Dica Rápida</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3 py-1">
                                    Lembre-se de instalar o <span className="text-foreground font-mono bg-muted/50 px-1 rounded">tracking.js</span> nas páginas configuradas neste funil para ativar o rastreamento automático.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Step Dialog */}
            {editingStep && (
                <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Etapa</DialogTitle>
                            <DialogDescription>Ajuste as regras de captura para esta etapa do funil.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Nome da Etapa</Label>
                                <Input
                                    value={editingStep.name}
                                    onChange={(e) => setEditingStep({ ...editingStep, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Regra de URL (Caminho da página)</Label>
                                <Input
                                    value={editingStep.url_pattern || ""}
                                    onChange={(e) => setEditingStep({ ...editingStep, url_pattern: e.target.value })}
                                    placeholder="Ex: /checkout*"
                                />
                                <span className="text-xs text-muted-foreground">Analisa se a URL atual contém o caminho acima. Use asteriscos * como coringas.</span>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome do Evento (Opcional)</Label>
                                <Input
                                    value={editingStep.event_name || ""}
                                    onChange={(e) => setEditingStep({ ...editingStep, event_name: e.target.value })}
                                    placeholder="Ex: custom_event_btn_click"
                                />
                                <span className="text-xs text-muted-foreground">Caso seja uma ação em botão em vez de carregamento de página.</span>
                            </div>
                            <div className="flex items-center space-x-2 pt-2 border-t border-border/50 mt-4">
                                <Switch
                                    id="is-conversion"
                                    checked={editingStep.is_conversion_point}
                                    onCheckedChange={(checked) => setEditingStep({ ...editingStep, is_conversion_point: checked })}
                                />
                                <div className="space-y-0.5 text-sm">
                                    <Label htmlFor="is-conversion" className="text-base font-medium">Marcar como Conversão Final</Label>
                                    <p className="text-muted-foreground">Se ativo, indica que ao chegar aqui o lead completou o objetivo do funil (Ex: Comprou).</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between w-full mt-6">
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteStep(editingStep.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setEditingStep(null)}>Cancelar</Button>
                                <Button
                                    onClick={() => updateStepMutation.mutate(editingStep)}
                                    disabled={updateStepMutation.isPending}
                                >
                                    {updateStepMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </DashboardLayout>
    );
}
