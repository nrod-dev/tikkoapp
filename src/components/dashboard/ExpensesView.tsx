"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExpenseTable } from "@/components/dashboard/ExpenseTable";
import { ExpenseDetailsSheet } from "@/components/dashboard/ExpenseDetailsSheet";
import { Expense } from "@/lib/data";
import { Loader2, Plus } from "lucide-react"; // Importar Plus
import { Button } from "@/components/ui/button"; // Importar Button
import { toast } from "sonner";

export function ExpensesView() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const router = useRouter();

    interface Ticket {
        id: string;
        merchant_name: string;
        date: string;
        amount: number;
        currency: string;
        status: 'approved' | 'rejected' | 'pending';
        receipt_url: string;
        created_at: string;
        tax_details: { vat?: number; amount?: number } | null;
        created_by: { full_name: string; email: string } | null;
    }

    // Función para cargar datos (Memoizada)
    const fetchTickets = useCallback(async () => {
        // setLoading(true); // Opcional: no mostrar loader global en refrescos suaves
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push("/login");
            return;
        }

        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*, created_by(full_name)')
            .order('created_at', { ascending: false });

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
                taxAmount: ticket.tax_details?.amount || 0 // Asumiendo estructura o campo directo
            }));
            setExpenses(mappedExpenses);
        }
        setLoading(false);
    }, [router]);

    // Carga inicial
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Handler para abrir Sheet (Ver/Editar)
    const handleRowClick = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsSheetOpen(true);
    };

    // Handler para NUEVO gasto
    const handleNewExpense = () => {
        setSelectedExpense(null); // Null indica creación
        setIsSheetOpen(true);
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
                        fetchTickets();

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

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full w-full p-6">

            {/* Header con Botón de Acción */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Mis Rendiciones</h1>
                <Button onClick={handleNewExpense} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Gasto
                </Button>
            </div>

            <ExpenseTable
                data={expenses}
                isLoading={false}
                onRowClick={handleRowClick}
                onDelete={handleDeleteTicket}
            />

            <ExpenseDetailsSheet
                expense={selectedExpense}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchTickets} // Al guardar, recargamos la lista
            />
        </div>
    );
}