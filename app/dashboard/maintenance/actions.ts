"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const createTicketAction = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const unitId = formData.get("unitId") as string;

    // Optional: get user ID from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("tickets").insert({
        title,
        description,
        priority,
        status: "open",
        property_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        unit_id: unitId || null,
        reported_by: user?.id
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/maintenance");
    return redirect("/dashboard/maintenance");
};

export const updateTicketStatusAction = async (ticketId: string, status: string) => {
    const supabase = await createClient();
    const { error } = await supabase.from("tickets").update({ status }).eq("id", ticketId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/maintenance");
};
