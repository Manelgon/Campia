import { createClient } from "@/utils/supabase/server";
import { TaskForm } from "./task-form";

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

    // Fetch Staff for assignment
    const { data: staff } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("property_id", profile.property_id)
        .eq("role", "cleaning");

    return (
        <div className="max-w-2xl mx-auto py-6">
            <TaskForm units={units || []} staff={staff || []} />
        </div>
    );
}
