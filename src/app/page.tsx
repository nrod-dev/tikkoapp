
"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ExpenseTable } from "@/components/dashboard/ExpenseTable";
import { ExpenseDetailsSheet } from "@/components/dashboard/ExpenseDetailsSheet";
import { Expense } from "@/lib/data";

export default function DashboardPage() {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsSheetOpen(true);
  };

  return (
    <AppLayout>
      <div className="h-full w-full">
        {/* Top Header Placeholder (to match spacing if needed, or included in table) */}
        {/* The table includes the filter header as per the component design */}
        <ExpenseTable onRowClick={handleRowClick} />

        <ExpenseDetailsSheet
          expense={selectedExpense}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
