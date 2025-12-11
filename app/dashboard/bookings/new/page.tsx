import { createClient } from "@/utils/supabase/server";
import { BookingForm } from "./booking-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewBookingPage() {
    const supabase = await createClient();

    // Fetch lists for select options
    const { data: units } = await supabase.from("units").select("id, name");
    const { data: guests } = await supabase.from("guests").select("id, full_name");

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/bookings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-2xl font-bold tracking-tight">Nueva Reserva</h2>
            </div>
            <BookingForm units={units || []} guests={guests || []} />
        </div>
    );
}
