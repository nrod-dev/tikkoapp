"use client";

import { useState, useEffect, useCallback } from "react";

import { supabase } from "@/lib/supabase";
import { Expense } from "@/lib/data";
import { Loader2, Check, X, Paperclip, Ticket, DollarSign, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptModal } from "@/components/dashboard/ReceiptModal";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export function ApprovalsView() {
    const [tickets, setTickets] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({ count: 0, totalAmount: 0 });

    // Receipt Modal State
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [selectedMerchant, setSelectedMerchant] = useState<string>("");
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const fetchPendingTickets = useCallback(async () => {
        setLoading(true);
        // Only fetch pending tickets
        const { data, error } = await supabase
            .from('tickets')
            .select('*, created_by(full_name, avatar_url), collaborator_id(first_name, last_name, sector, phone)')
            .eq('status', 'pendiente')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching pending tickets:", error);
            toast.error("Error al cargar tickets pendientes");
            setLoading(false);
            return;
        }

        if (data) {
            let totalAmt = 0;
            const mappedTickets: Expense[] = data.map((t: any) => {
                const amount = Number(t.amount) || 0;
                totalAmt += amount;

                // Collaborator Logic: Prefer linked collaborator, fallback to created_by profile
                const collabName = t.collaborator_id
                    ? `${t.collaborator_id.first_name} ${t.collaborator_id.last_name}`
                    : t.created_by?.full_name || 'Desconocido';

                const collabSector = t.collaborator_id?.sector || 'Colaborador';
                const avatarUrl = t.created_by?.avatar_url; // Collaborators table doesn't have avatar yet, use profile if available or null

                return {
                    id: t.id,
                    merchantName: t.merchant_name || 'Sin Nombre',
                    date: t.date,
                    user: collabName, // For compat with Expense interface
                    amount: amount,
                    currency: t.currency || 'ARS',
                    status: t.status,
                    receiptUrl: t.receipt_url,
                    category: t.category,
                    // Fix: Add missing properties required by Expense interface
                    merchantLogo: '',
                    paymentMethod: t.payment_method || 'Desconocido',
                    ivaAmount: t.iva_amount || null,
                    // Extended properties for internal use
                    collaboratorName: collabName,
                    collaboratorSector: collabSector,
                    collaboratorAvatar: avatarUrl
                };
            });

            setTickets(mappedTickets);
            setMetrics({ count: data.length, totalAmount: totalAmt });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPendingTickets();
    }, [fetchPendingTickets]);

    const handleAction = async (id: string, action: 'aprobado' | 'rechazado') => {
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status: action, reviewed_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Ticket ${action === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente`);

            // Optimistic update
            setTickets(prev => prev.filter(t => t.id !== id));

            // Re-calc metrics manually to avoid refetch if strictly needed, but refetch is safer for consistency
            // Simple re-fetch for now
            fetchPendingTickets();

        } catch (e: any) {
            console.error("Error updating ticket object:", e);
            console.error("Error details:", {
                message: e?.message,
                code: e?.code,
                details: e?.details,
                hint: e?.hint
            });
            toast.error(`Error al actualizar el ticket: ${e?.message || 'Error desconocido'}`);
        }
    };

    const openReceipt = (url: string, merchant: string) => {
        setSelectedReceipt(url);
        setSelectedMerchant(merchant);
        setIsReceiptModalOpen(true);
    };

    if (loading) {
        return <div className="p-10 flex justify-center h-full items-center"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
    }

    return (
        <div className="space-y-6 pt-2">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">Aprobaciones Pendientes</h1>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">PENDIENTES</p>
                                <h3 className="text-4xl font-bold text-slate-900">{metrics.count}</h3>
                                <div className="flex items-center mt-4 text-sm text-blue-600 font-medium">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Actualizado hace instantes
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-xl">
                                <Ticket className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">MONTO TOTAL</p>
                                <h3 className="text-4xl font-bold text-slate-900">
                                    $ {metrics.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                                <div className="flex items-center mt-4 text-sm text-emerald-600 font-medium">
                                    <span className="font-bold mr-1">+12%</span> vs mes anterior
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-xl">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider pl-6 py-4">Colaborador</TableHead>
                            <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4">Detalle del Gasto</TableHead>
                            <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4">Monto Total</TableHead>
                            <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-center py-4">Comprobante</TableHead>
                            <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-center py-4 pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-40 text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Check className="h-8 w-8 text-emerald-500 mb-2" />
                                        <p>¡Estas al día! No hay tickets pendientes.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((t: any) => (
                                <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                <AvatarImage src={t.collaboratorAvatar} />
                                                <AvatarFallback className="bg-slate-900 text-white font-bold">
                                                    {t.collaboratorName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{t.collaboratorName}</span>
                                                <span className="text-xs text-slate-500">{t.collaboratorSector}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{t.merchantName}</span>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                {/* <Calendar className="h-3 w-3" /> */}
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                                                    📅 {new Date(t.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 font-bold text-slate-900 text-base">
                                        $ {t.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        {t.receiptUrl ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                onClick={() => openReceipt(t.receiptUrl, t.merchantName)}
                                            >
                                                <Paperclip className="h-5 w-5" />
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">No adjunto</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="pr-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300 rounded-md"
                                                onClick={() => handleAction(t.id, 'aprobado')}
                                            >
                                                <Check className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 hover:border-red-300 rounded-md"
                                                onClick={() => handleAction(t.id, 'rechazado')}
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                imageUrl={selectedReceipt}
                merchantName={selectedMerchant}
            />
        </div>
    );
}
