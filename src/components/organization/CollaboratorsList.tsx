import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit2, Trash2 } from "lucide-react"

interface Collaborator {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    legajo: string;
    sector: string;
}

interface CollaboratorsListProps {
    collaborators: Collaborator[];
    onEdit: (collaborator: Collaborator) => void;
    onDelete: (collaborator: Collaborator) => void;
}

export function CollaboratorsList({ collaborators, onEdit, onDelete }: CollaboratorsListProps) {
    return (
        <div className="rounded-md border border-slate-200">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Legajo</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Celular</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {collaborators.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No hay colaboradores registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        collaborators.map((collab) => (
                            <TableRow key={collab.id}>
                                <TableCell className="font-medium">{collab.first_name} {collab.last_name}</TableCell>
                                <TableCell>{collab.legajo || "-"}</TableCell>
                                <TableCell>{collab.sector || "-"}</TableCell>
                                <TableCell>{collab.phone}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(collab)}>
                                        <Edit2 className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(collab)}>
                                        <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
