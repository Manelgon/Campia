"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const signInAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // Check where to go
    const nextUrl = formData.get("next") as string;
    if (nextUrl) {
        return redirect(nextUrl);
    }

    // Smart redirect based on role
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
        console.log("User found:", authUser.id);

        // Try fetching profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authUser.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile for redirect:", profileError);
        }

        console.log("Profile Role:", profile?.role);

        if (profile?.role === "guest" || authUser.user_metadata?.role === 'guest') {
            console.log("Redirecting to /guest");
            return redirect("/guest");
        }
    }

    console.log("Redirecting to /dashboard");
    return redirect("/dashboard");
};

export const signUpAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });

    if (error) {
        return { error: error.message };
    }

    return { message: "Check your email to verify your account" };
};

export const signOutAction = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/login");
};
