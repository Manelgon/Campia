"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const createInvoiceAction = async (bookingId: string) => {
    const supabase = await createClient();

    // 1. Calculate total from Booking Price + Extras
    // Fetch booking details
    const { data: booking } = await supabase
        .from("bookings")
        .select("total_price")
        .eq("id", bookingId)
        .single();

    if (!booking) return { error: "Booking not found" };

    // Fetch extras total
    const { data: extras } = await supabase
        .from("booking_extras")
        .select("total_price")
        .eq("booking_id", bookingId);

    const extrasTotal = extras?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;
    const finalAmount = (booking.total_price || 0) + extrasTotal;

    // 2. Create Invoice
    const { error } = await supabase
        .from("invoices")
        .insert({
            booking_id: bookingId,
            total_amount: finalAmount,
            status: "pending",
            due_date: new Date().toISOString()
        });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/financials");
    revalidatePath(`/dashboard/bookings/${bookingId}`); // Revalidate detail page
    return { message: "Invoice generated successfully" };
};

export const markInvoicePaidAction = async (invoiceId: string, method: string) => {
    const supabase = await createClient();

    const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", invoiceId);

    if (invoiceError) return { error: invoiceError.message };

    revalidatePath("/dashboard/financials");
    return { message: "Invoice marked as Paid" };
};

export const addExtraAction = async (formData: FormData) => {
    const bookingId = formData.get("bookingId") as string;
    const extraId = formData.get("extraId") as string;
    const quantity = parseInt(formData.get("quantity") as string);

    if (!bookingId || !extraId || !quantity) return { error: "Missing fields" };

    const supabase = await createClient();

    // 1. Get extra price
    const { data: extra } = await supabase
        .from("extras")
        .select("price")
        .eq("id", extraId)
        .single();

    if (!extra) return { error: "Extra not found" };

    const totalPrice = (extra.price || 0) * quantity;

    // 2. Insert into booking_extras
    const { error } = await supabase
        .from("booking_extras")
        .insert({
            booking_id: bookingId,
            extra_id: extraId,
            quantity: quantity,
            total_price: totalPrice
        });

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/bookings/${bookingId}`);
    return { message: "Extra added successfully" };
};
