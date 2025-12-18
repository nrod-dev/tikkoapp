"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExpenseTable } from "@/components/dashboard/ExpenseTable";
import { ExpenseDetailsSheet } from "@/components/dashboard/ExpenseDetailsSheet";
import { Expense } from "@/lib/data";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AIScanModal } from "@/components/dashboard/AIScanModal";

export function ExpensesView() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [aiDraftData, setAiDraftData] = useState<any>(null); // Datos temporales de IA
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const router = useRouter();

    // Función para cargar datos (Memoizada)
    const fetchTickets = useCallback(async (page: number = 1) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push("/login");
            return;
        }

        setLoading(true);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: tickets, error, count } = await supabase
            .from('tickets')
            .select('*, created_by(full_name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) console.error("Error fetching:", error);

        if (tickets) {
            const mappedExpenses: Expense[] = (tickets as any[]).map((ticket) => ({
                id: ticket.id,
                merchantName: ticket.merchant_name || 'Sin Nombre',
                merchantLogo: (ticket.merchant_name?.charAt(0)) || '?',
                date: ticket.date || '',
                user: ticket.created_by?.full_name || 'Desconocido',
                amount: ticket.amount || 0,
                currency: ticket.currency || 'ARS',
                status: ticket.status as any,
                paymentMethod: 'Efectivo',
                receiptUrl: ticket.receipt_url,
                category: ticket.category,
                ivaAmount: ticket.iva_amount !== undefined ? ticket.iva_amount : null // Map DB iva_amount to ivaAmount
            }));
            setExpenses(mappedExpenses);
            if (count !== null) setTotalCount(count);
        }
        setLoading(false);
    }, [router, pageSize]);

    // Carga inicial
    useEffect(() => {
        fetchTickets(currentPage);
    }, [fetchTickets, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handler para abrir Sheet (Ver/Editar)
    const handleRowClick = (expense: Expense) => {
        setSelectedExpense(expense);
        setAiDraftData(null);
        setIsSheetOpen(true);
    };

    // Handler para NUEVO gasto MANUAL
    const handleNewExpense = () => {
        setSelectedExpense(null); // Null indica creación
        setAiDraftData(null);
        setIsSheetOpen(true);
    };

    // Handler tras confirmar IA
    const handleAIConfirm = (data: any) => {
        setSelectedExpense(null);
        setAiDraftData(data); // Pasamos los datos escaneados como "initialData"
        setIsSheetOpen(true); // Abre el form manual con los datos pre-cargados
    };

    // Handler para borrar ticket
    const handleDeleteTicket = (id: string) => {
        toast("¿Estás seguro que querés eliminar este gasto?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const { error } = await supabase
                            .from('tickets')
                            .delete()
                            .eq('id', id);

                        if (error) {
                            console.error("Error deleting:", error);
                            toast.error("Error al eliminar: " + error.message);
                            return;
                        }

                        toast.success("Gasto eliminado correctamente");
                        // Recargar datos
                        fetchTickets(currentPage);

                    } catch (error: any) {
                        console.error("Error:", error);
                        toast.error("Error desconocido al eliminar.");
                    }
                },
            },
            cancel: {
                label: "Cancelar",
                onClick: () => { },
            },
        });
    };

    // Loading state is now handled by ExpenseTable to prevent header flicker
    // if (loading) { ... } logic removed

    return (
        <div className="h-full w-full p-6">

            {/* Header con Botón de Acción */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Mis Rendiciones</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setIsAIModalOpen(true)} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-md">
                        <Sparkles className="h-4 w-4" />
                        Cargar con IA
                    </Button>
                    <Button onClick={handleNewExpense} variant="outline" className="gap-2 bg-blue-500 hover:bg-blue-600 hover:text-white text-white border-0 shadow-md">
                        <Plus className="h-4 w-4" />
                        Nuevo Gasto
                    </Button>
                </div>
            </div>

            <ExpenseTable
                data={expenses}
                isLoading={loading}
                onRowClick={handleRowClick}
                onDelete={handleDeleteTicket}
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / pageSize)}
                onPageChange={handlePageChange}
                totalCount={totalCount}
            />

            <ExpenseDetailsSheet
                expense={selectedExpense}
                initialData={aiDraftData} // Pasar datos de IA
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={() => fetchTickets(currentPage)} // Al guardar, recargamos la lista
            />

            <AIScanModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onConfirmed={handleAIConfirm}
            />
        </div>
    );
}