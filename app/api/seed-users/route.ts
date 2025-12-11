import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get Property ID
    const { data: properties } = await supabase.from("properties").select("id").limit(1);
    const propertyId = properties?.[0]?.id;

    if (!propertyId) {
        return NextResponse.json({ error: "No properties found. Run seed.sql first?" }, { status: 404 });
    }

    const usersToCreate = [
        { email: "admin@campia.com", password: "password123", role: "admin", name: "Admin User" },
        { email: "reception@campia.com", password: "password123", role: "reception", name: "Reception User" },
        { email: "housekeeping@campia.com", password: "password123", role: "housekeeping", name: "Housekeeping User" },
        { email: "maintenance@campia.com", password: "password123", role: "maintenance", name: "Maintenance User" },
        { email: "guest@campia.com", password: "password123", role: "guest", name: "Guest User" },
    ];

    const results = [];

    for (const u of usersToCreate) {
        // Check if exists
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users.find(user => user.email === u.email);

        if (existing) {
            // Update role just in case
            await supabase.from("profiles").update({ role: u.role, property_id: propertyId }).eq("id", existing.id);
            results.push({ email: u.email, status: "Updated/Existing" });
        } else {
            const { data: user, error } = await supabase.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: { full_name: u.name }
            });

            if (error) {
                results.push({ email: u.email, status: "Error", error: error.message });
            } else if (user.user) {
                // Profile is created by trigger, but we need to update role and property_id
                // Allow trigger to fire? Trigger inserts 'reception'. We overwrite.

                // Wait a bit for trigger? Or just update. RLS might block if trigger didn't run yet?
                // Service role bypasses RLS.

                await supabase.from("profiles").update({
                    role: u.role,
                    property_id: propertyId
                }).eq("id", user.user.id);

                // For Guest user, create a guest record in 'guests' table if not exists
                if (u.role === "guest") {
                    await supabase.from("guests").insert({
                        full_name: u.name,
                        email: u.email,
                        user_id: user.user.id,
                        property_id: propertyId,
                        nationality: "Testland",
                        document_id: "TEST12345"
                    });
                }

                results.push({ email: u.email, password: u.password, role: u.role, status: "Created" });
            }
        }
    }

    return NextResponse.json({
        message: "Seed complete",
        users: results,
        credentials_note: "Password for all is 'password123'"
    });
}
