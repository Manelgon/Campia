"use server";

import { createClient } from "@/utils/supabase/server";

const WEBHOOK_URL = "https://ssllmwebhookn8nss.automatizatelo.com/webhook/8795ed42-4a2b-4d0e-8a09-82cd9ee8334f/chat";

import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
        throw new Error("Missing Supabase URL or Service Role Key");
    }

    return createAdminClient(url, key);
}

export async function sendMessageAction(formData: FormData) {
    const supabase = await createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // 2. Parse Data
    const content = formData.get("content") as string;
    const type = formData.get("type") as "text" | "image" | "audio";

    if (!content) return { error: "Contenido vacío" };

    // 3. Get Context using Admin Client to bypass RLS restrictions
    const supabaseAdmin = getSupabaseAdmin();

    // Find Guest ID linked to User
    const { data: guest } = await supabaseAdmin
        .from("guests")
        .select("*, properties(name)")
        .eq("user_id", user.id)
        .single();

    if (!guest) return { error: "Perfil de huésped no encontrado" };

    // Find Active Booking with Priority:
    // 1. Status = 'checked_in' (Always top priority)
    // 2. Status = 'confirmed' (Closest upcoming)

    let booking = null;
    const today = new Date().toISOString().split('T')[0];

    // Priority 1: Check for ACTIVE (Checked In) booking
    const { data: checkedInBooking } = await supabaseAdmin
        .from("bookings")
        .select("*, units(name)")
        .eq("guest_id", guest.id)
        .eq("status", "checked_in")
        .limit(1) // Takes just one if multiple exist
        .single();

    if (checkedInBooking) {
        booking = checkedInBooking;
    } else {
        // Priority 2: Check for UPCOMING (Confirmed) booking
        // We look for bookings starting today or in the future
        const { data: confirmedBooking } = await supabaseAdmin
            .from("bookings")
            .select("*, units(name)")
            .eq("guest_id", guest.id)
            .eq("status", "confirmed")
            .gte("check_in_date", today) // Only future/current bookings
            .order("check_in_date", { ascending: true }) // Closest to today
            .limit(1)
            .single();

        booking = confirmedBooking;
    }

    // 4. Construct Message Object (Ephemeral, not saved to DB)
    const messageId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const message = {
        id: messageId,
        created_at: timestamp,
        property_id: guest.property_id,
        guest_id: guest.id,
        sender_id: user.id,
        content,
        type: type || 'text',
        is_read: false
    };

    // 5. Fire Webhook (Strict Await)
    try {
        const payload = {
            guest: {
                id: guest.id,
                name: guest.full_name,
                email: guest.email,
                phone: guest.phone
            },
            booking: booking ? {
                id: booking.id,
                status: booking.status,
                check_in_date: booking.check_in_date, // CORRECTED COLUMN NAME
                check_out_date: booking.check_out_date, // CORRECTED COLUMN NAME
                guests_count: booking.guests_count
            } : null,
            unit: booking?.units ? {
                name: booking.units.name
            } : null,
            message: {
                content: content,
                type: type,
                id: message.id,
                timestamp: message.created_at
            }
        };

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Webhook returned error:", response.status, response.statusText);
            // Optionally throw or return error
        }

    } catch (e) {
        console.error("Webhook Error:", e);
        return { error: "Error enviando al sistema de mensajería (Webhook Failed)" };
    }

    // Return the message so the UI can display it
    return { success: true, message };
}
