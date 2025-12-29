"use client";


import { CategoryDonutChart } from "./stats/CategoryDonutChart";
import { TrendLineChart } from "./stats/TrendLineChart";

export function DashboardView() {
    return (
        <div className="p-6 space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 text-sm">Resumen de gastos y métricas de la empresa</p>
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
        </div>
    );
}
