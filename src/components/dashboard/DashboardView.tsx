"use client";

import { KPICards } from "./stats/KPICards";
import { CollaboratorRanking } from "./stats/CollaboratorRanking";
import { CategoryDonutChart } from "./stats/CategoryDonutChart";
import { TrendLineChart } from "./stats/TrendLineChart";

export function DashboardView() {
    return (
        <div className="p-6 space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 text-sm">Resumen de gastos y métricas de la empresa</p>
            </div>

            {/* Top Row: KPIs and Quick Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICards />
                {/* Placeholder Cards to match the row of 4 in design if needed, or just KPI expanded */}
                {/* For now we just have 1 KPI card defined in the plan, but in the screenshot there are 4 cards. 
                    I'll replicate the first one to avoid empty space or create placeholders. 
                    Actually, the user asked for specfic metrics. 
                    - Gasto por colaborador Top 5 (CollaboratorRanking)
                    - Distribucion de gastos por categoría (CategoryDonutChart)
                    - Tendencia de gastos ultimos 6 meses (TrendLineChart)
                    - Total del mes actual y comparacion % (KPICards)
                    
                    So we have 4 main widgets.
                */}
            </div>

            {/* Main Charts Area */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Trend Chart - Wider */}
                <div className="col-span-4">
                    <TrendLineChart />
                </div>

                {/* Donut Chart - Smaller */}
                <div className="col-span-3">
                    <CategoryDonutChart />
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-3">
                    <CollaboratorRanking />
                </div>
                {/* Add Payment Method or other widgets if requested later */}
            </div>
        </div>
    );
}
