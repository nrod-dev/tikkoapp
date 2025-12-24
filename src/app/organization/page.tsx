"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CollaboratorsList } from "@/components/organization/CollaboratorsList";
import { CollaboratorForm } from "@/components/organization/CollaboratorForm";
import { supabase } from "@/lib/supabase";

export default function OrganizationPage() {
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<any | null>(null);
    const [deletingCollaborator, setDeletingCollaborator] = useState<any | null>(null);

    // const supabase = createClient(); - removed, using imported singleton

    const fetchCollaborators = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Get organization ID first
        const { data: membership } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .single();

        if (membership?.organization_id) {
            const { data, error } = await supabase
                .from("collaborators")
                .select("*")
                .eq("organization_id", membership.organization_id)
                .order("first_name");

            if (!error) {
                setCollaborators(data || []);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCollaborators();
    }, []);

    const handleSuccess = () => {
        setIsSheetOpen(false);
        setEditingCollaborator(null);
        fetchCollaborators();
    };

    const handleEdit = (collaborator: any) => {
        setEditingCollaborator(collaborator);
        setIsSheetOpen(true);
    };

    const handleDeleteClick = (collaborator: any) => {
        setDeletingCollaborator(collaborator);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCollaborator) return;

        try {
            // 1. Delete from whatsapp_sessions
            // Note: Since I removed the FK, this is safe to delete. 
            // Ideally we delete by user_id which matches collaborator id.
            await supabase.from("whatsapp_sessions").delete().eq("user_id", deletingCollaborator.id);

            // 2. Delete from collaborators
            const { error } = await supabase.from("collaborators").delete().eq("id", deletingCollaborator.id);

            if (error) throw error;

            fetchCollaborators();
        } catch (error: any) {
            console.error("Error deleting:", error);
            alert("Error al eliminar: " + error.message);
        } finally {
            setDeletingCollaborator(null);
        }
    };

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Mi Organización</h1>
                        <p className="text-slate-500">Gestiona los colaboradores y sus accesos.</p>
                    </div>

                    <Sheet open={isSheetOpen} onOpenChange={(open) => {
                        setIsSheetOpen(open);
                        if (!open) setEditingCollaborator(null);
                    }}>
                        <SheetTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Colaborador
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>{editingCollaborator ? "Editar Colaborador" : "Nuevo Colaborador"}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <CollaboratorForm onSuccess={handleSuccess} collaborator={editingCollaborator} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {loading ? (
                    <div className="text-center py-10">Cargando...</div>
                ) : (
                    <CollaboratorsList
                        collaborators={collaborators}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                    />
                )}

                <Dialog open={!!deletingCollaborator} onOpenChange={(open) => !open && setDeletingCollaborator(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Estás seguro?</DialogTitle>
                            <DialogDescription>
                                Esta acción eliminará al colaborador <b>{deletingCollaborator?.first_name} {deletingCollaborator?.last_name}</b> y lo desvinculará del bot de WhatsApp. Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingCollaborator(null)}>Cancelar</Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm}>Eliminar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
