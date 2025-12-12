import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

export default async function GuestBookingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get Guest ID
    const { data: guest } = await supabase.from("guests").select("id").eq("user_id", user.id).single();
    if (!guest) return <div>No se encontró el perfil de huésped.</div>;

    // Fetch All Bookings
    const { data: bookings } = await supabase
        .from("bookings")
        .select("*, units(name, type)")
        .eq("guest_id", guest.id)
        .order("check_in_date", { ascending: false });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Mis Reservas</h2>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Alojamiento</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings?.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">
                                    {(booking.units as any)?.name}
                                    <span className="block text-xs text-muted-foreground font-normal">{(booking.units as any)?.type}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <span className="block">{format(new Date(booking.check_in_date), "d MMM yyyy", { locale: es })}</span>
                                        <span className="text-muted-foreground text-xs">hasta </span>
                                        <span>{format(new Date(booking.check_out_date), "d MMM yyyy", { locale: es })}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={booking.status === 'confirmed' || booking.status === 'checked_in' ? 'default' : 'secondary'}>
                                        {booking.status === 'checked_in' ? 'Activa' : (booking.status === 'confirmed' ? 'Confirmada' : booking.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    €{booking.total_amount}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" asChild>
                                        <Link href={`/guest/bookings/${booking.id}`}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {bookings?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No tienes reservas registradas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
