import { createClient } from "@/utils/supabase/server";
import { BookingForm } from "./booking-form";

export default async function NewBookingPage() {
    const supabase = await createClient();

    // Fetch lists for select options
    const { data: units } = await supabase.from("units").select("id, name");
    const { data: guests } = await supabase.from("guests").select("id, full_name");

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Nueva Reserva</h2>
            <BookingForm units={units || []} guests={guests || []} />
        </div>
    );
}
