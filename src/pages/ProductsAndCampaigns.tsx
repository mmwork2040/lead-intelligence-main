import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Campaigns from "./Campaigns";
import Products from "./Products";
import DashboardLayout from "@/components/DashboardLayout";

export default function ProductsAndCampaigns() {
    const [activeTab, setActiveTab] = useState("campaigns");
    const [openCampaignDialog, setOpenCampaignDialog] = useState(false);
    const [openProductDialog, setOpenProductDialog] = useState(false);

    const handleNewCampaign = () => {
        setActiveTab("campaigns");
        setOpenCampaignDialog(true);
        setTimeout(() => setOpenCampaignDialog(false), 100);
    };

    const handleNewProduct = () => {
        setActiveTab("products");
        setOpenProductDialog(true);
        setTimeout(() => setOpenProductDialog(false), 100);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                            <Target className="w-8 h-8 text-primary" />
                            Produtos e Campanhas
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Gerencie seus produtos e as campanhas vinculadas em um só lugar.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="shadow-sh-sm rounded-xl gap-2" onClick={handleNewProduct}>
                            <Plus className="w-4 h-4" />
                            Novo Produto
                        </Button>
                        <Button className="shadow-sh-sm rounded-xl gap-2" onClick={handleNewCampaign}>
                            <Plus className="w-4 h-4" />
                            Nova Campanha
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="campaigns" className="rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Campanhas Internas
                        </TabsTrigger>
                        <TabsTrigger value="products" className="rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Meus Produtos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="campaigns" className="space-y-4">
                        <Campaigns openDialog={openCampaignDialog} />
                    </TabsContent>

                    <TabsContent value="products" className="space-y-4">
                        <Products openDialog={openProductDialog} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
