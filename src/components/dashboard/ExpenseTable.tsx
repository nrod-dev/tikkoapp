
"use strict";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { expenses, Expense } from "@/lib/data";
import { FileText, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExpenseTableProps {
    onRowClick: (expense: Expense) => void;
}

export function ExpenseTable({ onRowClick }: ExpenseTableProps) {
    return (
        <div className="p-6">
            {/* Filters Header (Visual only as per reqs) */}
            <div className="flex flex-wrap gap-4 mb-6 items-center">
                <Button variant="outline" className="gap-2 rounded-full border-slate-300">
                    <Filter className="h-4 w-4" />
                    Filtros
                    <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">2</Badge>
                </Button>
                <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                    Estado de la aprobación: Lista para aprobar
                    <button className="hover:text-slate-900">×</button>
                </div>
                <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                    Fecha de la transacción: 03/12/2024 - 03/12/2025
                    <button className="hover:text-slate-900">×</button>
                </div>
                <button className="text-blue-600 text-sm font-medium hover:underline">Borrar filtros</button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[300px]">Comercio</TableHead>
                            <TableHead>Fecha de la transacción</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead className="text-right">Importe</TableHead>
                            <TableHead>Método de pago</TableHead>
                            <TableHead className="w-[100px]">Comprobantes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow
                                key={expense.id}
                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => onRowClick(expense)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold ${expense.merchantName.includes('YPF') ? 'bg-blue-600' :
                                                expense.merchantName.includes('DiDi') ? 'bg-orange-500' :
                                                    'bg-slate-400'
                                            }`}>
                                            {expense.merchantLogo}
                                        </div>
                                        <span className="text-slate-700 font-semibold">{expense.merchantName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500">{expense.date}</TableCell>
                                <TableCell className="text-slate-500">{expense.user}</TableCell>
                                <TableCell className="text-right font-bold text-slate-900">
                                    {expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} {expense.currency}
                                </TableCell>
                                <TableCell className="text-slate-500">{expense.paymentMethod}</TableCell>
                                <TableCell>
                                    <div className="flex items-center text-blue-500">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
