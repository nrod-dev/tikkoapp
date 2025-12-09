"use client";

import AppLayout from "@/components/layout/AppLayout";
import { ExpensesView } from "@/components/dashboard/ExpensesView";

export default function RendicionesPage() {
    return (
        <AppLayout>
            <ExpensesView />
        </AppLayout>
    );
}
