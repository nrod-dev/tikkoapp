// src/components/dashboard/ExpenseTable.tsx
"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/lib/data"; // Re-import Expense interface

interface ExpenseTableProps {
    data: Expense[];
    isLoading: boolean;
    onRowClick: (expense: Expense) => void;
}

export function ExpenseTable({ data, isLoading, onRowClick }: ExpenseTableProps) {
    if (isLoading) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    }

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Comercio</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Importe</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                    No hay rendiciones cargadas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((expense) => (
                                <TableRow
                                    key={expense.id}
                                    className="cursor-pointer hover:bg-slate-50"
                                    onClick={() => onRowClick(expense)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {/* Logic to show logo or just name if logo is missing/placeholder */}
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold ${expense.merchantName.includes('YPF') ? 'bg-blue-600' :
                                                    expense.merchantName.includes('DiDi') ? 'bg-orange-500' :
                                                        'bg-slate-400'
                                                }`}>
                                                {expense.merchantName.charAt(0)}
                                            </div>
                                            <span>{expense.merchantName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} {expense.currency}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={expense.status === 'approved' ? 'default' : 'secondary'}>
                                            {expense.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <FileText className="h-4 w-4 text-slate-400" />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}