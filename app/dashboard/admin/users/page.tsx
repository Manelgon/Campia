import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination, TableToolbar } from "@/components/dashboard/table-controls";
import { UsersTable } from "./users-table";
import { NewUserButton } from "./NewUserButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function UsersPage({
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
        .from("profiles")
        .select("*", { count: "exact" })
        .neq("role", "guest"); // Exclude guests

    // Search Filter
    if (q) {
        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    // Sort
    query = query.order(sort, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    const { data: users, count } = await query;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/admin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
                        <p className="text-muted-foreground">Administración de personal y permisos.</p>
                    </div>
                    <NewUserButton />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usuarios del Sistema ({count})</CardTitle>
                    <CardDescription>
                        {q ? `Resultados de búsqueda: "${q}"` : "Personal con acceso al sistema."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TableToolbar searchPlaceholder="Buscar usuario (nombre, email...)" />

                    <UsersTable users={users || []} />

                    <TablePagination total={count || 0} limit={limit} page={page} />
                </CardContent>
            </Card>
        </div>
    );
}
