import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Building, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { TicketDetailActions } from "@/components/dashboard/maintenance/ticket-detail-actions";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: ticket, error } = await supabase
        .from("tickets")
        .select(`
            *,
            unit:units(name, type),
            reporter:profiles!tickets_reported_by_fkey(full_name, email, role),
            assignee:profiles!tickets_assigned_to_fkey(full_name, email)
        `)
        .eq("id", id)
        .single();

    if (error || !ticket) {
        console.error("Error fetching ticket:", error);
        return notFound();
    }

    // Try to fetch booking info if reporter is a guest
    let bookingInfo = null;
    if (ticket.reporter?.role === 'guest' && ticket.reported_by && ticket.unit_id) {
        // Find guest record linking to this auth user
        const { data: guest } = await supabase
            .from('guests')
            .select('id, full_name')
            .eq('user_id', ticket.reported_by)
            .single();

        if (guest) {
            // Find active or recent booking for this guest and unit
            // We prioritize checked_in, then confirmed, then checked_out
            const { data: bookings } = await supabase
                .from('bookings')
                .select('id')
                .eq('guest_id', guest.id)
                .eq('unit_id', ticket.unit_id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (bookings && bookings.length > 0) {
                bookingInfo = {
                    id: bookings[0].id,
                    guest_name: guest.full_name
                };
            } else {
                // Fallback if no booking found but is guest
                bookingInfo = {
                    id: "No Reserva",
                    guest_name: guest.full_name
                };
            }
        }
    }

    const priorityColors = {
        low: "bg-blue-100 text-blue-800",
        medium: "bg-gray-100 text-gray-800", // Standardize to medium
        normal: "bg-gray-100 text-gray-800", // Support legacy
        high: "bg-orange-100 text-orange-800",
        critical: "bg-red-100 text-red-800",
    };

    const statusColors = {
        open: "bg-yellow-100 text-yellow-800",
        in_progress: "bg-blue-100 text-blue-800",
        resolved: "bg-green-100 text-green-800",
        closed: "bg-gray-100 text-gray-800",
    };

    const { data: { user } } = await supabase.auth.getUser();

    // Get Current User Role
    let userRole = "guest";
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) userRole = profile.role;
    }

    // Fetch staff for assignment dropdown
    const { data: staff } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .neq("role", "guest");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/maintenance">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Detalle de Incidencia</h1>
                        <p className="text-muted-foreground text-sm">ID: {ticket.id}</p>
                    </div>
                </div>

                <TicketDetailActions
                    ticketId={ticket.id}
                    currentStatus={ticket.status}
                    currentAssigneeId={ticket.assigned_to}
                    userRole={userRole}
                    staffMembers={staff || []}
                    initialTitle={ticket.title}
                    initialDescription={ticket.description || ""}
                    initialPriority={ticket.priority}
                />
            </div>

            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles de la Incidencia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm"> {/* Updated to col-5 to prevent wrapping if desired, OR keep 4. Housekeeping is 4. I will TRY 5 to see if it fixes "space" issue by making it 1 row. */}
                            {/* Wait, user said "same as Tasks". Tasks is 4. */}
                            {/* If Tasks wraps, Maintenance should wrap. */}
                            {/* But maybe checking "medium" color fix first. */}
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Unidad:</span>
                                <span className="font-medium">{ticket.unit?.name || "General"} ({ticket.unit?.type || "Area Común"})</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Prioridad:</span>
                                <div>
                                    <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors] || priorityColors.medium}>
                                        {ticket.priority === "critical" ? "CRÍTICA" : ticket.priority === "high" ? "ALTA" : ticket.priority === "low" ? "BAJA" : "MEDIA"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Estado:</span>
                                <div>
                                    <Badge className={statusColors[ticket.status as keyof typeof statusColors] || "bg-gray-100"}>
                                        {ticket.status === 'in_progress' ? 'EN CURSO' : ticket.status === 'open' ? 'PENDIENTE' : ticket.status === 'resolved' ? 'COMPLETADA' : 'CERRADA'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Reportado por:</span>
                                <div className="flex flex-col">
                                    {ticket.reporter?.role === 'guest' ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{bookingInfo?.guest_name || ticket.reporter.full_name}</span>
                                                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">GUEST</Badge>
                                            </div>
                                            {bookingInfo?.id && <span className="text-xs text-muted-foreground">Reserva: {bookingInfo.id.slice(0, 8)}</span>}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{ticket.reporter?.full_name || "Sistema"}</span>
                                                {ticket.reporter?.role && <Badge variant="secondary" className="text-[10px] h-5 px-1">{ticket.reporter.role}</Badge>}
                                            </div>
                                            {ticket.reporter?.email && <span className="text-xs text-muted-foreground">{ticket.reporter.email}</span>}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Asignado a:</span>
                                <span className="font-medium">{ticket.assignee?.full_name || "Sin asignar"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Row 2: Title, Description, Photos */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">{ticket.title}</CardTitle>
                                <CardDescription className="mt-1">
                                    Creado el {format(new Date(ticket.created_at), "PPP 'a las' p", { locale: es })}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Descripción</h3>
                            <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                                {ticket.description || "Sin descripción detallada."}
                            </div>
                        </div>

                        {ticket.photos && ticket.photos.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Imágenes Adjuntas</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {ticket.photos.map((photo: string, index: number) => (
                                        <div key={index} className="aspect-square relative rounded-md overflow-hidden border group">
                                            <img
                                                src={photo}
                                                alt={`Evidencia ${index + 1}`}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card >
            </div >
        </div >
    );
}
