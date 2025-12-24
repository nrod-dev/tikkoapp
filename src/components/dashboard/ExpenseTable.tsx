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
import { cn, getMerchantStyle } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FileText, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Expense, CATEGORY_ICONS } from "@/lib/data";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExpenseTableProps {
    data: Expense[];
    isLoading: boolean;
    onRowClick: (expense: Expense) => void;
    onDelete: (id: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalCount: number;
}

export function ExpenseTable({
    data,
    isLoading,
    onRowClick,
    onDelete,
    currentPage,
    totalPages,
    onPageChange,
    totalCount
}: ExpenseTableProps) {
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
                            <TableHead>Usuario</TableHead>
                            <TableHead className="text-right">IVA</TableHead>
                            <TableHead className="text-right">Importe total</TableHead>
                            <TableHead className="pl-8">Estado</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-slate-500">
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
                                            <div className={cn(
                                                "h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold",
                                                getMerchantStyle(expense.merchantName) // Keep color style or make generic? User said "representative icon". I will keep color for background but change content.
                                            )}>
                                                {/* Icon Logic */}
                                                {(() => {
                                                    // Dynamic icon selection
                                                    const IconComponent = expense.category && CATEGORY_ICONS[expense.category]
                                                        ? CATEGORY_ICONS[expense.category]
                                                        : CATEGORY_ICONS["default"];

                                                    return <IconComponent className="h-5 w-5" />;
                                                })()}
                                            </div>
                                            <span>{expense.merchantName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell>{expense.user}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {expense.ivaAmount !== null
                                            ? `${expense.ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ${expense.currency}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} {expense.currency}
                                    </TableCell>
                                    <TableCell className="pl-8">
                                        <Badge variant={expense.status === 'approved' ? 'default' : 'secondary'}>
                                            {expense.status === 'approved' ? 'Aprobado' :
                                                expense.status === 'rejected' ? 'Rechazado' :
                                                    expense.status === 'pendiente' ? 'Pendiente' :
                                                        expense.status === 'processing' ? 'Procesando' : expense.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => onRowClick(expense)}
                                                >
                                                    Ver detalle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => onDelete(expense.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Mostrando del {(currentPage - 1) * 10 + 1} al {Math.min(currentPage * 10, totalCount)} de {totalCount} resultados
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Ir a la página anterior</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                        Página {currentPage} de {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <span className="sr-only">Ir a la página siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}