"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExpenseTable } from "@/components/dashboard/ExpenseTable";
import { ExpenseDetailsSheet } from "@/components/dashboard/ExpenseDetailsSheet";
import { Expense } from "@/lib/data";
import { Loader2 } from "lucide-react";

export function ExpensesView() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const initDashboard = async () => {
            // 1. Check Session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            // 2. Fetch Data
            const { data: tickets, error } = await supabase
                .from('tickets')
                .select('*');

            if (error) {
                console.error("Error fetching tickets:", error);
            }

            // 3. Map Data (snake_case -> camelCase)
            if (tickets) {
                const mappedExpenses: Expense[] = tickets.map((ticket: any) => ({
                    id: ticket.id,
                    merchantName: ticket.merchant_name || 'Desconocido',
                    merchantLogo: (ticket.merchant_name && ticket.merchant_name.charAt(0)) || '?', // Simple placeholder logic
                    date: ticket.date, // Assuming DB date is compatible string or needs formatting
                    user: 'Usuario Actual', // Placeholder as 'tickets' table might not have user name yet
                    amount: ticket.amount || 0,
                    currency: ticket.currency || 'ARS',
                    status: ticket.status === 'approved' ? 'approved' : ticket.status === 'rejected' ? 'rejected' : 'pending',
                    paymentMethod: 'Mendel',
                    receiptUrl: ticket.receipt_url
                }));
                setExpenses(mappedExpenses);
            }

            setLoading(false);
        };

        initDashboard();
    }, [router]);

    const handleRowClick = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsSheetOpen(true);
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ExpenseTable data={expenses} isLoading={loading} onRowClick={handleRowClick} />

            <ExpenseDetailsSheet
                expense={selectedExpense}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
            />
        </div>
    );
}
