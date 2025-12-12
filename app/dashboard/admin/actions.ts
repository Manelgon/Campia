"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const createUserAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as string;
    const propertyId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // Hardcoded for MVP

    const supabaseAdmin = createAdminClient();

    // 1. Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authUser.user) {
        return { error: "Failed to create user" };
    }

    // 2. We depend on the trigger for profile creation, OR we can manually update the role
    // The trigger 'on_auth_user_created' inserts into public.profiles
    // We need to wait a bit or just update the role now. 
    // Let's update the role directly using admin client to be sure

    // Wait a small moment for trigger? Or just upsert.
    // Ideally, the trigger handles the insert. We just need to update the role since trigger sets default 'reception'.

    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ role: role, property_id: propertyId })
        .eq("id", authUser.user.id);

    if (profileError) {
        // If update fails, maybe trigger hasn't fired yet. 
        // For robustness in this MVP, let's just insert/upsert if we have permissions (service role does)
        const { error: upsertError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: authUser.user.id,
                email,
                full_name: fullName,
                role,
                property_id: propertyId
            });

        if (upsertError) return { error: upsertError.message };
    }

    revalidatePath("/dashboard/admin/users");
    return { message: "User created successfully" };
};

export const updatePropertyAction = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const website_url = formData.get("website_url") as string;

    // Logic to get dynamic property ID
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase.from("profiles").select("property_id").eq("id", user.id).single();

    if (!profile?.property_id) return { error: "No tienes una propiedad asignada" };

    const { error } = await supabase
        .from("properties")
        .update({
            name,
            address,
            phone,
            email,
            website_url
        })
        .eq("id", profile.property_id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin/settings");
    return { message: "Property updated successfully" };
}
