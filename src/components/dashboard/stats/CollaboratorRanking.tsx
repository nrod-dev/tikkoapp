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
                    Mayor gasto
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-1 mb-4">
                    <span className="text-xl font-bold">{topCollaborator.full_name}</span>
                    <span className="text-sm text-muted-foreground">
                        {topCollaborator.total_amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} en total
                    </span>
                </div>

                <div className="space-y-4 pt-2">
                    {data.slice(0, 3).map((collab, i) => ( // Show top 3 mini list
                        <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">{collab.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-slate-700 truncate max-w-[100px]">{collab.full_name}</span>
                            </div>
                            <span className="font-medium">
                                {Number(collab.total_amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
