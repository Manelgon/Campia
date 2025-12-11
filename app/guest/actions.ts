"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getGuestDashboardData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    // 1. Get Guest Record
    const { data: guest } = await supabase
        .from("guests")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!guest) return { error: "No se encontró perfil de huésped." };

    // 2. Get Active Booking (Confirmed or Checked In)
    // Prioritize Checked In, then Confirmed closer to date
    const { data: booking } = await supabase
        .from("bookings")
        .select(`
            *,
            units (*)
        `)
        .eq("guest_id", guest.id)
        .in("status", ["confirmed", "checked_in"])
        .order("check_in_date", { ascending: true }) // Next upcoming or current
        .limit(1)
        .single();

    return { guest, booking };
}

export async function createGuestTicketAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    // Get Unit ID from hidden field or infer from active booking?
    // Safer to infer from active booking on server side to prevent manipulation?
    // But user might have multiple bookings? MVP: Use active booking logic.

    const { data: guest } = await supabase
        .from("guests")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!guest) return { error: "Perfil no encontrado" };

    // Find active booking/unit
    const { data: booking } = await supabase
        .from("bookings")
        .select("unit_id, property_id")
        .eq("guest_id", guest.id)
        .in("status", ["confirmed", "checked_in"])
        .order("check_in_date", { ascending: true })
        .limit(1)
        .single();

    if (!booking) return { error: "No tienes una reserva activa para reportar incidencias." };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!title || !description) return { error: "Título y descripción requeridos" };

    const { error } = await supabase.from("tickets").insert({
        title,
        description,
        unit_id: booking.unit_id,
        property_id: booking.property_id,
        reported_by: user.id, // Auth user ID
        priority: "medium",
        status: "open"
    });

    if (error) return { error: "Error creando ticket: " + error.message };

    revalidatePath("/guest");
    return { message: "Incidencia reportada correctamente" };
}

import { redirect } from "next/navigation";

export async function guestLoginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    return redirect("/guest");
}
