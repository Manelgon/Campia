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
import { EnableAccessButton } from "@/components/dashboard/guests/enable-access-button";

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: guest } = await supabase
        .from("guests")
        .select("*")
        .eq("id", id)
        .single();

    if (!guest) {
        notFound();
    }

    // Fetch bookings for this guest
    const { data: bookings } = await supabase
        .from("bookings")
        .select(`
        *,
        units (name)
    `)
        .eq("guest_id", id)
        .order("check_in_date", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Detalles del Huésped</h2>
                <div className="flex items-center gap-2">
                    <EnableAccessButton guest={guest} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-semibold">Nombre:</span> {guest.full_name}
                        </div>
                        <div>
                            <span className="font-semibold">Email:</span> {guest.email || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Teléfono:</span> {guest.phone || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Documento:</span> {guest.document_id || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Nacionalidad:</span> {guest.nationality || "-"}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estadísticas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">Total Reservas</span>
                            <span className="text-2xl font-bold">{bookings?.length || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Entrada</TableHead>
                                <TableHead>Salida</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Pax</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings?.map((booking: any) => (
                                <TableRow key={booking.id}>
                                    <TableCell>{booking.units?.name}</TableCell>
                                    <TableCell>{format(new Date(booking.check_in_date), "dd/MM/yyyy")}</TableCell>
                                    <TableCell>{format(new Date(booking.check_out_date), "dd/MM/yyyy")}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize 
                                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{booking.guests_count}</TableCell>
                                </TableRow>
                            ))}
                            {bookings?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Sin historial de reservas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
