"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const createUserAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as string;

    // Get the current admin user's property
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    const { data: adminProfile } = await supabase
        .from("profiles")
        .select("property_id, role")
        .eq("id", user.id)
        .single();

    if (!adminProfile?.property_id) {
        return { error: "No tienes una propiedad asignada" };
    }

    // Only admins and superadmins can create users
    if (adminProfile.role !== "admin" && adminProfile.role !== "superadmin") {
        return { error: "No tienes permisos para crear usuarios" };
    }

    const propertyId = adminProfile.property_id;

    const supabaseAdmin = await createAdminClient();

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

    // 2. Update/insert profile with the admin's property_id
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

export const updateUserAction = async (formData: FormData) => {
    const userId = formData.get("userId") as string;
    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as string;

    const supabaseAdmin = await createAdminClient();

    // Update profile
    const { error } = await supabaseAdmin
        .from("profiles")
        .update({
            full_name: fullName,
            role: role
        })
        .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin/users");
    return { message: "Usuario actualizado correctamente" };
};

export const deleteUserAction = async (userId: string) => {
    const supabaseAdmin = await createAdminClient();

    // 1. Delete from auth.users (this will cascade to profiles via trigger)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) return { error: authError.message };

    revalidatePath("/dashboard/admin/users");
    return { message: "Usuario eliminado correctamente" };
};

export const toggleUserStatusAction = async (userId: string) => {
    const supabaseAdmin = await createAdminClient();

    // Get current status
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_active")
        .eq("id", userId)
        .single();

    const newStatus = profile?.is_active === false ? true : false;

    // Update status
    const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_active: newStatus })
        .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin/users");
    return { message: newStatus ? "Usuario activado" : "Usuario desactivado" };
};

export const resetPasswordAction = async (userId: string, newPassword: string) => {
    const supabaseAdmin = await createAdminClient();

    // Update user password using admin client
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin/users");
    return { message: "Contraseña restablecida correctamente" };
};

export const changeEmailAction = async (userId: string, newEmail: string) => {
    const supabaseAdmin = await createAdminClient();

    // Update user email using admin client
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true
    });

    if (authError) return { error: authError.message };

    // Also update in profiles table
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ email: newEmail })
        .eq("id", userId);

    if (profileError) return { error: profileError.message };

    revalidatePath("/dashboard/admin/users");
    return { message: "Email actualizado correctamente" };
};
