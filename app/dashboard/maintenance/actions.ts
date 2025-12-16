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
        assigned_to: assignedTo || null,
        reported_by: user?.id,
        photos: photos
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

    // Fetch current ticket to check transitions if needed, but for simplicity we just set timestamps based on target status
    const updateData: any = { status };

    if (status === 'in_progress') {
        // We only set started_at if it's null (first time moving to in_progress)
        // Check if started_at is already set? No, let's do a conditional update or fetch first.
        // Fetching first is safer.
        const { data: current } = await supabase.from("tickets").select("started_at").eq("id", ticketId).single();
        if (current && !current.started_at) {
            updateData.started_at = new Date().toISOString();
        }
    } else if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
    } else if (status === 'open') {
        // Reset if moved back to open? Maybe keep history? 
        // For calculating "first response", started_at is useful. 
        // For "resolution time", resolved_at - created_at (or started_at).
        // If re-opened, maybe clear resolved_at.
        updateData.resolved_at = null;
    }

    const { error } = await supabase.from("tickets").update(updateData).eq("id", ticketId);

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

export const deleteTicketAction = async (ticketId: string) => {
    const supabase = await createClient();
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

    if (error) return { error: error.message };

    // Log Activity could generally go here, but deletion removes the object reference.
    // Logging ID only.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
        if (profile?.property_id) {
            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "ticket-deleted",
                description: `Mantenimiento - Ticket Eliminado`,
                entityId: ticketId
            });
        }
    }

    revalidatePath("/dashboard/maintenance");
    return redirect("/dashboard/maintenance");
};

export const updateTicketDetailsAction = async (formData: FormData) => {
    const ticketId = formData.get("taskId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    const supabase = await createClient();

    const { error } = await supabase
        .from("tickets")
        .update({ title, description, priority })
        .eq("id", ticketId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/maintenance");
    return { message: "Ticket details updated" };
};
