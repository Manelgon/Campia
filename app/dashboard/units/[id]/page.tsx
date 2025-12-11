import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UnitActions } from "@/components/dashboard/unit-actions";

export default async function UnitPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: unit } = await supabase
        .from("units")
        .select("*")
        .eq("id", id)
        .single();

    if (!unit) {
        notFound();
    }

    // Fetch active/future bookings
    const { data: bookings } = await supabase
        .from("bookings")
        .select(`
        *,
        guests (full_name)
    `)
        .eq("unit_id", id)
        .gte('check_out_date', new Date().toISOString()) // Only future/current
        .order("check_in_date", { ascending: true })
        .limit(5);

    // Fetch recent tickets
    const { data: tickets } = await supabase
        .from("tickets")
        .select("*")
        .eq("unit_id", id)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Detalles de la Unidad: {unit.name}</h2>
                <UnitActions unitId={unit.id} status={unit.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Información</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-semibold">Nombre:</span> {unit.name}
                        </div>
                        <div>
                            <span className="font-semibold">Tipo:</span> <span className="capitalize">{unit.type || "-"}</span>
                        </div>
                        <div>
                            <span className="font-semibold">Capacidad:</span> {unit.capacity} personas
                        </div>
                        <div>
                            <span className="font-semibold">Estado:</span>
                            <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${unit.status === "clean"
                                ? "bg-green-100 text-green-800"
                                : unit.status === "occupied"
                                    ? "bg-blue-100 text-blue-800"
                                    : unit.status === "dirty"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}>
                                {unit.status}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Próximas Reservas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bookings && bookings.length > 0 ? (
                            <ul className="space-y-2">
                                {bookings.map(booking => (
                                    <li key={booking.id} className="text-sm flex justify-between border-b pb-2">
                                        <span>{booking.guests?.full_name}</span>
                                        <span className="text-muted-foreground">{format(new Date(booking.check_in_date), "dd/MM")} - {format(new Date(booking.check_out_date), "dd/MM")}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay reservas próximas.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Asunto</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets?.map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell>{ticket.title}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ticket.priority === 'high' || ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </TableCell>
                                    <TableCell><span className="capitalize">{ticket.status.replace('_', ' ')}</span></TableCell>
                                    <TableCell>{format(new Date(ticket.created_at), "dd/MM/yyyy")}</TableCell>
                                </TableRow>
                            ))}
                            {tickets?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No hay incidencias reportadas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
