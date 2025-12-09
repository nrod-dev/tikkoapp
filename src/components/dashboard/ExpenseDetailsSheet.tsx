
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Expense } from "@/lib/data";
import { FileText, Upload, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpenseDetailsSheetProps {
    expense: Expense | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ExpenseDetailsSheet({ expense, isOpen, onClose }: ExpenseDetailsSheetProps) {
    if (!expense) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="space-y-4 pb-6 border-b">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                {expense.merchantLogo}
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-bold text-slate-900">
                                    {expense.amount.toLocaleString('es-AR', { style: 'decimal', minimumFractionDigits: 2 })} {expense.currency}
                                </SheetTitle>
                                <p className="text-sm text-slate-500">{expense.merchantName}<br />{expense.date} 17:18</p>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="py-6 space-y-8">
                    {/* Comprobantes Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-red-500 mb-4 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            Comprobantes
                        </h3>
                        <div className="flex gap-4">
                            {/* Placeholder Receipt Image */}
                            <div className="h-24 w-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                                <span className="relative z-10 text-xs text-gray-500">Recibo</span>
                            </div>

                            <Button variant="outline" className="h-24 w-full border-dashed border-2 flex flex-col gap-2 hover:bg-slate-50">
                                <Upload className="h-5 w-5 text-blue-500" />
                                <span className="text-blue-500 font-medium">Cargar</span>
                                <span className="text-xs text-slate-400">Imagen (JPG, JPEG, PNG), PDF</span>
                            </Button>
                        </div>
                    </div>

                    {/* Transaction Data Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Datos de la transacción</h3>
                        {/* Add more fields here if needed based on the image, for now generic info */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                            <p className="text-sm font-medium text-slate-700 mb-2">Aprobación de la transacción Folio 504EB4A8</p>
                            <div className="flex gap-3 mt-4">
                                <Button variant="outline" className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                    Rechazar
                                </Button>
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                    Aprobar
                                </Button>
                            </div>
                            <div className="flex gap-2 mt-3 text-xs text-slate-500">
                                <div className="h-4 w-4 bg-blue-600 rounded-full text-white flex items-center justify-center shrink-0" style={{ fontSize: '10px' }}>!</div>
                                <p>Al comenzar la aprobación, no se podrá editar la transacción.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
