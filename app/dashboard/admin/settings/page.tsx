import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    let property = null;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("property_id")
            .eq("id", user.id)
            .single();

        if (profile?.property_id) {
            const { data: propertyData } = await supabase
                .from("properties")
                .select("*")
                .eq("id", profile.property_id)
                .single();

            property = propertyData;
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight">Configuración de Propiedad</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent>
                    <SettingsForm property={property} />
                </CardContent>
            </Card>
        </div>
    );
}
