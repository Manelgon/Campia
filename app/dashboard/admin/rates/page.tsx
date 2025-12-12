import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RateForm } from "./rate-form";
import { RateDeleteButton } from "./rate-delete-button";

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

    // Fetch units for the form
    const { data: units } = await supabase.from("units").select("id, name, type");

    // Get unique types
    const unitTypes = Array.from(new Set(units?.map(u => u.type) || []));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestión de Tarifas</h2>
                <p className="text-muted-foreground">Define precios variables por temporada, día o tipo de unidad.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Form Section */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Nueva Tarifa</CardTitle>
                        <CardDescription>Añadir una excepción de precio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RateForm units={units || []} unitTypes={unitTypes} />
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Tarifas Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {fetchError && (
                                <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                                    Error cargando tarifas: {fetchError.message}
                                </div>
                            )}
                            {rates?.length === 0 && !fetchError && <p className="text-muted-foreground">No hay tarifas personalizadas.</p>}

                            {rates?.map((rate) => (
                                <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <p className="font-medium">
                                            {rate.unit_id
                                                ? `Unidad: ${rate.units?.name}`
                                                : `Tipo: ${rate.unit_type}`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Del {new Date(rate.start_date).toLocaleDateString()} al {new Date(rate.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-bold">€{rate.price}</span>
                                        <RateDeleteButton rateId={rate.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
