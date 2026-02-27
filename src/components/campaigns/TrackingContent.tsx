import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import TrackingPixelGenerator from "@/components/tracking/TrackingPixelGenerator";
import FacebookUTMGenerator from "@/components/tracking/FacebookUTMGenerator";
import OrganicLinkGenerator from "@/components/tracking/OrganicLinkGenerator";
import WhatsAppLinkGenerator from "@/components/tracking/WhatsAppLinkGenerator";
import { Code, Facebook, Link, MessageCircle } from "lucide-react";

export default function TrackingContent() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Gere códigos de rastreamento e links com UTMs para suas campanhas
      </p>

      <Tabs defaultValue="pixel" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pixel" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Pixel</span>
          </TabsTrigger>
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            <span className="hidden sm:inline">Facebook Ads</span>
          </TabsTrigger>
          <TabsTrigger value="organic" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Orgânico</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pixel" className="mt-6">
          <Card className="p-6">
            <TrackingPixelGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="facebook" className="mt-6">
          <Card className="p-6">
            <FacebookUTMGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="organic" className="mt-6">
          <Card className="p-6">
            <OrganicLinkGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <Card className="p-6">
            <WhatsAppLinkGenerator />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
