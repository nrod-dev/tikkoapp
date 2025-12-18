"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Assuming Dialog components exist in ui/dialog, if not I'll check or use Sheet which I know exists, but plan called for Modal. Let's use Dialog for modal behavior.
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";


interface AIScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmed: (data: any) => void;
}

export function AIScanModal({ isOpen, onClose, onConfirmed }: AIScanModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setScannedData(null);
        setPreviewUrl(null);
        setIsUploading(false);
        setIsScanning(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) resetState();
        onClose();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // Local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Upload and Scan
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

            setIsUploading(false);

            // Start Scan
            setIsScanning(true);

            console.log("Invoking scan-receipt with URL:", publicUrl);
            const { data, error } = await supabase.functions.invoke('scan-receipt', {
                body: { receiptUrl: publicUrl }
            });

            if (error) {
                console.error("Function error:", error);
                // Fallback to simple error message to avoid parsing issues
                const message = error.message || "Error al comunicarse con el servicio de IA";
                throw new Error(message);
            }

            if (data && !data.error) {
                setScannedData({ ...data, receiptUrl: publicUrl });
                toast.success("Información extraída con éxito");
            } else {
                throw new Error(data?.error || "Error desconocido al escanear");
            }

        } catch (error: any) {
            console.error("Scanning error:", error);
            const displayMsg = error instanceof Error ? error.message : "Error al procesar el archivo";
            toast.error(displayMsg);
        } finally {
            setIsUploading(false);
            setIsScanning(false);
        }
    };

    const handleConfirm = () => {
        onConfirmed(scannedData);
        handleOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Cargar con IA
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-4 space-y-4">
                    {!previewUrl ? (
                        <div
                            className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">Click para subir comprobante</p>
                        </div>
                    ) : (
                        <div className="w-full relative rounded-lg overflow-hidden border">
                            <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain bg-slate-100" />
                            {(isUploading || isScanning) && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    <p className="text-sm font-medium">
                                        {isUploading ? "Subiendo..." : "Analizando..."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    {scannedData && !isScanning && (
                        <div className="w-full text-sm space-y-2 bg-slate-50 p-3 rounded-md border">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Comercio:</span>
                                <span className="font-medium">{scannedData.merchant_name || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Fecha:</span>
                                <span className="font-medium">{scannedData.date || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Monto:</span>
                                <span className="font-medium">{scannedData.amount ? `$${scannedData.amount}` : "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">IVA:</span>
                                <span className="font-medium">{scannedData.iva_amount !== null && scannedData.iva_amount !== undefined ? `$${scannedData.iva_amount}` : "No discriminado"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Rubro:</span>
                                <span className="font-medium">{scannedData.category || "-"}</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!scannedData || isScanning}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        Confirmar y Editar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
