"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/utils/logging";

export const createTicketAction = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const unitId = formData.get("unitId") as string;

    // Optional: get user ID from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No user found" };

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();

    if (!profile?.property_id) return { error: "No property assigned" };

    const { error } = await supabase.from("tickets").insert({
        title,
        description,
        priority,
        status: "open",
        property_id: profile.property_id,
        unit_id: unitId || null,
        reported_by: user?.id
    });

    // Log Activity
    // Format: "Mantenimiento - {Unit} - {Type} - {Priority}"
    let unitName = "General";
    let unitType = "Area Común";

    if (unitId) {
        const { data: u } = await supabase.from("units").select("name, type").eq("id", unitId).single();
        if (u) {
            unitName = u.name;
            unitType = u.type || "";
        }
    }

    const priorityMap: Record<string, string> = {
        low: "BAJA",
        normal: "NORMAL",
        high: "ALTA",
        critical: "CRITICA"
    };

    await logActivity(supabase, {
        propertyId: profile.property_id,
        userId: user.id,
        type: "ticket-created",
        description: `Mantenimiento - ${unitName} - ${unitType} - ${priorityMap[priority.toLowerCase()] || priority.toUpperCase()}`,
        entityId: undefined
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


    // Log Activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
        const { data: ticket } = await supabase.from("tickets").select("unit_id, title").eq("id", ticketId).single();

        if (profile?.property_id && ticket) {
            let unitName = "General";
            let unitType = "Area Común";

            if (ticket.unit_id) {
                const { data: u } = await supabase.from("units").select("name, type").eq("id", ticket.unit_id).single();
                if (u) {
                    unitName = u.name;
                    unitType = u.type || "";
                }
            }

            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "ticket-updated",
                description: `Mantenimiento - ${unitName} - ${unitType} - ${status.toUpperCase()}`,
                entityId: ticketId
            });
        }
    }

    revalidatePath("/dashboard/maintenance");
};

export const assignTicketAction = async (formData: FormData) => {
    const ticketId = formData.get("taskId") as string;
    const userId = formData.get("userId") as string;

    const supabase = await createClient();

    const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: userId })
        .eq("id", ticketId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/maintenance");
    return { message: "Ticket assigned successfully" };
};
