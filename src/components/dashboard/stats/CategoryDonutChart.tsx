"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryData {
    category: string;
    total_amount: number;
    [key: string]: any;
}

const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#84cc16', // lime-500
    '#14b8a6', // teal-500
    '#d946ef', // fuchsia-500
    '#e11d48', // rose-600
    '#0ea5e9', // sky-500
];

export function CategoryDonutChart() {
    const [data, setData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const { data, error } = await supabase.rpc('get_expenses_by_category');
            if (error) {
                console.error("Error fetching categories:", error);
            } else {
                setData(data as CategoryData[]);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading) return <Skeleton className="h-[300px] w-full rounded-xl" />;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium text-slate-500">Gastos por categoría</CardTitle>
                <p className="text-xs text-muted-foreground">Distribución del período actual</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
                <div className="h-[200px] w-full relative">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="total_amount"
                                    nameKey="category"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            Sin datos para mostrar.
                        </div>
                    )}
                </div>

                {/* Custom Legend */}
                {data.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                        {data.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-slate-600">
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="truncate">{entry.category}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
