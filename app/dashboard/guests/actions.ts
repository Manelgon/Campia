"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Lazy load admin client to avoid runtime errors if env is missing
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error("Missing Supabase URL or Service Role Key");
    }

    return createAdminClient(url, key);
}

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
    const supabaseAdmin = getSupabaseAdmin();
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

export async function createGuestAction(formData: FormData) {
    const supabase = await createClient();
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const documentId = formData.get("documentId") as string;
    const nationality = formData.get("nationality") as string;

    // Get property_id (helper in DB or profile query)
    // For MVP, we'll fetch from current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user?.id).single();

    if (!profile?.property_id) {
        return { error: "No se encontró la propiedad asociada al usuario." };
    }

    const { data, error } = await supabase.from("guests").insert({
        full_name: fullName,
        email,
        phone,
        document_id: documentId,
        nationality,
        property_id: profile.property_id
    }).select().single();

    if (error) {
        return { error: "Error creando huésped: " + error.message };
    }

    revalidatePath("/dashboard/guests");
    return { success: true, guest: data };
}

export async function searchGuestsAction(query: string) {
    const supabase = await createClient();
    if (!query || query.length < 2) return { guests: [] };

    // ILIKE search on multiple fields using OR
    const { data: guests, error } = await supabase
        .from("guests")
        .select("id, full_name, document_id, email, phone")
        .or(`full_name.ilike.%${query}%,document_id.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error("Search error:", error);
        return { guests: [] };
    }

    return { guests };
}
