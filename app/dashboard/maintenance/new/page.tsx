import { createClient } from "@/utils/supabase/server";
import { TicketForm } from "./ticket-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewTicketPage() {
    const supabase = await createClient();
    const { data: units } = await supabase.from("units").select("id, name");

    // Fetch Staff Logic (Same as maintenance/page.tsx)
    const { data: { user } } = await supabase.auth.getUser();
    let userRole = "maintenance";
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) userRole = profile.role;
    }

    let staffQuery = supabase.from("profiles").select("id, full_name, role");
    if (userRole !== "admin" && userRole !== "superadmin") {
        staffQuery = staffQuery.eq("role", "maintenance");
    }
    const { data: staff } = await staffQuery;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/maintenance">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">Nueva Incidencia</h2>
            </div>
            <TicketForm units={units || []} staff={staff || []} />
        </div>
    )
}
