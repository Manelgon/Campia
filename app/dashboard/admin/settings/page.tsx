import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
    const supabase = await createClient();

    // Hardcoded ID for MVP
    const propertyId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

    const { data: property } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

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
