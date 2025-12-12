"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const createRateAction = async (formData: FormData) => {
    const unitId = formData.get("targetId") as string; // Can be unit ID or Type (but UI usually handles one)
    const targetType = formData.get("targetType") as string; // 'unit' or 'type'
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const price = parseFloat(formData.get("price") as string);

    if (!startDate || !endDate || !price || (!unitId && targetType === 'unit')) {
        return { error: "Faltan campos obligatorios" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();
    if (!profile?.property_id) return { error: "Propiedad no encontrada" };

    const payload: any = {
        property_id: profile.property_id,
        start_date: startDate,
        end_date: endDate,
        price: price
    };

    if (targetType === 'unit') {
        payload.unit_id = unitId;
    } else {
        // Assume 'unitId' holds the type string if targetType is 'type'
        // Or we pass a separate field. Let's assume the form passes the string value in 'targetId' for now.
        // We need to verify if 'unit_type' matches actual units.type column logic.
        payload.unit_type = unitId;
    }

    console.log("Inserting Rate:", payload);

    const { error } = await supabase.from("custom_prices").insert(payload);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/admin/rates");
    return { message: "Tarifa creada correctamente" };
};

export const deleteRateAction = async (rateId: string) => {
    const supabase = await createClient();
    const { error } = await supabase.from("custom_prices").delete().eq("id", rateId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin/rates");
    return { message: "Tarifa eliminada" };
};
