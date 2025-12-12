import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function GuestHomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch Guest Profile
    const { data: guest } = await supabase
        .from("guests")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!guest) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-semibold">Perfil no encontrado</h2>
                <p>No se ha encontrado una ficha de huésped asociada a tu usuario.</p>
            </div>
        );
    }

    // Fetch *Active* Booking (Check-in <= Today <= Check-out)
    const today = new Date().toISOString().split('T')[0];
    const { data: activeBooking } = await supabase
        .from("bookings") // Using raw bookings table, could use view if exposed
        .select("*, units(name, type, location)")
        .eq("guest_id", guest.id)
        .lte("check_in_date", today)
        .gte("check_out_date", today)
        .maybeSingle();

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Ficha del Huésped</h2>
                <p className="text-muted-foreground">Tu información personal registrada.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Datos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Nombre Completo</span>
                            <span className="font-medium text-lg">{guest.full_name}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Documento ID</span>
                            <span className="font-medium text-lg">{guest.document_id}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Email</span>
                            <span className="font-medium">{guest.email}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Teléfono</span>
                            <span className="font-medium">{guest.phone || "-"}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Nacionalidad</span>
                            <span className="font-medium">{guest.nationality || "-"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
