"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const updateUnitStatusAction = async (unitId: string, status: string) => {
    const supabase = await createClient();

    const { error } = await supabase
        .from("units")
        .update({ status })
        .eq("id", unitId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/units");
};
