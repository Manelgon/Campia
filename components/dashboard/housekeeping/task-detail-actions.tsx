"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    Edit,
    UserPlus,
    PlayCircle,
    Loader2,
    Square,
    CheckCircle,
    PauseCircle
} from "lucide-react";
import {
    deleteTaskAction,
    updateTaskStatusAction,
    assignTaskAction,
    completeTaskAction,
    updateTaskDetailsAction
} from "@/app/dashboard/housekeeping/actions";
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailActionsProps {
    taskId: string;
    unitId?: string;
    currentStatus: string;
    currentAssigneeId?: string | null;
    userRole: string;
    staffMembers: any[];
}

export function TaskDetailActions({
    taskId,
    unitId,
    currentStatus,
    currentAssigneeId,
    userRole,
    staffMembers
}: TaskDetailActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState(currentAssigneeId || "");
    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);

    const router = useRouter();

    const isAdmin = userRole === "admin" || userRole === "superadmin";
    // Cleaning staff and maintenance/admins can usually update status
    const canUpdateStatus = true;
    const canManage = isAdmin; // Only admins can delete/reassign in strict mode, but we'll follow maintenance pattern

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteTaskAction(taskId);
            if (res?.error) {
                toast.error(res.error);
                setIsDeleting(false);
            } else {
                toast.success("Tarea eliminada");
                router.push("/dashboard/housekeeping");
            }
        } catch (e) {
            toast.error("Error al eliminar");
            setIsDeleting(false);
        }
    };

    const handleStatusApp = async (newStatus: 'in_progress' | 'open') => {
        setIsUpdating(true);
        try {
            await updateTaskStatusAction(taskId, newStatus);
            toast.success(newStatus === 'in_progress' ? "Tarea iniciada" : "Tarea pausada");
            router.refresh();
        } catch (e) {
            toast.error("Error al actualizar estado");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleComplete = async () => {
        if (!unitId) {
            toast.error("Falta ID de unidad para completar");
            return;
        }
        setIsUpdating(true);
        try {
            const res = await completeTaskAction(taskId, unitId);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Tarea completada");
                router.refresh();
            }
        } catch (e) {
            toast.error("Error al completar");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAssign = async () => {
        setIsAssigning(true);
        try {
            const formData = new FormData();
            formData.append("taskId", taskId);
            formData.append("userId", selectedAssignee);

            const res = await assignTaskAction(formData);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Asignación actualizada");
                setOpenAssignDialog(false);
                router.refresh();
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
                {canUpdateStatus && currentStatus !== 'resolved' && (
                    <>


                        {/* Start / Finish Button */}
                        {currentStatus === 'open' ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => handleStatusApp('in_progress')}
                                        disabled={isUpdating}
                                        size="icon"
                                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                                    >
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Empezar Tarea</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : currentStatus === 'in_progress' ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={handleComplete}
                                        disabled={isUpdating}
                                        size="icon"
                                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                                    >
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-5 w-5 fill-current" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Finalizar Tarea</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </>
                )}

                {(canManage || true) && currentStatus === 'open' && ( // Allow assignment for now to verify UI but restricted to open
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
                                    <DialogTitle>Asignar Tarea</DialogTitle>
                                    <DialogDescription>
                                        Selecciona un miembro del personal para esta tarea.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCombobox}
                                                className="w-full justify-between"
                                            >
                                                {selectedAssignee
                                                    ? staffMembers.find((s) => s.id === selectedAssignee)?.full_name || "Usuario desconocido"
                                                    : "Seleccionar responsable..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar por nombre..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="unassigned"
                                                            onSelect={() => {
                                                                setSelectedAssignee("");
                                                                setOpenCombobox(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedAssignee === "" ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            Sin Asignar
                                                        </CommandItem>
                                                        {staffMembers.map((s) => (
                                                            <CommandItem
                                                                key={s.id}
                                                                value={s.full_name || "Unknown"}
                                                                onSelect={() => {
                                                                    setSelectedAssignee(s.id);
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedAssignee === s.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {s.full_name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpenAssignDialog(false)}>Cancelar</Button>
                                    <Button onClick={handleAssign} disabled={isAssigning}>
                                        {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
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
                                    <p>Editar Tarea</p>
                                </TooltipContent>
                            </Tooltip>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Editar Tarea</DialogTitle>
                                    <DialogDescription>
                                        Modifica los detalles de la tarea.
                                    </DialogDescription>
                                </DialogHeader>
                                <form action={async (formData) => {
                                    setIsEditing(true);
                                    await updateTaskDetailsAction(formData);
                                    setIsEditing(false);
                                    setOpenEditDialog(false);
                                    toast.success("Tarea actualizada");
                                }}>
                                    <input type="hidden" name="taskId" value={taskId} />
                                    <div className="grid gap-4 py-4">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="priority" className="text-sm font-medium">Prioridad</label>
                                            <Select name="priority" defaultValue="medium">
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
                                            <label htmlFor="notes" className="text-sm font-medium">Notas</label>
                                            <textarea
                                                name="notes"
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Notas adicionales..."
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
                                    <p>Eliminar Tarea</p>
                                </TooltipContent>
                            </Tooltip>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Eliminar Tarea</DialogTitle>
                                    <DialogDescription>
                                        ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
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
