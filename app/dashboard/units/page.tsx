import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination, TableToolbar } from "@/components/dashboard/table-controls";
import { UnitTable } from "./unit-table";

export default async function UnitsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const params = await searchParams;

    // Params
    const q = (params.q as string) || "";
    const limit = params.limit === "all" ? 1000 : parseInt((params.limit as string) || "10", 10);
    const sort = (params.sort as string) || "name";
    const order = (params.order as string) || "asc";
    const page = parseInt((params.page as string) || "1", 10);

    // Calc Range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("units")
        .select("*", { count: "exact" });

    // Search Filter
    if (q) {
        query = query.or(`name.ilike.%${q}%,type.ilike.%${q}%`);
    }

    // Sort
    query = query.order(sort, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    const { data: units, count } = await query;

    // Fetch active custom prices for today (for Client Side calc)
    const today = new Date().toISOString().split('T')[0];
    const { data: customPrices } = await supabase
        .from("custom_prices")
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">
                    Alojamientos
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({count} unidades)
                    </span>
                </h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estado de Unidades</CardTitle>
                    <CardDescription>
                        {q ? `Resultados: "${q}"` : "Gestión de alojamientos y tarifas."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TableToolbar searchPlaceholder="Buscar unidad..." />

                    <UnitTable units={units || []} customPrices={customPrices || []} />

                    <TablePagination total={count || 0} limit={limit} page={page} />
                </CardContent>
            </Card>
        </div>
    );
}
