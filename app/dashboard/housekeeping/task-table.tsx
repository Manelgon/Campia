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
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TaskRowActions } from "@/components/dashboard/housekeeping/task-row-actions";

interface HousekeepingTask {
    id: string;
    unit_name: string | null;
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "in_progress" | "resolved";
    assigned_to: string | null;
    assigned_to_name: string | null;
    notes?: string;
    created_at: string;
    unit_id?: string;
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
                    <SortableHead column="id" label="ID" />
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
                        <TableCell className="font-medium text-xs text-muted-foreground w-[100px]">
                            {task.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium hover:underline cursor-pointer">
                            <Link href={`/dashboard/housekeeping/${task.id}`} className="block w-full h-full">
                                {task.unit_name || "Sin Asignar"}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Badge variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "destructive" : task.priority === "low" ? "outline" : "secondary"}>
                                {task.priority === "critical" ? "CRÍTICA" : task.priority === "high" ? "ALTA" : task.priority === "low" ? "BAJA" : "MEDIA"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {task.assigned_to_name ? (
                                <span className="text-sm font-medium">{task.assigned_to_name}</span>
                            ) : (
                                <span className="text-sm text-muted-foreground">Sin Asignar</span>
                            )}
                        </TableCell>
                        <TableCell>
                            {format(new Date(task.created_at), "d MMM, HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                            <Badge variant={task.status === 'in_progress' ? "default" : task.status === 'resolved' ? "secondary" : "outline"} className={task.status === 'in_progress' ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}>
                                {task.status === 'in_progress' ? 'En Curso' : task.status === 'open' ? 'Pendiente' : 'Completada'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <TaskRowActions task={task} staffMembers={staff} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

