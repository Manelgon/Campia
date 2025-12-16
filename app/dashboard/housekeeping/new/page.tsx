import { createClient } from "@/utils/supabase/server";
import { TaskForm } from "./task-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewTaskPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
    if (!profile?.property_id) return <div>No tienes una propiedad asignada.</div>;

    // Fetch Units
    const { data: units } = await supabase
        .from("units")
        .select("id, name, type")
        .eq("property_id", profile.property_id)
        .order("name");

    // Fetch Staff Logic
    // Allow admins to assign to anyone, or at least see everyone.
    // Standard staff might only see their department.

    let userRole = "housekeeping";
    if (user) {
        const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (userProfile) userRole = userProfile.role;
    }

    let staffQuery = supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("property_id", profile.property_id);

    if (userRole !== "admin" && userRole !== "superadmin") {
        staffQuery = staffQuery.in("role", ["cleaning", "maintenance", "admin"]);
        // Or should we strict it to cleaning? Maintenance does eq('maintenance').
        // Let's broaden it slightly or just follow the request "igual que mantenimiento"
        // Maintenance: if not admin, only maintenance.
        // So for Housekeeping: if not admin, only cleaning?
        // But the issue is Manel wants to assign himself probably.
        // If Manel is Admin, the previous code filtered him out because he is not 'cleaning'.
        // So if I am Admin, I should see everyone.
    }

    // Actually, to be safe and allow cross-functional teams in small hotels:
    // Let's just remove the strict role filter for now, or match Maintenance exactly essentially:
    // If Admin -> All. If not -> Only Cleaning.

    if (userRole !== "admin" && userRole !== "superadmin") {
        staffQuery = staffQuery.eq("role", "cleaning");
    }

    const { data: staff } = await staffQuery;

    return (
        <div className="max-w-2xl mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/housekeeping">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Nueva Tarea de Limpieza</h1>
            </div>
            <TaskForm units={units || []} staff={staff || []} />
        </div>
    );
}
