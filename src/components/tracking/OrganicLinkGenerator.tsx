import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Link, Mail, Instagram, Youtube, MessageCircle } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

const channelPresets = {
  whatsapp: {
    icon: MessageCircle,
    label: "WhatsApp",
    utm_source: "whatsapp",
    utm_medium: "message",
  },
  email: {
    icon: Mail,
    label: "Email",
    utm_source: "email",
    utm_medium: "newsletter",
  },
  instagram: {
    icon: Instagram,
    label: "Instagram Bio",
    utm_source: "instagram",
    utm_medium: "organic",
  },
  youtube: {
    icon: Youtube,
    label: "YouTube",
    utm_source: "youtube",
    utm_medium: "video",
  },
  custom: {
    icon: Link,
    label: "Personalizado",
    utm_source: "",
    utm_medium: "",
  },
};

const OrganicLinkGenerator = () => {
  const [url, setUrl] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<keyof typeof channelPresets>("whatsapp");
  const [customSource, setCustomSource] = useState("");
  const [customMedium, setCustomMedium] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [copied, setCopied] = useState(false);
  const { data: campaigns = [] } = useCampaigns();
  const { toast } = useToast();

  const generateLink = () => {
    if (!url || !selectedCampaign) return "";

    const baseUrl = url.includes("?") ? url : `${url}?`;
    const params = new URLSearchParams();
    
    params.append("project", selectedCampaign);
    
    const channel = channelPresets[selectedChannel];
    const source = selectedChannel === "custom" ? customSource : channel.utm_source;
    const medium = selectedChannel === "custom" ? customMedium : channel.utm_medium;
    
    if (source) params.append("utm_source", source);
    if (medium) params.append("utm_medium", medium);
    if (customContent) params.append("utm_content", customContent);

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
      description: "Use este link em suas campanhas orgânicas",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const generatedLink = generateLink();
  const ChannelIcon = channelPresets[selectedChannel].icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Link className="h-6 w-6" />
          Gerador de Links Orgânicos
        </h2>
        <p className="text-muted-foreground mt-2">
          Crie links com UTMs para campanhas orgânicas em diferentes canais
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

        <div className="space-y-2">
          <Label>Canal</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(channelPresets).map(([key, preset]) => {
              const Icon = preset.icon;
              return (
                <Button
                  key={key}
                  variant={selectedChannel === key ? "default" : "outline"}
                  onClick={() => setSelectedChannel(key as keyof typeof channelPresets)}
                  className="justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>

        {selectedChannel === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customSource">UTM Source</Label>
              <Input
                id="customSource"
                placeholder="ex: linkedin"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customMedium">UTM Medium</Label>
              <Input
                id="customMedium"
                placeholder="ex: post"
                value={customMedium}
                onChange={(e) => setCustomMedium(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="customContent">UTM Content (Opcional)</Label>
          <Input
            id="customContent"
            placeholder="ex: link-bio, post-carrossel"
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
          />
        </div>

        {generatedLink && (
          <>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ChannelIcon className="h-4 w-4" />
                Link Gerado
              </Label>
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

export default OrganicLinkGenerator;
