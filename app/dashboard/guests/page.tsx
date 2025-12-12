import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination, TableToolbar } from "@/components/dashboard/table-controls";
import { GuestTable } from "./guest-table";

export default async function GuestsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const params = await searchParams;

    // Params
    const q = (params.q as string) || "";
    const limit = params.limit === "all" ? 1000 : parseInt((params.limit as string) || "10", 10);
    const sort = (params.sort as string) || "created_at";
    const order = (params.order as string) || "desc";
    const page = parseInt((params.page as string) || "1", 10);

    // Calc Range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("guests")
        .select("*", { count: "exact" });

    // Search Filter
    if (q) {
        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,document_id.ilike.%${q}%`);
    }

    // Sort
    query = query.order(sort, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    const { data: guests, count } = await query;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
                    <p className="text-muted-foreground">Gestión de huéspedes y datos de contacto.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/guests/new">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Clientes ({count})</CardTitle>
                    <CardDescription>
                        {q ? `Resultados de búsqueda: "${q}"` : "Base de datos de huéspedes."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TableToolbar searchPlaceholder="Buscar cliente (nombre, email, tel...)" />

                    <GuestTable guests={guests || []} />

                    <TablePagination total={count || 0} limit={limit} page={page} />
                </CardContent>
            </Card>
        </div>
    );
}
