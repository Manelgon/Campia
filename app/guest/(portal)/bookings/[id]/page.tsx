import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, CreditCard, Building2 } from "lucide-react";
import Link from "next/link";

export default async function GuestBookingDetailsPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Verify ownership
    const { data: guest } = await supabase.from("guests").select("id").eq("user_id", user.id).single();
    if (!guest) return <div>No autorizado</div>;

    const { data: booking } = await supabase
        .from("bookings")
        .select("*, units(name, type, location)")
        .eq("id", params.id)
        .eq("guest_id", guest.id)
        .single();

    if (!booking) {
        notFound();
    }

    // Attempt to fetch breakdown if table exists (assuming based on previous context)
    // Or just show total.

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/guest/bookings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Detalles de Reserva</h1>
                    <p className="text-muted-foreground text-sm">Referencia: #{booking.id.slice(0, 8)}</p>
                </div>
                <div className="ml-auto">
                    <Badge className="text-base px-4 py-1" variant={booking.status === 'checked_in' ? 'default' : 'secondary'}>
                        {booking.status === 'checked_in' ? 'Estancia Activa' : (booking.status === 'confirmed' ? 'Confirmada' : booking.status)}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-orange-600" />
                            Alojamiento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-xl font-medium">{(booking.units as any)?.name}</p>
                            <p className="text-muted-foreground">{(booking.units as any)?.type}</p>
                        </div>
                        {(booking.units as any)?.location && (
                            <div className="pt-2 border-t text-sm">
                                <span className="font-medium">Ubicación:</span> {(booking.units as any).location}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-orange-600" />
                            Fechas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground block">Check-in</span>
                                <span className="font-medium text-lg">
                                    {format(new Date(booking.check_in_date), "d MMM yyyy", { locale: es })}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">Check-out</span>
                                <span className="font-medium text-lg">
                                    {format(new Date(booking.check_out_date), "d MMM yyyy", { locale: es })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                            Pago
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-lg font-medium">
                            <span>Total Reserva</span>
                            <span>€{booking.total_amount}</span>
                        </div>
                        {/* We could add payment status if available */}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-orange-600" />
                            Ocupación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-sm text-muted-foreground block">Huéspedes incluidos</span>
                            <span className="font-medium text-lg">{booking.guests_count} Personas</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center text-sm text-muted-foreground pt-8">
                <p>Si necesitas modificar o cancelar esta reserva, por favor contacta con recepción.</p>
            </div>
        </div>
    );
}
