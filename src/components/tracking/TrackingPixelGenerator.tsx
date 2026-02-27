import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy, Check, Code } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

const TrackingPixelGenerator = () => {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { data: campaigns = [] } = useCampaigns();
  const { toast } = useToast();

  const generatePixelCode = (campaignSlug: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `<script>
(function() {
  var endpoint = "https://${projectId}.supabase.co/functions/v1/webhook-tracking-pixel";
  var projectSlug = "${campaignSlug}";
  
  function captureFormData(e) {
    var form = e.target;
    var data = {
      name: form.querySelector('[name="name"], [name="nome"]')?.value || "",
      email: form.querySelector('[name="email"]')?.value || "",
      phone: form.querySelector('[name="phone"], [name="telefone"], [name="whatsapp"]')?.value || "",
      project_slug: projectSlug
    };
    
    // Capture UTMs from URL
    var params = new URLSearchParams(window.location.search);
    data.utm_source = params.get('utm_source') || "";
    data.utm_medium = params.get('utm_medium') || "";
    data.utm_campaign = params.get('utm_campaign') || "";
    data.utm_content = params.get('utm_content') || "";
    data.utm_term = params.get('utm_term') || "";
    
    // Send to webhook
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function(err) { console.error('Tracking error:', err); });
  }
  
  // Attach to all forms
  document.addEventListener('submit', captureFormData);
})();
</script>`;
  };

  const handleCopy = () => {
    if (!selectedCampaign) {
      toast({
        title: "Selecione uma campanha",
        description: "Escolha uma campanha antes de copiar o código",
        variant: "destructive",
      });
      return;
    }

    const code = generatePixelCode(selectedCampaign);
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "Cole o código antes do </body> da sua página",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Code className="h-6 w-6" />
          Tracking Pixel
        </h2>
        <p className="text-muted-foreground mt-2">
          Gere um código JavaScript para capturar leads automaticamente em suas landing pages
        </p>
      </div>

      <div className="space-y-4">
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

        {selectedCampaign && (
          <>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
                {generatePixelCode(selectedCampaign)}
              </pre>
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
                  Copiar Código
                </>
              )}
            </Button>

            <div className="glass border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">
                📋 Instruções de Instalação
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Copie o código acima</li>
                <li>Cole antes da tag <code className="bg-muted px-1 rounded font-mono text-xs">&lt;/body&gt;</code> da sua página</li>
                <li>O código capturará automaticamente formulários com campos de nome, email e telefone</li>
                <li>Todas as UTMs da URL serão capturadas automaticamente</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrackingPixelGenerator;
