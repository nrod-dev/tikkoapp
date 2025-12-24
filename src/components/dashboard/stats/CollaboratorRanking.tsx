"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp } from "lucide-react";

interface Collaborator {
    full_name: string;
    total_amount: number;
    ticket_count: number;
}

export function CollaboratorRanking() {
    const [data, setData] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const { data, error } = await supabase.rpc('get_top_collaborators');
            if (error) {
                console.error("Error fetching ranking:", error);
            } else {
                setData(data as Collaborator[]);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading) {
        return <Skeleton className="h-[250px] w-full rounded-xl" />;
    }

    if (data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-500">Mayor gasto</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[150px] text-slate-400 text-sm">
                    Sin datos aún.
                </CardContent>
            </Card>
        );
    }

    const topCollaborator = data[0];

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                    Usuario con mayores gastos
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Winner Section */}
                    <div className="flex flex-col justify-center gap-2 border-r pr-8 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-16 w-16 border-4 border-purple-50">
                                <AvatarFallback className="text-xl bg-purple-100 text-purple-700">
                                    {topCollaborator.full_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-slate-800">{topCollaborator.full_name}</span>
                                <span className="text-lg text-purple-600 font-semibold">
                                    {topCollaborator.total_amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 pl-1">
                            Mayor contribuyente a los gastos en este período.
                        </p>
                    </div>

                    {/* Runners up */}
                    <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Siguientes colaboradores</h4>
                        {data.slice(1, 4).length > 0 ? (
                            data.slice(1, 4).map((collab, i) => (
                                <div key={i} className="flex items-center justify-between text-sm group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                                            {i + 2}
                                        </div>
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">{collab.full_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-slate-700 truncate max-w-[120px] font-medium group-hover:text-purple-600 transition-colors">
                                            {collab.full_name}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-slate-900">
                                        {Number(collab.total_amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-slate-400 italic">No hay otros colaboradores registrados.</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
