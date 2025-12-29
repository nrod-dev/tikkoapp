"use client";

import { useState, useEffect, useRef } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Expense, EXPENSE_CATEGORIES } from "@/lib/data";
import { Upload, Loader2, Calendar as CalendarIcon, DollarSign, Store, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ExpenseDetailsSheetProps {
    expense: Expense | null; // null = Nuevo Gasto
    initialData?: any; // Data from AI
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Para recargar la tabla
}

export function ExpenseDetailsSheet({ expense, initialData, isOpen, onClose, onSuccess }: ExpenseDetailsSheetProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estado local del formulario
    const [formData, setFormData] = useState({
        merchantName: "",
        date: "",
        amount: "",
        ivaAmount: "", // New State
        currency: "ARS",
        category: "",
        receiptUrl: "",
        merchantTaxId: ""
    });

    // Estado separado para preview local (UX inmediata)
    const [localPreview, setLocalPreview] = useState<string | null>(null);

    // Efecto para cargar datos al abrir (Editar vs Crear)
    useEffect(() => {
        if (isOpen) {
            setLocalPreview(null); // Reset local preview
            if (expense) {
                setFormData({
                    merchantName: expense.merchantName,
                    date: expense.date,
                    amount: expense.amount.toString(),
                    ivaAmount: expense.ivaAmount ? expense.ivaAmount.toString() : "",
                    currency: expense.currency || "ARS",
                    category: (expense as any).category || "",
                    receiptUrl: expense.receiptUrl || "",
                    merchantTaxId: expense.merchantTaxId || ""
                });
            } else if (initialData) {
                // Nuevo con datos de IA
                setFormData({
                    merchantName: initialData.merchant_name || "",
                    date: initialData.date || new Date().toISOString().split('T')[0],
                    amount: initialData.amount ? initialData.amount.toString() : "",
                    ivaAmount: initialData.iva_amount ? initialData.iva_amount.toString() : "",
                    currency: initialData.currency || "ARS",
                    category: initialData.category || "",
                    receiptUrl: initialData.receiptUrl || "",
                    merchantTaxId: initialData.merchant_tax_id || ""
                });
            } else {
                // Reset para nuevo gasto
                setFormData({
                    merchantName: "",
                    date: new Date().toISOString().split('T')[0],
                    amount: "",
                    ivaAmount: "",
                    currency: "ARS",
                    category: "",
                    receiptUrl: "",
                    merchantTaxId: ""
                });
            }
        }
    }, [isOpen, expense, initialData]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // 1. Mostrar preview local inmediatamente
        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);

        await handleUpload(file);
    };

    const handleUpload = async (file: File) => {
        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `uploads/${Date.now()}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            console.log("Imagen subida con éxito:", publicUrl); // DEBUG: Verificar URL
            setFormData(prev => ({ ...prev, receiptUrl: publicUrl }));

        } catch (error: any) {
            console.error("Error upload:", error);
            toast.error("Error al subir imagen: " + error.message);
            setLocalPreview(null); // Revertir preview si falla
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // 1. Validaciones de formulario
            if (!formData.amount || !formData.merchantName) {
                toast.error("Completá monto y comercio por favor.");
                setIsSaving(false);
                return;
            }

            // 2. Verificar sesión
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
            }

            // 3. Obtener la Organización ID automáticamente
            const { data: orgId, error: orgError } = await supabase
                .rpc('get_my_org_id');

            if (orgError || !orgId) {
                console.error("Error RPC:", orgError);
                throw new Error("No se pudo asignar una organización al usuario.");
            }

            // 4. Preparar el objeto para guardar
            const payload = {
                merchant_name: formData.merchantName,
                date: formData.date,
                amount: parseFloat(formData.amount),
                iva_amount: formData.ivaAmount ? parseFloat(formData.ivaAmount) : null,
                currency: formData.currency,
                category: formData.category,
                receipt_url: formData.receiptUrl,
                merchant_tax_id: formData.merchantTaxId,
                status: 'pendiente',
                created_by: session.user.id,
                organization_id: orgId
            };

            let error;
            if (expense) {
                // UPDATE
                const response = await supabase
                    .from('tickets')
                    .update(payload)
                    .eq('id', expense.id);
                error = response.error;
            } else {
                // INSERT
                const response = await supabase
                    .from('tickets')
                    .insert(payload);
                error = response.error;
            }

            if (error) {
                console.error("Error en operación DB:", error);
                throw error;
            }

            toast.success(expense ? "Gasto actualizado correctamente" : "Gasto creado correctamente");
            onSuccess(); // Recargar tabla
            onClose(); // Cerrar panel

        } catch (error: any) {
            console.error("Error capturado en handleSave:", error);
            toast.error("Error al guardar: " + (error.message || error.details || "Error desconocido"));
        } finally {
            setIsSaving(false);
        }
    };

    // Determinar qué imagen mostrar: localPreview > formData.receiptUrl
    const displayImage = localPreview || formData.receiptUrl;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
                <SheetHeader className="space-y-4 pb-6 border-b">
                    <SheetTitle className="text-2xl font-bold text-slate-900">
                        {expense ? "Editar Gasto" : "Nuevo Gasto"}
                    </SheetTitle>
                </SheetHeader>

                <div className="py-6 px-6 space-y-6">
                    {/* Formulario */}
                    <div className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="merchant">Comercio</Label>
                            <div className="relative">
                                <Store className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    id="merchant"
                                    className="pl-9"
                                    placeholder="Nombre del local"
                                    value={formData.merchantName}
                                    onChange={e => setFormData({ ...formData, merchantName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="grid w-full items-center gap-1.5 flex-1">
                                <Label htmlFor="amount">Monto</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="amount"
                                        type="number"
                                        className="pl-9"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid w-1/3 items-center gap-1.5">
                                <Label htmlFor="currency">Moneda</Label>
                                <Input value={formData.currency} disabled />
                            </div>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="ivaAmount">IVA</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    id="ivaAmount"
                                    type="number"
                                    className="pl-9"
                                    placeholder="0.00 (Opcional)"
                                    value={formData.ivaAmount}
                                    onChange={e => setFormData({ ...formData, ivaAmount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="date">Fecha</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    id="date"
                                    type="date"
                                    className="pl-9 block"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="category">Categoría</Label>
                            <select
                                id="category"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Subida de Imagen */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            Comprobante
                        </h3>
                        {displayImage ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="h-64 w-full bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center overflow-hidden relative">
                                    <img
                                        src={displayImage}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            console.error("Error loading image:", displayImage);
                                            e.currentTarget.src = "https://placehold.co/600x400?text=Error+Cargando";
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 text-slate-600"
                                    onClick={() => window.open(displayImage, '_blank')}
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar Comprobante
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-primary">
                                    Cambiar imagen
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="h-24 w-full border-dashed border-2 flex flex-col gap-2 hover:bg-slate-50"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : <Upload className="text-primary" />}
                                <span className="text-sm text-slate-500">Subir foto o PDF</span>
                            </Button>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                        <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
                            {expense ? "Guardar" : "Crear"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
