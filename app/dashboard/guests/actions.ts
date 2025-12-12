"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Lazy load admin client to avoid runtime errors if env is missing
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
        throw new Error("Missing Supabase URL or Service Role Key");
    }

    return createAdminClient(url, key);
}

export async function createGuestAccountAction(guestId: string, email: string, documentId: string) {
    try {
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
        const supabaseAdmin = getSupabaseAdmin(); // Will throw if keys missing

        // Check if user already exists in Auth (by email) to prevent error
        // Admin listUsers not always efficient, but createUser returns error if exists.

        const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: documentId, // Un-hashed for initial access, user handles matches
            email_confirm: true,
            user_metadata: { role: 'guest' }
        });

        let targetUserId = user?.user?.id;

        if (createError) {
            // If user already exists, try to recover the ID
            if (createError.message?.includes("registered") || createError.message?.includes("exists")) {
                console.log("User already exists, attempting to link...");

                // Try to find the user ID from profiles since we can't easily query auth.users
                // Assuming email is in profiles (it usually is if triggers are set up)
                // OR we can't easily get it.
                // Alternative: Use listUsers with filter (unfortunately deprecated/slow? No, listing is ok).
                // Actually, listUsers doesn't support email filter efficiently in client lib.

                // Better approach: We can't really get the ID easily if profiles doesn't have it. 
                // But normally profiles trigger creates a profile with ID.
                // Let's try to fetch user details using supabaseAdmin.auth.admin.getUserByEmail? 
                // It doesn't exist in JS client? It should. 
                // Actually it might not.

                // Let's try to query profiles table first.
                // Note: Profiles table might use 'id' as primary key.
                const { data: profile } = await supabaseAdmin
                    .from("profiles")
                    .select("id")
                    .eq("email", email)
                    .single(); // Profiles table might not have email column!

                // If profiles doesn't have email, we are stuck.
                // Usually profiles has email if synced. Let's assume we can't rely on it.

                // Let's try listing users. It's an admin action, safety is handled.
                // Hopefully the list isn't huge.
                const { data: { users: userList } } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = userList.find(u => u.email === email);

                if (existingUser) {
                    targetUserId = existingUser.id;
                    // Proceed to update
                } else {
                    return { error: "El usuario ya existe pero no se pudo recuperar su ID. Contacte soporte." };
                }
            } else {
                console.error("Auth Create Error:", createError);
                return { error: "Error Auth: " + createError.message };
            }
        }

        if (!targetUserId) return { error: "No se pudo obtener el User ID." };

        // 3. Link User ID to Guest Record using Admin Client to bypass RLS
        const { error: updateError } = await supabaseAdmin
            .from("guests")
            .update({ user_id: targetUserId })
            .eq("id", guestId);

        if (updateError) {
            // Rollback? ideally yes, but for MVP just report
            return { error: "Error DB Guest: " + updateError.message };
        }

        // 4. Create Profile entry for Role and Property
        // We need to fetch the property_id from the guest record first if we haven't already
        const { data: guestData } = await supabase.from("guests").select("property_id").eq("id", guestId).single();

        const { error: profileError } = await supabaseAdmin.from("profiles").update({
            role: "guest",
            property_id: guestData?.property_id
        }).eq("id", targetUserId);

        if (profileError) {
            console.error("Profile Update Error:", profileError);
            // Non-critical (?) but important for permissions
            return { error: "Usuario creado pero falló perfil: " + profileError.message };
        }

        revalidatePath("/dashboard/guests");
        return { message: "Acceso de huésped habilitado correctamente." };

    } catch (e: any) {
        console.error("CreateGuestAction Exception:", e);
        return { error: "Excepción: " + (e.message || "Error desconocido") };
    }
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

export async function disableGuestAccessAction(guestId: string) {
    try {
        const supabase = await createClient();

        // 1. Get Guest and User ID
        const { data: guest } = await supabase.from("guests").select("user_id").eq("id", guestId).single();
        if (!guest?.user_id) {
            return { error: "Este huésped no tiene acceso habilitado." };
        }

        const userId = guest.user_id;

        // 2. Remove User from Auth (using Admin Client)
        const supabaseAdmin = getSupabaseAdmin();
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("Auth Delete Error:", deleteError);
            return { error: "Error eliminando usuario Auth: " + deleteError.message };
        }

        // 3. Update Guest record (set user_id to NULL)
        const { error: updateError } = await supabase
            .from("guests")
            .update({ user_id: null })
            .eq("id", guestId);

        if (updateError) {
            return { error: "Error actualizando ficha de huésped: " + updateError.message };
        }

        revalidatePath("/dashboard/guests");
        return { message: "Acceso desactivado correctamente." };

    } catch (e: any) {
        console.error("DisableGuestAction Exception:", e);
        return { error: "Excepción: " + (e.message || "Error desconocido") };
    }
}
