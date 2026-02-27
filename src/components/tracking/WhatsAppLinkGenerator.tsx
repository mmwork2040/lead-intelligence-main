import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, MessageCircle, ExternalLink } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

const WhatsAppLinkGenerator = () => {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { data: campaigns = [] } = useCampaigns();
  const { toast } = useToast();

  const generateWhatsAppLink = () => {
    if (!phone) return "";

    const cleanPhone = phone.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(message);
    
    let link = `https://wa.me/${cleanPhone}`;
    
    if (message) {
      link += `?text=${encodedMessage}`;
    }
    
    if (destinationUrl && selectedCampaign) {
      const separator = message ? "%0A%0A" : "?text=";
      const urlWithTracking = `${destinationUrl}${destinationUrl.includes('?') ? '&' : '?'}project=${selectedCampaign}&utm_source=whatsapp&utm_medium=direct`;
      link += `${separator}${encodeURIComponent(urlWithTracking)}`;
    }
    
    return link;
  };

  const handleCopy = () => {
    const link = generateWhatsAppLink();
    if (!link) {
      toast({
        title: "Preencha o número",
        description: "Digite o número do WhatsApp",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Use este link para direcionar para WhatsApp com rastreamento",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPreview = () => {
    const link = generateWhatsAppLink();
    if (link) {
      window.open(link, "_blank");
    }
  };

  const generatedLink = generateWhatsAppLink();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Gerador de Links para WhatsApp
        </h2>
        <p className="text-muted-foreground mt-2">
          Crie links do WhatsApp com mensagem pré-definida e rastreamento
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Número do WhatsApp</Label>
          <Input
            id="phone"
            placeholder="5511999999999 (com DDI e DDD)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Digite o número com código do país e DDD (ex: 5511999999999)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensagem Pré-definida (Opcional)</Label>
          <Textarea
            id="message"
            placeholder="Olá! Gostaria de saber mais sobre..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationUrl">URL de Destino (Opcional)</Label>
          <Input
            id="destinationUrl"
            placeholder="https://meusite.com/oferta"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Se preenchido, será incluído na mensagem com rastreamento
          </p>
        </div>

        {destinationUrl && (
          <div className="space-y-2">
            <Label htmlFor="campaign">Campanha (para rastreamento)</Label>
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
        )}

        {generatedLink && (
          <>
            <div className="space-y-2">
              <Label>Link Gerado</Label>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                {generatedLink}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCopy} className="flex-1">
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
              <Button onClick={handleOpenPreview} variant="outline" className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Testar Link
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WhatsAppLinkGenerator;
