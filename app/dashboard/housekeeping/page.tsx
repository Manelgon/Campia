import { createClient } from "@/utils/supabase/server";
import { TaskList } from "./task-list";

export default async function HousekeepingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch pending tasks
    const { data: tasks } = await supabase
        .from("housekeeping_tasks")
        .select(`
        *,
        units (name, type),
        profiles:assigned_to (full_name)
    `)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

    // Fetch staff for assignment dropdown
    const { data: staff } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["cleaning", "maintenance", "manager", "admin"]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Limpieza y Housekeeping</h2>
            </div>

            <TaskList tasks={tasks || []} currentUserId={user.id} staffMembers={staff || []} />
        </div>
    );
}
