import { useState } from "react";
import { useMetaCampaigns, useMetaAdSets, useMetaAds, useToggleMetaStatus } from "@/hooks/useMetaAds";
import { FBCampaign, FBAdSet, FBAd } from "@/hooks/useMetaAds";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, Target, Layers } from "lucide-react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const AdItem = ({ ad }: { ad: FBAd }) => {
    const toggleMutation = useToggleMetaStatus();
    const isActive = ad.status === "ACTIVE";

    const handleToggle = (checked: boolean) => {
        toggleMutation.mutate({
            fb_id: ad.fb_ad_id,
            status: checked ? "ACTIVE" : "PAUSED",
            type: "AD",
        });
    };

    return (
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-card border border-border/50 ml-12 mb-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium">{ad.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                        ID: {ad.fb_ad_id}
                        <Badge variant="outline" className={isActive ? "text-success border-success/30 bg-success/10" : "text-muted-foreground"}>
                            {isActive ? "Ativo" : "Pausado"}
                        </Badge>
                    </p>
                </div>
            </div>
            <div>
                <Switch checked={isActive} onCheckedChange={handleToggle} disabled={toggleMutation.isPending} />
            </div>
        </div>
    );
};

const AdSetItem = ({ adset }: { adset: FBAdSet }) => {
    const { data: ads, isLoading } = useMetaAds(adset.fb_adset_id);
    const toggleMutation = useToggleMetaStatus();
    const isActive = adset.status === "ACTIVE";

    const handleToggle = (checked: boolean) => {
        toggleMutation.mutate({
            fb_id: adset.fb_adset_id,
            status: checked ? "ACTIVE" : "PAUSED",
            type: "ADSET",
        });
    };

    return (
        <AccordionItem value={`adset-${adset.id}`} className="border-none">
            <div className="flex items-center justify-between ml-6 mb-2 bg-muted/30 rounded-lg pr-4 border border-border/50">
                <AccordionTrigger className="hover:no-underline flex-1 px-4 py-3">
                    <div className="flex items-center gap-3 text-left">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">{adset.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                R$ {Number(adset.daily_budget || 0) / 100} / dia
                                <Badge variant="outline" className={isActive ? "text-success border-success/30 bg-success/10" : "text-muted-foreground"}>
                                    {isActive ? "Ativo" : "Pausado"}
                                </Badge>
                            </p>
                        </div>
                    </div>
                </AccordionTrigger>
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={isActive} onCheckedChange={handleToggle} disabled={toggleMutation.isPending} />
                </div>
            </div>
            <AccordionContent>
                {isLoading ? (
                    <div className="ml-12 text-sm text-muted-foreground py-2">Carregando anúncios...</div>
                ) : ads?.length === 0 ? (
                    <div className="ml-12 text-sm text-muted-foreground py-2 mb-2">Nenhum anúncio encontrado.</div>
                ) : (
                    ads?.map((ad) => <AdItem key={ad.id} ad={ad} />)
                )}
            </AccordionContent>
        </AccordionItem>
    );
};

const CampaignItem = ({ campaign }: { campaign: FBCampaign }) => {
    const { data: adsets, isLoading } = useMetaAdSets(campaign.fb_campaign_id);
    const toggleMutation = useToggleMetaStatus();
    const isActive = campaign.status === "ACTIVE";

    const handleToggle = (checked: boolean) => {
        toggleMutation.mutate({
            fb_id: campaign.fb_campaign_id,
            status: checked ? "ACTIVE" : "PAUSED",
            type: "CAMPAIGN",
        });
    };

    return (
        <AccordionItem value={`camp-${campaign.id}`} className="border border-border/50 rounded-xl mb-4 bg-card overflow-hidden">
            <div className="flex items-center justify-between pr-4 bg-muted/10">
                <AccordionTrigger className="hover:no-underline flex-1 px-4 py-4">
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-base">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                {campaign.objective}
                                <span>•</span>
                                R$ {Number(campaign.daily_budget || 0) / 100} / dia
                                <Badge variant="outline" className={isActive ? "text-success border-success/30 bg-success/10" : "text-muted-foreground"}>
                                    {isActive ? "Ativa" : "Pausada"}
                                </Badge>
                            </p>
                        </div>
                    </div>
                </AccordionTrigger>
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={isActive} onCheckedChange={handleToggle} disabled={toggleMutation.isPending} />
                </div>
            </div>
            <AccordionContent className="pt-2 pb-0 px-4">
                {isLoading ? (
                    <div className="ml-6 text-sm text-muted-foreground py-2">Carregando conjuntos...</div>
                ) : adsets?.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center border-t border-border/50">
                        Nenhum conjunto de anúncios encontrado nesta campanha.
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {adsets?.map((adset) => (
                            <AdSetItem key={adset.id} adset={adset} />
                        ))}
                    </Accordion>
                )}
            </AccordionContent>
        </AccordionItem>
    );
};

export const MetaAdsManager = () => {
    const { data: campaigns, isLoading } = useMetaCampaigns();

    if (isLoading) {
        return <PageSkeleton />;
    }

    if (!campaigns || campaigns.length === 0) {
        return (
            <Card className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma campanha do Meta Ads</h3>
                <p className="text-muted-foreground max-w-md">
                    Conecte sua conta do Facebook Ads e sincronize suas campanhas para gerenciá-las diretamente por aqui.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1">Gerenciador de Anúncios (Meta)</h2>
                <p className="text-sm text-muted-foreground">
                    Gerencie status de campanhas, conjuntos de anúncios e anúncios do Facebook Ads.
                </p>
            </div>

            <Accordion type="multiple" className="w-full">
                {campaigns.map((campaign) => (
                    <CampaignItem key={campaign.id} campaign={campaign} />
                ))}
            </Accordion>
        </div>
    );
};
