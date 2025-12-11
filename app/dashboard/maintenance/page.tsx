import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { TicketActions } from "@/components/dashboard/ticket-actions";

export default async function MaintenancePage() {
    const supabase = await createClient();
    const { data: tickets } = await supabase
        .from("tickets")
        .select(`
      *,
      units (name),
      profiles!tickets_reported_by_fkey (full_name) 
    `) // using explicit join if needed, or just let supabase infer if names match
        // actually schema: reported_by references profiles(id)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Mantenimiento e Incidencias</h2>
                <Button asChild>
                    <Link href="/dashboard/maintenance/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Incidencias</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Reportado Por</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets?.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium">{ticket.title}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ticket.priority === 'high' || ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </TableCell>
                                    <TableCell>{ticket.units?.name || "-"}</TableCell>
                                    <TableCell>{ticket.profiles?.full_name || "Sistema"}</TableCell>
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
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No hay incidencias activas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
