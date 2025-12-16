"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    PlayCircle,
    Square,
    UserPlus,
    Trash2,
    Loader2,
    CheckCircle,
    Edit
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    deleteTaskAction,
    updateTaskStatusAction,
    assignTaskAction,
    completeTaskAction,
    updateTaskDetailsAction
} from "@/app/dashboard/housekeeping/actions";
import { toast } from "sonner";
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

interface TaskRowActionsProps {
    task: {
        id: string;
        status: string;
        assigned_to: string | null;
        unit_id?: string;
        priority?: string;
        notes?: string;
    };
    staffMembers: any[];
}

export function TaskRowActions({ task, staffMembers }: TaskRowActionsProps) {
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState(task.assigned_to || "");
    const [openCombobox, setOpenCombobox] = useState(false);

    const handleStatusChange = async (newStatus: 'in_progress' | 'open') => {
        try {
            await updateTaskStatusAction(task.id, newStatus);
            toast.success(newStatus === 'in_progress' ? "Tarea en curso" : "Tarea pausada");
        } catch (e) {
            toast.error("Error al actualizar estado");
        }
    };

    const handleComplete = async () => {
        // Warning: completeTaskAction needs unitId. 
        // We must ensure task object has it or we can't update unit status.
        // If task.unit_id is missing, this might fail or we need to fetch it server side.
        // Assuming task passed here comes from the View which has unit_id (even if interface says optional)
        if (!task.unit_id) {
            toast.error("No se puede completar: falta ID de unidad");
            return;
        }

        try {
            const res = await completeTaskAction(task.id, task.unit_id);
            if (res.error) toast.error(res.error);
            else toast.success("Tarea completada");
        } catch (e) {
            toast.error("Error al completar");
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteTaskAction(task.id);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Tarea eliminada");
                setIsDeleteDialogOpen(false);
            }
        } catch (e) {
            toast.error("Error al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAssign = async () => {
        setIsAssigning(true);
        try {
            const formData = new FormData();
            formData.append("taskId", task.id);
            formData.append("userId", selectedAssignee);

            const res = await assignTaskAction(formData);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Asignación actualizada");
                setIsAssignDialogOpen(false);
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Edit Action (Only if Open) */}
                    {(task.status === 'open') && (
                        <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                    )}

                    {/* Start / Stop Logic */}
                    {(task.status === 'open') && (
                        <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                            <PlayCircle className="mr-2 h-4 w-4 text-orange-500" />
                            Empezar
                        </DropdownMenuItem>
                    )}
                    {(task.status === 'in_progress') && (
                        <DropdownMenuItem onClick={handleComplete}>
                            <Square className="mr-2 h-4 w-4 text-orange-500 fill-orange-500" />
                            Finalizar
                        </DropdownMenuItem>
                    )}

                    {/* Assign Action */}
                    <DropdownMenuItem onClick={() => setIsAssignDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Asignar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Assign Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar Tarea</DialogTitle>
                        <DialogDescription>
                            Busca y selecciona el responsable para esta tarea de limpieza.
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
                                                    value={(s.full_name || "Unknown") + "-" + s.id}
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
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAssign} disabled={isAssigning}>
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Tarea</DialogTitle>
                        <DialogDescription>
                            Modifica prioridad y notas.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        setIsEditing(true);
                        await updateTaskDetailsAction(formData);
                        setIsEditing(false);
                        setIsEditDialogOpen(false);
                        toast.success("Tarea actualizada");
                    }}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="priority" className="text-sm font-medium">Prioridad</label>
                                <Select name="priority" defaultValue={task.priority || "medium"}>
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
                                    placeholder="Notas sobre la tarea..."
                                    defaultValue={task.notes || ""}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isEditing}>
                                {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Tarea</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 py-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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
    );
}
