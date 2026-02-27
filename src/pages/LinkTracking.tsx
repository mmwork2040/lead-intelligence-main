import { Webhook, Link as LinkIcon, Activity } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrackingContent from "@/components/campaigns/TrackingContent";
import Integrations from "./Integrations";

export default function LinkTracking() {
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                            <Webhook className="w-8 h-8 text-primary" />
                            Criador de Links e Traqueamento
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Gere links UTMs parametrados e gerencie integrações como API e Webhooks.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="utmbuilder" className="space-y-6">
                    <TabsList className="bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="utmbuilder" className="rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            UTM Builder
                        </TabsTrigger>
                        <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Integrações e Webhooks
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="utmbuilder" className="space-y-4">
                        <TrackingContent />
                    </TabsContent>

                    <TabsContent value="integrations" className="space-y-4">
                        <Integrations />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
