"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/utils/logging";

export const completeTaskAction = async (taskId: string, unitId: string) => {
    const supabase = await createClient();

    // 1. Update task status
    const { error: taskError } = await supabase
        .from("housekeeping_tasks")
        .update({ status: "resolved", completed_at: new Date().toISOString() })
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
                critical: "CRÍTICA",
                high: "ALTA",
                medium: "MEDIA",
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
    const priority = (formData.get("priority") as string) || "medium";
    const notes = formData.get("notes") as string;
    const assignedTo = formData.get("assignedTo") as string;

    // Parse photos
    const photosJson = formData.get("photos") as string;
    let photos: string[] = [];
    if (photosJson) {
        try {
            photos = JSON.parse(photosJson);
        } catch (e) {
            console.error("Error parsing photos:", e);
        }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No user found" };

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
    if (!profile?.property_id) return { error: "No property assigned" };

    const { data: newTask, error } = await supabase.from("housekeeping_tasks").insert({
        unit_id: unitId,
        priority, // medium, high, critical
        notes,
        status: "open",
        assigned_to: assignedTo || null,
        photos: photos,
        created_by: user.id,
        property_id: profile.property_id
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
        critical: "CRÍTICA",
        high: "ALTA",
        medium: "MEDIA",
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

export const updateTaskStatusAction = async (taskId: string, status: string) => {
    const supabase = await createClient();

    const updateData: any = { status };
    if (status === 'resolved' || status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    } else if (status === 'open' || status === 'pending') {
        updateData.completed_at = null;
    }

    const { error } = await supabase.from("housekeeping_tasks").update(updateData).eq("id", taskId);

    if (error) return { error: error.message };

    // Log Activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
        const { data: task } = await supabase.from("housekeeping_tasks").select("unit_id, priority").eq("id", taskId).single();

        if (profile?.property_id && task) {
            let unitName = "General";
            let unitType = "Area Común";

            if (task.unit_id) {
                const { data: u } = await supabase.from("units").select("name, type").eq("id", task.unit_id).single();
                if (u) {
                    unitName = u.name;
                    unitType = u.type || "";
                }
            }

            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "housekeeping-updated",
                description: `Limpieza - ${unitName} - ${unitType} - ${status.toUpperCase()}`,
                entityId: taskId
            });
        }
    }

    revalidatePath("/dashboard/housekeeping");
    return { message: "Status updated" };
};

export const deleteTaskAction = async (taskId: string) => {
    const supabase = await createClient();
    const { error } = await supabase.from("housekeeping_tasks").delete().eq("id", taskId);

    if (error) return { error: error.message };

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
        if (profile?.property_id) {
            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "housekeeping-deleted",
                description: `Limpieza - Tarea Eliminada`,
                entityId: taskId
            });
        }
    }

    revalidatePath("/dashboard/housekeeping");
    return { message: "Task deleted" };
};

export const updateTaskDetailsAction = async (formData: FormData) => {
    const taskId = formData.get("taskId") as string;
    const priority = formData.get("priority") as string;
    const notes = formData.get("notes") as string;

    const supabase = await createClient();

    const { error } = await supabase
        .from("housekeeping_tasks")
        .update({ priority, notes })
        .eq("id", taskId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/housekeeping");
    return { message: "Task details updated" };
};
