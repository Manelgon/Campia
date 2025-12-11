"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
