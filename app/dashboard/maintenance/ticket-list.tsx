"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { TicketActions } from "@/components/dashboard/ticket-actions";
import { CheckCircle, Clock, AlertCircle, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assignTicketAction } from "./actions";

type Ticket = {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    created_at: string;
    units: { name: string } | null;
    profiles: { full_name: string } | null; // Reported by
    assigned_to: string | null;
    assigned_profile?: { full_name: string } | null;
};

export function TicketList({ tickets, staffMembers }: { tickets: Ticket[], staffMembers: any[] }) {

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Reportado Por</TableHead>
                    <TableHead>Asignado A</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets?.map((ticket) => (
                    <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                            <div>{ticket.title}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{ticket.description}</div>
                        </TableCell>
                        <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ticket.priority === 'high' || ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {ticket.priority === 'low' ? 'BAJA' : ticket.priority === 'high' ? 'ALTA' : ticket.priority === 'critical' ? 'CRITICA' : 'MEDIA'}
                            </span>
                        </TableCell>
                        <TableCell>{ticket.units?.name || "-"}</TableCell>
                        <TableCell>{ticket.profiles?.full_name || "Sistema"}</TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 max-w-[180px]">
                                {ticket.status !== 'resolved' ? (
                                    <form action={async (formData) => {
                                        await assignTicketAction(formData);
                                    }} className="flex gap-2 items-center">
                                        <input type="hidden" name="taskId" value={ticket.id} />
                                        <select
                                            name="userId"
                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors"
                                            defaultValue={ticket.assigned_to || ""}
                                        >
                                            <option value="">Sin asignar</option>
                                            {staffMembers?.map(staff => (
                                                <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                                            ))}
                                        </select>
                                        <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
                                            <CheckCircle className="h-3 w-3" />
                                        </Button>
                                    </form>
                                ) : (
                                    <span className="text-sm">{ticket.assigned_profile?.full_name || "Sin asignar"}</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>{format(new Date(ticket.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                {ticket.status === 'resolved' ? <CheckCircle className="h-4 w-4 text-green-500" /> :
                                    ticket.status === 'in_progress' ? <Clock className="h-4 w-4 text-blue-500" /> :
                                        <AlertCircle className="h-4 w-4 text-gray-500" />}
                                <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <TicketActions ticketId={ticket.id} status={ticket.status} />
                        </TableCell>
                    </TableRow>
                ))}
                {tickets?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24">
                            No hay incidencias activas.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
