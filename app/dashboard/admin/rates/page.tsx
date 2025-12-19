import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RatesList } from "@/components/dashboard/rates/rates-list";
import { AddRateDialog } from "@/components/dashboard/rates/add-rate-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RatesPage() {
    const supabase = await createClient();

    // Fetch existing rates
    const { data: rates, error: fetchError } = await supabase
        .from("custom_prices")
        .select(`
            *,
            units (name)
        `)
        .order("created_at", { ascending: false });

    if (fetchError) {
        console.error("Error fetching rates:", fetchError);
    }

    // Fetch units for the form dialog
    const { data: units } = await supabase.from("units").select("id, name, type");

    // Get unique types
    const unitTypes = Array.from(new Set(units?.map(u => u.type) || []));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/admin">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Gestión de Tarifas</h2>
                        <p className="text-muted-foreground">Define precios variables por temporada, día o tipo de unidad.</p>
                    </div>
                </div>
                <div>
                    <AddRateDialog units={units || []} unitTypes={unitTypes} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Tarifas</CardTitle>
                </CardHeader>
                <CardContent>
                    {fetchError && (
                        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                            Error cargando tarifas: {fetchError.message}
                        </div>
                    )}
                    <RatesList rates={rates || []} />
                </CardContent>
            </Card>
        </div>
    );
}
