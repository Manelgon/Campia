import { createClient } from "@/utils/supabase/server";
import { TicketForm } from "./ticket-form";

export default async function NewTicketPage() {
    const supabase = await createClient();
    const { data: units } = await supabase.from("units").select("id, name");

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Nueva Incidencia</h2>
            <TicketForm units={units || []} />
        </div>
    )
}
