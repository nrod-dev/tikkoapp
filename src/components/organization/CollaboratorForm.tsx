import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { User, Phone, Briefcase, Building2, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CollaboratorFormProps {
    onSuccess: () => void;
    collaborator?: any; // If present, edit mode
    organizationId?: string; // Optional if we infer or pass it
}

export function CollaboratorForm({ onSuccess, collaborator, organizationId }: CollaboratorFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        legajo: "",
        sector: ""
    })

    useEffect(() => {
        if (collaborator) {
            setFormData({
                first_name: collaborator.first_name,
                last_name: collaborator.last_name,
                phone: collaborator.phone,
                legajo: collaborator.legajo || "",
                sector: collaborator.sector || ""
            })
        }
    }, [collaborator])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (collaborator) {
                // Edit
                const { error } = await supabase
                    .from("collaborators")
                    .update(formData)
                    .eq("id", collaborator.id)

                if (error) throw error
                toast.success("Colaborador actualizado correctamente")
            } else {
                // Create
                let orgId = organizationId;
                if (!orgId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: membership } = await supabase
                            .from('organization_members')
                            .select('organization_id')
                            .eq('user_id', user.id)
                            .single();
                        orgId = membership?.organization_id;
                    }
                }

                if (!orgId) {
                    toast.error("Error: No se encontró la organización del usuario.")
                    setLoading(false);
                    return;
                }

                const { error } = await supabase
                    .from("collaborators")
                    .insert([{ ...formData, organization_id: orgId }])

                if (error) throw error
                toast.success("Colaborador creado exitosamente")
            }
            onSuccess()
        } catch (error: any) {
            console.error("Error saving collaborator:", error)
            toast.error("Error al guardar: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-slate-700">Nombre</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="first_name"
                            name="first_name"
                            className="pl-9"
                            required
                            placeholder="Juan"
                            value={formData.first_name}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-slate-700">Apellido</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="last_name"
                            name="last_name"
                            className="pl-9"
                            required
                            placeholder="Pérez"
                            value={formData.last_name}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Celular (WhatsApp)</Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        id="phone"
                        name="phone"
                        className="pl-9"
                        placeholder="5491112345678"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>
                <p className="text-xs text-slate-500 ml-1">Ingresá el número con código de país, sin el + (ej: 54911...)</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="legajo" className="text-sm font-medium text-slate-700">Legajo</Label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="legajo"
                            name="legajo"
                            className="pl-9"
                            placeholder="LEG-1234"
                            value={formData.legajo}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sector" className="text-sm font-medium text-slate-700">Sector</Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="sector"
                            name="sector"
                            className="pl-9"
                            placeholder="Ventas"
                            value={formData.sector}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {collaborator ? "Guardar Cambios" : "Crear Colaborador"}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
