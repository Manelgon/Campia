"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const signInGuestAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    // 1. Attempt Sign In
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: "Credenciales inválidas" };
    }

    if (!user) {
        return { error: "Error desconocido de autenticación" };
    }

    // 2. Strict Role Check
    // Check metadata first (faster)
    if (user.user_metadata?.role === 'guest') {
        return redirect("/guest");
    }

    // Check profile (slower but source of truth)
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role === 'guest') {
        return redirect("/guest");
    }

    // 3. If not guest, Sign Out immediately and deny access
    await supabase.auth.signOut();
    return { error: "Acceso denegado: Solo para huéspedes." };
};
