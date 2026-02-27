import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, Webhook, RefreshCw, Filter } from "lucide-react";
import { useWebhookLogs, useWebhookStats } from "@/hooks/useWebhookLogs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const WebhookLogs = () => {
  const navigate = useNavigate();
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  const { data: logs, isLoading, refetch } = useWebhookLogs({
    source: sourceFilter,
    processed: statusFilter,
    limit: 100,
  });

  const { data: stats } = useWebhookStats();

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'hotmart':
        return 'bg-[hsl(38,92%,50%)] text-white';
      case 'manychat':
        return 'bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00] text-white dark:text-stone-900';
      case 'n8n':
        return 'bg-foreground text-background';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs de Webhooks</h1>
            <p className="text-muted-foreground mt-2">
              Histórico de processamento de webhooks recebidos
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Webhook className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                <div>
                  <p className="text-2xl font-bold">{stats?.processed || 0}</p>
                  <p className="text-xs text-muted-foreground">Processados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.failed || 0}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Processamento</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={sourceFilter || "all"}
                  onValueChange={(value) => setSourceFilter(value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="manychat">ManyChat</SelectItem>
                    <SelectItem value="n8n">N8N</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter === undefined ? "all" : statusFilter ? "processed" : "pending"}
                  onValueChange={(value) => 
                    setStatusFilter(value === "all" ? undefined : value === "processed")
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="processed">Processados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !logs || logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Webhook className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum webhook encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lead ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => log.lead_id && navigate(`/leads/${log.lead_id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at!), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getSourceColor(log.source)}>
                            {log.source.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.event_type || "-"}</TableCell>
                        <TableCell>
                          {log.processed ? (
                            <div className="flex items-center gap-2 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Processado</span>
                            </div>
                          ) : log.error_message ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Erro</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">Pendente</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.lead_id ? (
                            <code className="px-2 py-1 bg-muted rounded text-xs">
                              {log.lead_id.substring(0, 8)}...
                            </code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WebhookLogs;
