"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExpenseTable } from "@/components/dashboard/ExpenseTable";
import { ExpenseDetailsSheet } from "@/components/dashboard/ExpenseDetailsSheet";
import { Expense } from "@/lib/data";
import { Loader2, Plus, Sparkles, FileDown, Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXPENSE_CATEGORIES } from "@/lib/data";
import { toast } from "sonner";
import { AIScanModal } from "@/components/dashboard/AIScanModal";

export function ExpensesView() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [aiDraftData, setAiDraftData] = useState<any>(null); // Datos temporales de IA
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        userId: "all",
        category: "all",
        status: "all"
    });
    const [usersOptions, setUsersOptions] = useState<{ id: string, name: string }[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const router = useRouter();

    // Función para cargar datos (Memoizada)
    const fetchTickets = useCallback(async (page: number = 1) => {
        console.log("fetchTickets started", { page, filters });
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log("No session, redirecting");
                router.push("/login");
                return;
            }

            setLoading(true);

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('tickets')
                .select('*, created_by(full_name), collaborator_id(first_name, last_name)', { count: 'exact' });

            console.log("Building query with filters:", filters);

            // Apply Filters
            if (filters.startDate) query = query.gte('date', filters.startDate);
            if (filters.endDate) query = query.lte('date', filters.endDate);
            if (filters.category !== 'all') query = query.eq('category', filters.category);
            if (filters.status !== 'all') query = query.eq('status', filters.status);
            if (filters.userId !== 'all') {
                query = query.or(`collaborator_id.eq.${filters.userId},created_by.eq.${filters.userId}`);
            }

            console.log("Executing query...");
            const { data: tickets, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            console.log("Query finished", { tickets: tickets?.length, error, count });

            if (error) throw error;

            if (tickets) {
                const mappedExpenses: Expense[] = (tickets as any[]).map((ticket) => ({
                    id: ticket.id,
                    merchantName: ticket.merchant_name || 'Sin Nombre',
                    merchantLogo: (ticket.merchant_name?.charAt(0)) || '?',
                    date: ticket.date || '',
                    user: (ticket.collaborator_id?.first_name
                        ? `${ticket.collaborator_id.first_name} ${ticket.collaborator_id.last_name}`
                        : ticket.created_by?.full_name) || 'Desconocido',
                    amount: ticket.amount || 0,
                    currency: ticket.currency || 'ARS',
                    status: ticket.status as any,
                    paymentMethod: 'Efectivo',
                    receiptUrl: ticket.receipt_url,
                    category: ticket.category,
                    ivaAmount: ticket.iva_amount !== undefined ? ticket.iva_amount : null,
                    merchantTaxId: ticket.merchant_tax_id || ''
                }));
                setExpenses(mappedExpenses);
                if (count !== null) setTotalCount(count);
            }
        } catch (error: any) {
            console.error("Error fetching tickets:", error);
            toast.error("Error al cargar rendiciones: " + (error.message || "Error desconocido"));
        } finally {
            setLoading(false);
        }


    }, [router, pageSize, filters]);

    // Carga inicial
    useEffect(() => {
        fetchTickets(currentPage);
    }, [fetchTickets, currentPage]);

    // Fetch Users for Filter
    useEffect(() => {
        const fetchUsers = async () => {
            const { data: collaborators } = await supabase.from('collaborators').select('id, first_name, last_name');
            const { data: profiles } = await supabase.from('profiles').select('id, full_name');

            const opts: { id: string, name: string }[] = [];

            if (collaborators) {
                collaborators.forEach((c: any) => {
                    if (c.first_name && c.last_name) opts.push({ id: c.id, name: `${c.first_name} ${c.last_name}` });
                });
            }
            if (profiles) {
                profiles.forEach((p: any) => {
                    // Avoid duplicates if profile is also a collaborator (unlikely but safe)
                    if (!opts.find(o => o.id === p.id)) {
                        opts.push({ id: p.id, name: p.full_name || 'Admin' });
                    }
                });
            }
            setUsersOptions(opts);
        };
        fetchUsers();
    }, []);

    // CSV Export
    const handleExportCSV = async () => {
        try {
            toast.loading("Generando reporte...");

            let query = supabase
                .from('tickets')
                .select('*, created_by(full_name), collaborator_id(first_name, last_name)');

            // Apply Filters (Same logic)
            if (filters.startDate) query = query.gte('date', filters.startDate);
            if (filters.endDate) query = query.lte('date', filters.endDate);
            if (filters.category !== 'all') query = query.eq('category', filters.category);
            if (filters.status !== 'all') query = query.eq('status', filters.status);
            if (filters.userId !== 'all') {
                query = query.or(`collaborator_id.eq.${filters.userId},created_by.eq.${filters.userId}`);
            }

            const { data: tickets, error } = await query.order('date', { ascending: false });

            if (error || !tickets) throw new Error("Error fetching data");

            // Format Data
            const csvRows = [
                ["Fecha", "Comercio", "Usuario", "Categoria", "Estado", "Moneda", "Monto Total", "IVA", "Metodo Pago"],
                ...tickets.map((t: any) => {
                    const user = t.collaborator_id
                        ? `${t.collaborator_id.first_name} ${t.collaborator_id.last_name}`
                        : t.created_by?.full_name || 'Desconocido';

                    return [
                        t.date,
                        `"${t.merchant_name || ''}"`, // Quote to handle commas
                        `"${user}"`,
                        t.category || '',
                        t.status,
                        t.currency,
                        t.amount,
                        t.iva_amount || 0,
                        t.payment_method || 'Efectivo'
                    ].join(",");
                })
            ];

            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `rendiciones_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.dismiss();
            toast.success("Reporte descargado");

        } catch (e) {
            console.error(e);
            toast.dismiss();
            toast.error("Error al exportar");
        }
    };

    const clearFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            userId: "all",
            category: "all",
            status: "all"
        });
        setCurrentPage(1);
    };

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

    console.log("Render ExpensesView: ", { loading, expensesCount: expenses.length });

    return (
        <div className="h-full w-full p-6">

            {/* Header con Botón de Acción */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Mis gastos</h1>
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

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center flex-wrap">

                {/* Date Range */}
                <div className="flex gap-2 items-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-500">Desde</span>
                        <Input
                            type="date"
                            className="h-9 w-36 bg-slate-50 border-slate-200"
                            value={filters.startDate}
                            onChange={(e) => {
                                setFilters({ ...filters, startDate: e.target.value });
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-500">Hasta</span>
                        <Input
                            type="date"
                            className="h-9 w-36 bg-slate-50 border-slate-200"
                            value={filters.endDate}
                            onChange={(e) => {
                                setFilters({ ...filters, endDate: e.target.value });
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* User Filter */}
                <div className="flex flex-col gap-1 min-w-[140px]">
                    <span className="text-xs font-semibold text-slate-500">Usuario</span>
                    <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                        value={filters.userId}
                        onChange={(e) => {
                            setFilters({ ...filters, userId: e.target.value });
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Todos</option>
                        {usersOptions.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                {/* Category Filter */}
                <div className="flex flex-col gap-1 min-w-[140px]">
                    <span className="text-xs font-semibold text-slate-500">Categoría</span>
                    <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                        value={filters.category}
                        onChange={(e) => {
                            setFilters({ ...filters, category: e.target.value });
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Todas</option>
                        {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex flex-col gap-1 min-w-[140px]">
                    <span className="text-xs font-semibold text-slate-500">Estado</span>
                    <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                        value={filters.status}
                        onChange={(e) => {
                            setFilters({ ...filters, status: e.target.value });
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 ml-auto pb-0.5">
                    {(filters.startDate || filters.endDate || filters.userId !== 'all' || filters.category !== 'all' || filters.status !== 'all') && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-red-600 h-9">
                            <FilterX className="h-4 w-4 mr-2" />
                            Limpiar
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 text-slate-700 border-slate-300 hover:bg-slate-50">
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar CSV
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