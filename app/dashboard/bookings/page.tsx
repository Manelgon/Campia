import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
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
import { BookingActions } from "@/components/dashboard/booking-actions";

export default async function BookingsPage() {
    const supabase = await createClient();
    const { data: bookings } = await supabase
        .from("bookings")
        .select(`
      *,
      units (name),
      guests (full_name)
    `)
        .order("check_in_date", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Reservas</h2>
                <Button asChild>
                    <Link href="/dashboard/bookings/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Reserva
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Huésped</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Entrada</TableHead>
                                <TableHead>Salida</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Pax</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings?.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/bookings/${booking.id}`} className="hover:underline text-blue-600">
                                            {booking.guests?.full_name || "Desconocido"}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{booking.units?.name || "Sin Asignar"}</TableCell>
                                    <TableCell>
                                        {format(new Date(booking.check_in_date), "dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(booking.check_out_date), "dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${booking.status === "confirmed"
                                                ? "bg-green-100 text-green-800"
                                                : booking.status === "checked_in"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : booking.status === "checked_out"
                                                        ? "bg-gray-100 text-gray-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {booking.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{booking.guests_count}</TableCell>
                                    <TableCell className="text-right">
                                        <BookingActions bookingId={booking.id} status={booking.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {bookings?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No hay reservas registradas.
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
