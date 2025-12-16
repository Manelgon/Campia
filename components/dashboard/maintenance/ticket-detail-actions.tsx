"use client";
// forcing rebuild

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    Edit,
    UserPlus,
    PlayCircle,
    Loader2,
    Square
} from "lucide-react";
import {
    deleteTicketAction,
    updateTicketStatusAction,
    assignTicketAction,
    updateTicketDetailsAction
} from "@/app/dashboard/maintenance/actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TicketDetailActionsProps {
    ticketId: string;
    currentStatus: string;
    currentAssigneeId?: string | null;
    userRole: string; // "admin", "maintenance", "cleaner", "reception" etc.
    staffMembers: any[]; // For assignment dialog
    initialTitle: string;
    initialDescription: string;
    initialPriority: string;
}

export function TicketDetailActions({
    ticketId,
    currentStatus,
    currentAssigneeId,
    userRole,
    staffMembers,
    initialTitle,
    initialDescription,
    initialPriority
}: TicketDetailActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState(currentAssigneeId || "");
    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const router = useRouter();

    const isAdmin = userRole === "admin" || userRole === "superadmin"; // Adjust based on your role schema
    const isMaintenance = userRole === "maintenance";

    // "Empezar" -> Change status to in_progress
    // "Finalizar" -> Change status to resolved
    // Available to Admin AND Maintenance
    const canStart = (isAdmin || isMaintenance) && (currentStatus === 'open' || currentStatus === 'in_progress');

    // Delete, Edit, Assign -> Admin only
    const canManage = isAdmin;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteTicketAction(ticketId);
            if (res?.error) {
                toast.error(res.error);
                setIsDeleting(false);
            } else {
                toast.success("Incidencia eliminada");
                // Redirect handled by server action
            }
        } catch (e) {
            toast.error("Error al eliminar");
            setIsDeleting(false);
        }
    };

    const handleAction = async () => {
        setIsStarting(true);
        try {
            const newStatus = currentStatus === 'open' ? 'in_progress' : 'resolved';
            await updateTicketStatusAction(ticketId, newStatus);
            toast.success(newStatus === 'in_progress' ? "Incidencia en progreso" : "Incidencia finalizada");
            setIsStarting(false);
        } catch (e) {
            toast.error("Error al actualizar estado");
            setIsStarting(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedAssignee) return;
        setIsAssigning(true);
        try {
            const formData = new FormData();
            formData.append("taskId", ticketId);
            formData.append("userId", selectedAssignee);

            const res = await assignTicketAction(formData);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Asignación actualizada");
                setOpenAssignDialog(false);
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <TooltipProvider>
            <div className="flex items-center gap-1">
                {canStart && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={handleAction}
                                disabled={isStarting}
                                size="icon"
                                className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                            >
                                {isStarting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : currentStatus === 'open' ? (
                                    <PlayCircle className="h-5 w-5" />
                                ) : (
                                    <Square className="h-5 w-5 fill-current" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{currentStatus === 'open' ? "Empezar Incidencia" : "Finalizar Incidencia"}</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {canManage && currentStatus === 'open' && (
                    <>
                        <Dialog open={openAssignDialog} onOpenChange={setOpenAssignDialog}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                            <UserPlus className="h-5 w-5" />
                                        </Button>
                                    </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Asignar Responsable</p>
                                </TooltipContent>
                            </Tooltip>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Asignar Incidencia</DialogTitle>
                                    <DialogDescription>
                                        Selecciona un miembro del personal para esta incidencia.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar responsable" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Sin Asignar</SelectItem>
                                            {staffMembers.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.full_name} ({s.role === 'maintenance' ? 'Mantenimiento' : s.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpenAssignDialog(false)}>Cancelar</Button>
                                    <Button onClick={handleAssign} disabled={isAssigning}>
                                        {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Asignación"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </Button>
                                    </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Editar Incidencia</p>
                                </TooltipContent>
                            </Tooltip>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Editar Incidencia</DialogTitle>
                                    <DialogDescription>
                                        Modifica los detalles de la incidencia.
                                    </DialogDescription>
                                </DialogHeader>
                                <form action={async (formData) => {
                                    setIsEditing(true);
                                    await updateTicketDetailsAction(formData);
                                    setIsEditing(false);
                                    setOpenEditDialog(false);
                                    toast.success("Incidencia actualizada");
                                }}>
                                    <input type="hidden" name="taskId" value={ticketId} />
                                    <div className="grid gap-4 py-4">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="title" className="text-sm font-medium">Título</label>
                                            <input
                                                type="text"
                                                name="title"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Título de la incidencia"
                                                defaultValue={initialTitle}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="priority" className="text-sm font-medium">Prioridad</label>
                                            <Select name="priority" defaultValue={initialPriority}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar prioridad" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Baja</SelectItem>
                                                    <SelectItem value="medium">Media</SelectItem>
                                                    <SelectItem value="high">Alta</SelectItem>
                                                    <SelectItem value="critical">Crítica</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="description" className="text-sm font-medium">Descripción</label>
                                            <textarea
                                                name="description"
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Descripción detallada..."
                                                defaultValue={initialDescription}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={isEditing}>
                                            {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Eliminar Incidencia</p>
                                </TooltipContent>
                            </Tooltip>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Eliminar Incidencia</DialogTitle>
                                    <DialogDescription>
                                        ¿Estás seguro de que quieres eliminar esta incidencia? Esta acción no se puede deshacer.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-4 py-4">
                                    <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-orange-500 hover:bg-orange-600 text-white border-none"
                                    >
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}
