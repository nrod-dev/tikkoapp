"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl?: string | null;
    merchantName?: string;
}

export function ReceiptModal({ isOpen, onClose, imageUrl, merchantName }: ReceiptModalProps) {
    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Comprobante - {merchantName || 'Detalle'}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-2 space-y-4">
                    <div className="w-full relative rounded-lg overflow-hidden border bg-slate-100 flex items-center justify-center min-h-[300px]">
                        <img
                            src={imageUrl}
                            alt="Comprobante"
                            className="max-w-full max-h-[60vh] object-contain"
                        />
                    </div>

                    <a href={imageUrl} download={`comprobante-${merchantName || 'ticket'}.jpg`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Descargar Imagen
                        </Button>
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
}
