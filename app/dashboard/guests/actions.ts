"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Need usage of Service Role to create users without logging out current staff
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createGuestAccountAction(guestId: string, email: string, documentId: string) {
    const supabase = await createClient();

    // 1. Check if user already exists
    // We can try to get the guest record to see if user_id is set
    const { data: guest } = await supabase.from("guests").select("user_id").eq("id", guestId).single();
    if (guest?.user_id) {
        return { error: "Este huésped ya tiene acceso habilitado." };
    }

    if (!email || !documentId) {
        return { error: "Email y Documento ID son obligatorios." };
    }

    // 2. Create User in Auth (using Admin Client)
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: documentId, // Un-hashed for initial access, user handles matches
        email_confirm: true,
        user_metadata: { role: 'guest' }
    });

    if (createError) {
        return { error: "Error creando usuario: " + createError.message };
    }

    if (!user.user) return { error: "No se pudo crear el usuario." };

    // 3. Link User ID to Guest Record
    const { error: updateError } = await supabase
        .from("guests")
        .update({ user_id: user.user.id })
        .eq("id", guestId);

    if (updateError) {
        // Rollback? ideally yes, but for MVP just report
        return { error: "Usuario creado pero no vinculado: " + updateError.message };
    }

    // 4. Create Profile entry for Role (if trigger didn't handle it or to be safe)
    // The existing trigger handles 'reception' default, we might want to update it to 'guest'
    // Or our trigger sets it based on metadata? 
    // Let's update the profile role to 'guest' explicitly
    await supabaseAdmin.from("profiles").update({ role: "guest" }).eq("id", user.user.id);

    revalidatePath("/dashboard/guests");
    return { message: "Acceso de huésped habilitado correctamente." };
}
