"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface KPIData {
    current_month_total: number;
    previous_month_total: number;
    percentage_change: number;
}

export function KPICards() {
    const [data, setData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const { data, error } = await supabase.rpc('get_monthly_dashboard_stats');
            if (error) {
                console.error("Error fetching KPI:", error);
            } else {
                setData(data as KPIData);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading) {
        return <Skeleton className="h-[120px] w-full rounded-xl" />;
    }

    if (!data) return null;

    const isPositive = data.percentage_change >= 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                    Total pendiente
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {data.current_month_total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    {isPositive ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
                    ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-emerald-500" />
                    )}
                    <span className={isPositive ? "text-red-500" : "text-emerald-500"}>
                        {Math.abs(data.percentage_change)}%
                    </span>
                    <span className="ml-1">vs. mes anterior</span>
                </p>
            </CardContent>
        </Card>
    );
}
