import { FacebookCampaignReport, FacebookAdsMetrics } from "@/hooks/useFacebookAdsReports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CampaignBreakdownTableProps {
  campaigns: FacebookCampaignReport[];
  totals: FacebookAdsMetrics;
}

export function CampaignBreakdownTable({
  campaigns,
  totals,
}: CampaignBreakdownTableProps) {
  const formatMetric = (key: string, value: number) => {
    if (key === "spend" || key === "cpc" || key === "cpm" || key === "costPerConversion") {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    }
    if (key === "ctr") {
      return `${value.toFixed(2)}%`;
    }
    if (key === "roas") {
      return `${value.toFixed(2)}x`;
    }
    return new Intl.NumberFormat("pt-BR").format(Math.round(value));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campanha</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
            <TableHead className="text-right">Alcance</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">CPM</TableHead>
            <TableHead className="text-right">CPC</TableHead>
            <TableHead className="text-right">Conversões</TableHead>
            <TableHead className="text-right">Custo/Conv</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center">
                Nenhuma campanha ativa encontrada
              </TableCell>
            </TableRow>
          ) : (
            <>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.campaign_id}>
                  <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {campaign.objective || "-"}
                  </TableCell>
                  <TableCell className="text-right">{formatMetric("spend", campaign.metrics.spend)}</TableCell>
                  <TableCell className="text-right">{formatMetric("impressions", campaign.metrics.impressions)}</TableCell>
                  <TableCell className="text-right">{formatMetric("reach", campaign.metrics.reach)}</TableCell>
                  <TableCell className="text-right">{formatMetric("clicks", campaign.metrics.clicks)}</TableCell>
                  <TableCell className="text-right">{formatMetric("ctr", campaign.metrics.ctr)}</TableCell>
                  <TableCell className="text-right">{formatMetric("cpm", campaign.metrics.cpm)}</TableCell>
                  <TableCell className="text-right">{formatMetric("cpc", campaign.metrics.cpc)}</TableCell>
                  <TableCell className="text-right">{formatMetric("conversions", campaign.metrics.conversions)}</TableCell>
                  <TableCell className="text-right">{formatMetric("costPerConversion", campaign.metrics.costPerConversion)}</TableCell>
                  <TableCell className="text-right">{formatMetric("roas", campaign.metrics.roas)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-right">{formatMetric("spend", totals.spend)}</TableCell>
                <TableCell className="text-right">{formatMetric("impressions", totals.impressions)}</TableCell>
                <TableCell className="text-right">{formatMetric("reach", totals.reach)}</TableCell>
                <TableCell className="text-right">{formatMetric("clicks", totals.clicks)}</TableCell>
                <TableCell className="text-right">{formatMetric("ctr", totals.ctr)}</TableCell>
                <TableCell className="text-right">{formatMetric("cpm", totals.cpm)}</TableCell>
                <TableCell className="text-right">{formatMetric("cpc", totals.cpc)}</TableCell>
                <TableCell className="text-right">{formatMetric("conversions", totals.conversions)}</TableCell>
                <TableCell className="text-right">{formatMetric("costPerConversion", totals.costPerConversion)}</TableCell>
                <TableCell className="text-right">{formatMetric("roas", totals.roas)}</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
