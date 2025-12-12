"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createInvoiceAction } from "../financials/actions";
import { logActivity } from "@/utils/logging";

export const createBookingAction = async (formData: FormData) => {
    const propertyId = formData.get("propertyId") as string;
    const unitId = formData.get("unitId") as string;
    const guestId = formData.get("guestId") as string;
    const checkIn = formData.get("checkIn") as string;
    const checkOut = formData.get("checkOut") as string;
    const guestsCount = formData.get("guestsCount") as string;

    const supabase = await createClient();

    // Get current user's property_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();

    if (!profile?.property_id) {
        return { error: "Tu usuario no está vinculado a ninguna propiedad." };
    }

    // [New] Calculate dynamic total price using the database function
    const { data: totalPrice, error: calcError } = await supabase.rpc("calculate_booking_total", {
        p_unit_id: unitId,
        p_check_in: checkIn,
        p_check_out: checkOut
    });

    if (calcError) {
        console.error("Error calculating dynamic price:", calcError);
        return { error: "Error calculando el precio de la estancia" };
    }

    const { data: newBooking, error } = await supabase.from("bookings").insert({
        property_id: profile.property_id,
        unit_id: unitId,
        guest_id: guestId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests_count: parseInt(guestsCount),
        status: "confirmed",
        total_amount: totalPrice || 0,
    }).select("id").single();

    if (error) {
        return { error: error.message };
    }

    // Log Activity (Rich Format)
    // Fetch guest name for the log
    const { data: guestData } = await supabase.from("guests").select("full_name").eq("id", guestId).single();
    const guestName = guestData?.full_name || "Invitado desconocido";
    const shortId = (newBooking as any)?.id?.slice(0, 8) || "N/A";

    await logActivity(supabase, {
        propertyId: profile.property_id,
        userId: user.id,
        type: "booking-created",
        description: `Nueva reserva creada para #${shortId}- ${guestName}`,
        entityId: (newBooking as any)?.id
    });

    revalidatePath("/dashboard/bookings");
    return redirect("/dashboard/bookings");
};

export const checkInAction = async (bookingId: string) => {
    const supabase = await createClient();

    // 1. Get booking details to know the unit
    const { data: booking } = await supabase
        .from("bookings")
        .select("unit_id")
        .eq("id", bookingId)
        .single();

    if (!booking) return { error: "Booking not found" };

    // 2. Update booking status
    const { error: bookingError } = await supabase
        .from("bookings")
        .update({
            status: "checked_in",
            real_check_in: new Date().toISOString(),
        })
        .eq("id", bookingId);

    if (bookingError) return { error: bookingError.message };

    // 3. Update unit status to occupied
    if (booking.unit_id) {
        await supabase
            .from("units")
            .update({ status: "occupied" })
            .eq("id", booking.unit_id);
    }

    // 4. Ensure Invoice Creation
    const { data: existingInvoices } = await supabase
        .from("invoices")
        .select("id")
        .eq("booking_id", bookingId);

    if (!existingInvoices || existingInvoices.length === 0) {
        await createInvoiceAction(bookingId);
    }

    // Get user and booking details for logging
    const { data: { user } } = await supabase.auth.getUser();
    if (user && booking.unit_id) {
        const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
        const { data: bookingDetails } = await supabase.from("bookings").select(`guests(full_name), units(name)`).eq("id", bookingId).single();

        if (profile?.property_id && bookingDetails) {
            const guestName = (bookingDetails.guests as any)?.full_name || "Desconocido";
            const shortId = bookingId.slice(0, 8);
            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "check-in",
                description: `Check-in realizado para reserva #${shortId}- ${guestName}`,
                entityId: bookingId
            });
        }
    }

    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/units");
};

export const checkOutAction = async (bookingId: string) => {
    const supabase = await createClient();

    // 1. Get booking details
    const { data: booking } = await supabase
        .from("bookings")
        .select("unit_id, guest_id")
        .eq("id", bookingId)
        .single();

    if (!booking) return { error: "Booking not found" };

    // 2. Update booking status
    const { error: bookingError } = await supabase
        .from("bookings")
        .update({
            status: "checked_out",
            real_check_out: new Date().toISOString(),
        })
        .eq("id", bookingId);

    if (bookingError) return { error: bookingError.message };

    // 3. Update unit status to dirty (needs cleaning)
    if (booking.unit_id) {
        await supabase
            .from("units")
            .update({ status: "dirty" }) // Mark as dirty for housekeeping
            .eq("id", booking.unit_id);
    }

    // 4. Deactivate Guest Access (Security Requirement)
    if (booking.guest_id) {
        // Unlink guest from user_id so they can no longer access dashboard
        await supabase.from("guests").update({ user_id: null }).eq("id", booking.guest_id);
    }

    // Log Activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
        const { data: bookingDetails } = await supabase.from("bookings").select(`guests(full_name), units(name)`).eq("id", bookingId).single();

        if (profile?.property_id && bookingDetails) {
            const guestName = (bookingDetails.guests as any)?.full_name || "Desconocido";
            const shortId = bookingId.slice(0, 8);

            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "check-out",
                description: `Check-out realizado para reserva #${shortId}- ${guestName}`,
                entityId: bookingId
            });

            // Log Automatic Cleaning Task Creation (triggered by DB)
            // Fetch Unit Type
            const { data: u } = await supabase.from("units").select("type").eq("id", booking.unit_id).single();
            const uType = u?.type || "General";
            const uName = (bookingDetails.units as any)?.name || "Unidad";

            await logActivity(supabase, {
                propertyId: profile.property_id,
                userId: user.id,
                type: "housekeeping-created",
                description: `Limpieza - ${uName} - ${uType} - ALTA`, // Auto task is always high priority
                entityId: booking.unit_id // or better, find the task ID? It's hard to get the trigger-created ID. UnitID is a proxy.
            });
        }
    }

    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/units");
};

export const getAvailableUnitsAction = async (checkIn: string, checkOut: string) => {
    const supabase = await createClient();

    // 1. Get current user's property_id (to filter units by property)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
    if (!profile?.property_id) return { error: "Propiedad no encontrada" };

    // 2. Find units that have overlapping bookings
    // Overlap condition: (StartA < EndB) and (EndA > StartB)
    const { data: busyUnits } = await supabase
        .from("bookings")
        .select("unit_id")
        .eq("property_id", profile.property_id)
        .in("status", ["confirmed", "checked_in"])
        .lt("check_in_date", checkOut)
        .gt("check_out_date", checkIn);

    const busyUnitIds = busyUnits?.map(b => b.unit_id) || [];

    // 3. Fetch units that are NOT in the busy list
    let query = supabase
        .from("units")
        .select("id, name, type, capacity, status")
        .eq("property_id", profile.property_id);

    if (busyUnitIds.length > 0) {
        query = query.not("id", "in", `(${busyUnitIds.map(id => `"${id}"`).join(',')})`);
    }

    const { data: units, error } = await query.order("name");

    if (error) return { error: error.message };
    return { units };
};

export const calculatePriceAction = async (unitId: string, checkIn: string, checkOut: string) => {
    const supabase = await createClient();

    const { data: price, error } = await supabase.rpc("calculate_booking_total", {
        p_unit_id: unitId,
        p_check_in: checkIn,
        p_check_out: checkOut
    });

    if (error) return { error: error.message };
    return { price };
};
