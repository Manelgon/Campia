"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const createInvoiceAction = async (bookingId: string, initialPayment?: { amount: number, methodId: string }) => {
    const supabase = await createAdminClient();

    console.log("createInvoiceAction called with ID:", bookingId);

    // 1. Fetch booking details with unit and extras
    const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select(`
            total_amount, 
            unit_id, 
            units (name, type),
            guests_count,
            check_in_date,
            check_out_date
        `)
        .eq("id", bookingId)
        .single();

    if (fetchError || !booking) {
        console.error("Error fetching booking details:", fetchError);
        return { error: `Booking not found. ID: ${bookingId}. Error: ${fetchError?.message}` };
    }

    // Fetch extras
    const { data: extras } = await supabase
        .from("booking_extras")
        .select(`
            quantity, 
            total_price, 
            extras (name, price)
        `)
        .eq("booking_id", bookingId);

    const extrasTotal = extras?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;
    const finalAmount = (booking.total_amount || 0) + extrasTotal;

    // 2. Create Invoice Header
    const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
            booking_id: bookingId,
            total_amount: finalAmount,
            status: "pending",
            due_date: new Date().toISOString()
        })
        .select()
        .single();

    if (invoiceError) return { error: invoiceError.message };

    // 3. Create Invoice Items
    const invoiceItems = [];

    // Item 1: Accommodation
    const nights = Math.max(1, Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)));
    invoiceItems.push({
        invoice_id: invoice.id,
        description: `Alojamiento: ${booking.units?.name} (${booking.units?.type}) - ${nights} noches`,
        quantity: 1, // Or nights? Usually price is total. Keeping qty 1 for line item of "Stay"
        unit_price: booking.total_amount || 0,
        total_price: booking.total_amount || 0
    });

    // Item 2...N: Extras
    if (extras && extras.length > 0) {
        extras.forEach(extra => {
            invoiceItems.push({
                invoice_id: invoice.id,
                description: extra.extras?.name || "Extra",
                quantity: extra.quantity,
                unit_price: extra.extras?.price || 0,
                total_price: extra.total_price || 0
            });
        });
    }

    const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

    if (itemsError) {
        console.error("Error creating invoice items:", itemsError);
        // Rollback? (Manual delete in MVP)
        await supabase.from("invoices").delete().eq("id", invoice.id);
        return { error: "Error creando detalles de factura: " + (itemsError.message || JSON.stringify(itemsError)) };
    }

    // 4. Record Initial Payment if provided
    if (initialPayment && initialPayment.amount > 0) {
        // Fetch method name for legacy support
        const { data: methodData } = await supabase
            .from("payment_methods")
            .select("name")
            .eq("id", initialPayment.methodId)
            .single();

        const methodName = methodData?.name || "Other";

        // Record Payment
        const { error: paymentError } = await supabase
            .from("payments")
            .insert({
                invoice_id: invoice.id,
                amount: initialPayment.amount,
                payment_method_id: initialPayment.methodId,
                method: methodName, // Legacy text field required
                status: "completed"
            });

        if (paymentError) return { error: "Error registrando pago inicial: " + paymentError.message };

        // Update Invoice totals
        const isPaid = initialPayment.amount >= finalAmount;

        const { error: updateError } = await supabase
            .from("invoices")
            .update({
                total_paid: initialPayment.amount,
                status: isPaid ? "paid" : "pending",
                paid_at: isPaid ? new Date().toISOString() : null
            })
            .eq("id", invoice.id);

        if (updateError) return { error: "Error actualizando estado de factura" };
    }

    revalidatePath("/dashboard/financials");
    revalidatePath(`/dashboard/bookings/${bookingId}`);
    return { message: "Invoice generated successfully" };
};

// Replaces markInvoicePaidAction with comprehensive recordPayment
export const recordPaymentAction = async (invoiceId: string, amount: number, methodId: string) => {
    const supabase = await createClient();

    // Fetch method name for legacy support
    const { data: methodData } = await supabase
        .from("payment_methods")
        .select("name")
        .eq("id", methodId)
        .single();

    const methodName = methodData?.name || "Other";

    // 1. Record Payment
    const { error: paymentError } = await supabase
        .from("payments")
        .insert({
            invoice_id: invoiceId,
            amount: amount,
            payment_method_id: methodId,
            method: methodName, // Legacy text field required
            status: "completed"
        });

    if (paymentError) return { error: paymentError.message };

    // 2. Update Invoice totals
    // Calculate new total paid
    const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", invoiceId)
        .eq("status", "completed");

    const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Get Invoice Total to check if fully paid
    const { data: invoice } = await supabase
        .from("invoices")
        .select("total_amount")
        .eq("id", invoiceId)
        .single();

    const isPaid = totalPaid >= (invoice?.total_amount || 0);

    const { error: updateError } = await supabase
        .from("invoices")
        .update({
            total_paid: totalPaid,
            status: isPaid ? "paid" : "pending",
            paid_at: isPaid ? new Date().toISOString() : null
        })
        .eq("id", invoiceId);

    if (updateError) return { error: "Error updating invoice status" };

    revalidatePath("/dashboard/financials");
    revalidatePath(`/dashboard/bookings`); // May affect booking status if we linked it
    return { message: "Payment recorded successfully" };
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
