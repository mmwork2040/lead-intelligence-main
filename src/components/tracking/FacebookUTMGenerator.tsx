import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Facebook } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

const FacebookUTMGenerator = () => {
  const [url, setUrl] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [dynamicParams, setDynamicParams] = useState({
    campaignName: true,
    adsetName: true,
    adName: true,
    placement: false,
    siteSource: false,
  });
  const [copied, setCopied] = useState(false);
  const { data: campaigns = [] } = useCampaigns();
  const { toast } = useToast();

  const generateLink = () => {
    if (!url || !selectedCampaign) return "";

    const baseUrl = url.includes("?") ? url : `${url}?`;
    const params = new URLSearchParams();
    
    params.append("project", selectedCampaign);
    params.append("utm_source", "facebook");
    params.append("utm_medium", "paid");
    
    if (dynamicParams.campaignName) {
      params.append("utm_campaign", "{{campaign.name}}");
    }
    
    if (dynamicParams.adsetName) {
      params.append("utm_term", "{{adset.name}}");
    }
    
    if (dynamicParams.adName) {
      params.append("utm_content", "{{ad.name}}");
    }
    
    if (dynamicParams.placement) {
      params.append("placement", "{{placement}}");
    }
    
    if (dynamicParams.siteSource) {
      params.append("site_source", "{{site_source_name}}");
    }

    return `${baseUrl}&${params.toString()}`;
  };

  const handleCopy = () => {
    const link = generateLink();
    if (!link) {
      toast({
        title: "Preencha todos os campos",
        description: "Digite a URL e selecione uma campanha",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Cole no campo de URL do Facebook Ads",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const generatedLink = generateLink();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Facebook className="h-6 w-6" />
          Gerador de Links para Facebook Ads
        </h2>
        <p className="text-muted-foreground mt-2">
          Crie links com UTMs dinâmicas do Meta Ads para rastreamento automático
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL de Destino</Label>
          <Input
            id="url"
            placeholder="https://meusite.com/oferta"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign">Campanha</Label>
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger id="campaign">
              <SelectValue placeholder="Selecione uma campanha" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.slug}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Parâmetros Dinâmicos</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="campaignName"
                checked={dynamicParams.campaignName}
                onCheckedChange={(checked) =>
                  setDynamicParams({ ...dynamicParams, campaignName: checked as boolean })
                }
              />
              <label htmlFor="campaignName" className="text-sm cursor-pointer">
                Nome da Campanha <code className="text-xs bg-muted px-1 rounded">{'{{campaign.name}}'}</code>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="adsetName"
                checked={dynamicParams.adsetName}
                onCheckedChange={(checked) =>
                  setDynamicParams({ ...dynamicParams, adsetName: checked as boolean })
                }
              />
              <label htmlFor="adsetName" className="text-sm cursor-pointer">
                Nome do Conjunto <code className="text-xs bg-muted px-1 rounded">{'{{adset.name}}'}</code>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="adName"
                checked={dynamicParams.adName}
                onCheckedChange={(checked) =>
                  setDynamicParams({ ...dynamicParams, adName: checked as boolean })
                }
              />
              <label htmlFor="adName" className="text-sm cursor-pointer">
                Nome do Anúncio <code className="text-xs bg-muted px-1 rounded">{'{{ad.name}}'}</code>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="placement"
                checked={dynamicParams.placement}
                onCheckedChange={(checked) =>
                  setDynamicParams({ ...dynamicParams, placement: checked as boolean })
                }
              />
              <label htmlFor="placement" className="text-sm cursor-pointer">
                Posicionamento <code className="text-xs bg-muted px-1 rounded">{'{{placement}}'}</code>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="siteSource"
                checked={dynamicParams.siteSource}
                onCheckedChange={(checked) =>
                  setDynamicParams({ ...dynamicParams, siteSource: checked as boolean })
                }
              />
              <label htmlFor="siteSource" className="text-sm cursor-pointer">
                Fonte do Site <code className="text-xs bg-muted px-1 rounded">{'{{site_source_name}}'}</code>
              </label>
            </div>
          </div>
        </div>

        {generatedLink && (
          <>
            <div className="space-y-2">
              <Label>Link Gerado</Label>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                {generatedLink}
              </div>
            </div>

            <Button onClick={handleCopy} className="w-full sm:w-auto">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Link
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FacebookUTMGenerator;
