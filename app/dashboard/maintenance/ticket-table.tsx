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
import { TicketRowActions } from "@/components/dashboard/maintenance/ticket-row-actions";

interface Ticket {
    id: string;
    title: string;
    unit_name: string | null;
    priority: "low" | "normal" | "high" | "critical";
    status: "open" | "in_progress" | "resolved" | "closed";
    assigned_to: string | null;
    assigned_to_name: string | null;
    reported_by_name: string | null;
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
                    <SortableHead column="id" label="ID" />
                    <SortableHead column="title" label="Incidencia" />
                    <SortableHead column="unit_name" label="Unidad" />
                    <SortableHead column="priority" label="Prioridad" />
                    <SortableHead column="reported_by_name" label="Reportado Por" />
                    <SortableHead column="assigned_to_name" label="Asignado a" />
                    <SortableHead column="created_at" label="Fecha" />
                    <SortableHead column="status" label="Estado" />
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                            <Link href={`/dashboard/maintenance/${ticket.id}`} className="hover:underline block w-full h-full">
                                {ticket.id.substring(0, 8)}
                            </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/maintenance/${ticket.id}`} className="hover:underline block w-full h-full">
                                {ticket.title}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Link href={`/dashboard/maintenance/${ticket.id}`} className="hover:underline block w-full h-full">
                                {ticket.unit_name || "General"}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Badge variant={ticket.priority === "critical" ? "destructive" : ticket.priority === "high" ? "destructive" : ticket.priority === "low" ? "outline" : "secondary"}>
                                {ticket.priority === "critical" ? "CRÍTICA" : ticket.priority === "high" ? "ALTA" : ticket.priority === "low" ? "BAJA" : "MEDIA"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <span className="text-sm font-medium">{ticket.reported_by_name || "Sistema"}</span>
                        </TableCell>
                        <TableCell>
                            <Link href={`/dashboard/maintenance/${ticket.id}`} className="hover:underline block w-full h-full">
                                {ticket.assigned_to_name ? (
                                    <span className="text-sm font-medium">{ticket.assigned_to_name}</span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Sin Asignar</span>
                                )}
                            </Link>
                        </TableCell>
                        <TableCell>
                            {format(new Date(ticket.created_at), "d MMM", { locale: es })}
                        </TableCell>
                        <TableCell>
                            <Badge variant={ticket.status === 'in_progress' ? "default" : ticket.status === 'resolved' ? "secondary" : "outline"} className={ticket.status === 'in_progress' ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}>
                                {ticket.status === 'in_progress' ? 'En Curso' : ticket.status === 'open' ? 'Pendiente' : ticket.status === 'resolved' ? 'Completada' : 'Cerrada'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <TicketRowActions ticket={ticket} staffMembers={staff} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
