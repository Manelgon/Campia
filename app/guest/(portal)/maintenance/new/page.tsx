import { createClient } from "@/utils/supabase/server";
import { GuestTicketForm } from "./ticket-form";

export default async function NewGuestTicketPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get Guest ID
    const { data: guest } = await supabase.from("guests").select("id").eq("user_id", user.id).single();
    if (!guest) return <div>No guest profile found.</div>;

    // Fetch Active Bookings to get Units
    // We allow reporting on any unit they are currently booked in or recently booked? 
    // Let's stick to CURRENT stay for now.
    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
        .from("bookings")
        .select("unit_id, units(name, type)")
        .eq("guest_id", guest.id)
        .lte("check_in_date", today)
        .gte("check_out_date", today);

    const units = bookings?.map(b => ({
        unit_id: b.unit_id,
        unit_name: (b.units as any)?.name,
        unit_type: (b.units as any)?.type
    })) || [];

    if (units.length === 0) {
        // Fallback: If no active booking, maybe show all past bookings or a generic "Other" option?
        // For now, let's inform them.
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">Nueva Incidencia</h2>
                <p className="text-muted-foreground">No tienes estancias activas actualmente para reportar incidencias vinculadas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Nueva Incidencia</h2>
            <div className="max-w-2xl">
                <GuestTicketForm units={units} />
            </div>
        </div>
    );
}
