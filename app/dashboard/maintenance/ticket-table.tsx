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
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { updateTicketStatusAction, assignTicketAction } from "./actions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link"; // If needed for detailed view

interface Ticket {
    id: string;
    title: string;
    unit_name: string | null;
    priority: "low" | "normal" | "high" | "critical";
    status: "open" | "in_progress" | "resolved" | "closed";
    assigned_to: string | null;
    assigned_to_name: string | null;
    created_at: string;
}

export function TicketTable({ tickets, staff }: { tickets: Ticket[], staff: any[] }) {
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

    const handleAssign = async (ticketId: string, userId: string) => {
        const formData = new FormData();
        formData.append("taskId", ticketId); // reuse logic from tasks or distinct action? assignTicketAction uses 'taskId' param name in my previous check.
        formData.append("userId", userId);

        try {
            const res = await assignTicketAction(formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Asignación actualizada");
            }
        } catch (e) {
            toast.error("Error de conexión");
        }
    };

    if (tickets.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay incidencias registradas.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <SortableHead column="title" label="Incidencia" />
                    <SortableHead column="unit_name" label="Unidad" />
                    <SortableHead column="priority" label="Prioridad" />
                    <SortableHead column="assigned_to_name" label="Asignado a" />
                    <SortableHead column="created_at" label="Fecha" />
                    <SortableHead column="status" label="Estado" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>{ticket.unit_name || "General"}</TableCell>
                        <TableCell>
                            <Badge variant={ticket.priority === "critical" ? "destructive" : ticket.priority === "high" ? "destructive" : ticket.priority === "low" ? "outline" : "secondary"}>
                                {ticket.priority === "critical" ? "CRÍTICA" : ticket.priority === "high" ? "ALTA" : ticket.priority === "low" ? "BAJA" : "NORMAL"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <select
                                className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer hover:underline"
                                value={ticket.assigned_to || ""}
                                onChange={(e) => handleAssign(ticket.id, e.target.value)}
                            >
                                <option value="">Sin Asignar</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name}</option>
                                ))}
                            </select>
                        </TableCell>
                        <TableCell>
                            {format(new Date(ticket.created_at), "d MMM", { locale: es })}
                        </TableCell>
                        <TableCell>
                            <span className="capitalize text-sm">{ticket.status}</span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
