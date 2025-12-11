"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const createBookingAction = async (formData: FormData) => {
    const propertyId = formData.get("propertyId") as string;
    const unitId = formData.get("unitId") as string;
    const guestId = formData.get("guestId") as string;
    const checkIn = formData.get("checkIn") as string;
    const checkOut = formData.get("checkOut") as string;
    const guestsCount = formData.get("guestsCount") as string;

    const supabase = await createClient();

    const { error } = await supabase.from("bookings").insert({
        property_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", // Hardcoded for MVP/Demo
        unit_id: unitId,
        guest_id: guestId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests_count: parseInt(guestsCount),
        status: "confirmed",
    });

    if (error) {
        return { error: error.message };
    }

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
        // Find guest and their user_id
        const { data: guest } = await supabase.from("guests").select("user_id").eq("id", booking.guest_id).single();
        if (guest?.user_id) {
            // We need to use Admin Client to delete user or block them. 
            // Since this action is run by staff (authenticated), we can use Service Role if we import it, 
            // OR we can just unlink the user_id from the guest record so they can't login as 'guest' anymore.
            // Unlinking is safer/easier here without needing full admin client in this file,
            // BUT they still have a user in Auth. Ideally we delete the user.

            // For MVP: Unlink user_id from Guest Profile. 
            // This effectively stops them from fetching their data (policies rely on user_id match).
            // And we should probably also update the Auth User strict security, but this is a good first step.

            await supabase.from("guests").update({ user_id: null }).eq("id", booking.guest_id);

            // If we want to fully delete the Auth User, we need Service Role client here.
            // Let's stick to unlinking for now as it solves the "Access" problem (RLS won't match).
        }
    }

    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/units");
};
