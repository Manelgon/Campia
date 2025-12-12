"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Play, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { completeTaskAction, assignTaskAction } from "./actions";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface HousekeepingTask {
    id: string;
    unit_name: string | null;
    priority: "low" | "normal" | "high";
    status: "pending" | "in_progress" | "completed";
    assigned_to: string | null;
    assigned_to_name: string | null;
    notes: string | null;
    created_at: string;
}

export function TaskTable({ tasks, staff }: { tasks: HousekeepingTask[], staff: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "created_at";
    const currentOrder = searchParams.get("order") || "desc";

    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams);
        if (currentSort === column) {
            params.set("order", currentOrder === "asc" ? "desc" : "asc");
        } else {
            params.set("sort", column);
            params.set("order", "asc");
        }
        router.replace(`?${params.toString()}`);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (currentSort !== column) return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground opacity-50" />;
        return currentOrder === "asc" ? <ArrowUp className="ml-2 h-3 w-3 text-foreground" /> : <ArrowDown className="ml-2 h-3 w-3 text-foreground" />;
    };

    const SortableHead = ({ column, label, className }: { column: string, label: string, className?: string }) => (
        <TableHead className={className}>
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => handleSort(column)}
            >
                {label}
                <SortIcon column={column} />
            </Button>
        </TableHead>
    );

    const handleComplete = async (taskId: string, unitId: string) => { // unitId might be needed if action requires it, but view might not return it directly unless selected. 
        // Actually completeTaskAction needs unitId to update Unit status.
        // My view `view_housekeeping_details` selects `ht.*`, so `unit_id` is present.
        // But I need to pass unit_id from the row.
        try {
            const res = await completeTaskAction(taskId, unitId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Tarea completada");
            }
        } catch (e) {
            toast.error("Error al completar la tarea");
        }
    };

    const handleAssign = async (taskId: string, userId: string) => {
        const formData = new FormData();
        formData.append("taskId", taskId);
        formData.append("userId", userId);

        try {
            const res = await assignTaskAction(formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Asignación actualizada");
            }
        } catch (e) {
            toast.error("Error de conexión");
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay tareas de limpieza pendientes.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <SortableHead column="unit_name" label="Unidad" />
                    <SortableHead column="priority" label="Prioridad" />
                    <SortableHead column="assigned_to_name" label="Asignado a" />
                    <SortableHead column="created_at" label="Fecha" />
                    <SortableHead column="status" label="Estado" />
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map((task) => (
                    <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.unit_name || "Sin Asignar"}</TableCell>
                        <TableCell>
                            <Badge variant={task.priority === "high" ? "destructive" : task.priority === "low" ? "outline" : "secondary"}>
                                {task.priority === "high" ? "ALTA" : task.priority === "low" ? "BAJA" : "NORMAL"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <select
                                className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer hover:underline"
                                value={task.assigned_to || ""}
                                onChange={(e) => handleAssign(task.id, e.target.value)}
                            >
                                <option value="">Sin Asignar</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name}</option>
                                ))}
                            </select>
                        </TableCell>
                        <TableCell>
                            {format(new Date(task.created_at), "d MMM, HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                            <span className="capitalize text-sm">{task.status === 'in_progress' ? 'En Curso' : task.status === 'pending' ? 'Pendiente' : 'Completada'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleComplete(task.id, (task as any).unit_id)}>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                {/* Report Issue button could be here too */}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

