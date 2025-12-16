import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { es } from "date-fns/locale";

export default async function GuestTicketsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Get Guest Profile
    const { data: guest } = await supabase
        .from("guests")
        .select("id, property_id")
        .eq("user_id", user.id)
        .single();

    if (!guest) return <div>Error: Huésped no encontrado.</div>;

    // Fetch Tickets reported by this guest (using created_by or verifying custom logic)
    // Wait, 'tickets' table has 'reported_by' which is a profile ID (user ID).
    // So we query tickets where reported_by = user.id

    const { data: tickets } = await supabase
        .from("tickets")
        .select("*, units(name)")
        .eq("reported_by", user.id) // Assuming tickets are linked to auth.users.id via profiles
        .order("created_at", { ascending: false });

    // Check if guest has active check-in to enable "New Ticket" button
    const { data: activeBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("guest_id", guest.id)
        .eq("status", "checked_in")
        .single();

    const canCreateTicket = !!activeBooking;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open":
                return <Badge variant="destructive" className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" /> Abierta</Badge>;
            case "in_progress":
                return <Badge variant="secondary" className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" /> En Proceso</Badge>;
            case "resolved":
            case "closed":
                return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Resuelta</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Incidencias</h2>
                    <p className="text-muted-foreground">Reporta problemas en tu alojamiento.</p>
                </div>
                {canCreateTicket ? (
                    <Link href="/guest/tickets/new">
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nueva Incidencia
                        </Button>
                    </Link>
                ) : (
                    <Button disabled variant="secondary" title="Solo disponible durante tu estancia (Check-in activo)">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Incidencia
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Incidencias</CardTitle>
                </CardHeader>
                <CardContent>
                    {!tickets || tickets.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No has reportado ninguna incidencia.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Unidad</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.title}</TableCell>
                                        <TableCell>{ticket.units?.name || "-"}</TableCell>
                                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {format(new Date(ticket.created_at), "dd MMM yyyy", { locale: es })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
