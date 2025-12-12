"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/utils/logging";

export const completeTaskAction = async (taskId: string, unitId: string) => {
    const supabase = await createClient();

    // 1. Update task status
    const { error: taskError } = await supabase
        .from("housekeeping_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);

    if (taskError) return { error: taskError.message };

    // 2. Update unit status to 'clean'
    const { error: unitError } = await supabase
        .from("units")
        .update({ status: "clean" })
        .eq("id", unitId);

    if (unitError) return { error: unitError.message };

    // Log Activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
        // Fetch details
        const { data: task } = await supabase.from("housekeeping_tasks").select("priority").eq("id", taskId).single();
        const { data: unit } = await supabase.from("units").select("name, type").eq("id", unitId).single();

        if (profile?.property_id) {
            const rawPriority = task?.priority || "normal";
            const priorityMap: Record<string, string> = {
                high: "ALTA",
                normal: "NORMAL",
                low: "BAJA"
            };
            const priority = priorityMap[rawPriority.toLowerCase()] || rawPriority.toUpperCase();

            const uName = unit?.name || "Unidad";
            const uType = unit?.type || "General";

            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "housekeeping-completed",
                description: `Limpieza - ${uName} - ${uType} - ${priority}`,
                entityId: taskId
            });
        }
    }

    revalidatePath("/dashboard/housekeeping");
    return { message: "Task completed and unit marked clean" };
};

export const assignTaskAction = async (formData: FormData) => {
    const taskId = formData.get("taskId") as string;
    const userId = formData.get("userId") as string;

    const supabase = await createClient();

    const { error } = await supabase
        .from("housekeeping_tasks")
        .update({ assigned_to: userId })
        .eq("id", taskId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/housekeeping");
    return { message: "Task assigned successfully" };
}

export const createTaskAction = async (formData: FormData) => {
    const unitId = formData.get("unitId") as string;
    const priority = (formData.get("priority") as string) || "normal";
    const notes = formData.get("notes") as string;
    const assignedTo = formData.get("assignedTo") as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No user found" };

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
    if (!profile?.property_id) return { error: "No property assigned" };

    const { data: newTask, error } = await supabase.from("housekeeping_tasks").insert({
        unit_id: unitId,
        priority, // normal, high
        notes,
        status: "pending",
        assigned_to: assignedTo || null
    }).select("id").single();

    if (error) {
        // If error says column property_id does not exist, then we are right.
        return { error: error.message };
    }

    // Log Activity
    const { data: unit } = await supabase.from("units").select("name, type").eq("id", unitId).single();
    const uName = unit?.name || "Unidad";
    const uType = unit?.type || "General";

    const priorityMap: Record<string, string> = {
        high: "ALTA",
        normal: "NORMAL",
        low: "BAJA"
    };
    const prio = priorityMap[priority.toLowerCase()] || priority.toUpperCase();

    await logActivity(supabase, {
        propertyId: profile.property_id,
        userId: user.id,
        type: "housekeeping-created",
        description: `Limpieza - ${uName} - ${uType} - ${prio}`,
        entityId: (newTask as any)?.id
    });

    revalidatePath("/dashboard/housekeeping");
    return { message: "Task created successfully" };
};
