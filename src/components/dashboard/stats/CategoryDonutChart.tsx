"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
    category: string;
    total_amount: number;
    [key: string]: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">Gastos por categoría</CardTitle>
                <p className="text-xs text-muted-foreground">Distribución del período actual</p>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
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
                                <Legend iconType="circle" className="text-xs" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            Sin datos para mostrar.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
