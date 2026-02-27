import { BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import FacebookAdsDashboard from "@/components/reports/FacebookAdsDashboard";

export default function TrafficReports() {
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-[1400px] mx-auto">
                <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                            <BarChart3 className="w-8 h-8 text-primary" />
                            Relatório de Tráfego
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Gestão visual avançada e análise aprofundada das fontes de tráfego.
                        </p>
                    </div>
                </div>

                <FacebookAdsDashboard />
            </div>
        </DashboardLayout>
    );
}
