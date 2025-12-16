import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TicketTable } from "./ticket-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination, TableToolbar } from "@/components/dashboard/table-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MaintenancePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const params = await searchParams;

    // Params
    const view = (params.view as string) || "active";
    const q = (params.q as string) || "";
    const limit = params.limit === "all" ? 1000 : parseInt((params.limit as string) || "10", 10);
    const sort = (params.sort as string) || "created_at";
    const order = (params.order as string) || "desc";
    const page = parseInt((params.page as string) || "1", 10);

    // Calc Range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("view_tickets_details")
        .select("*", { count: "exact" });

    // Status Filter using View
    if (view === "active") {
        query = query.in("status", ["open", "in_progress"]);
    } else if (view === "resolved") {
        query = query.in("status", ["resolved", "closed"]);
    }
    // view === 'all' -> no filter on status

    // Search
    if (q) {
        query = query.or(`title.ilike.%${q}%,unit_name.ilike.%${q}%,assigned_to_name.ilike.%${q}%`);
    }

    // Sort
    query = query.order(sort, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    const { data: tickets, count } = await query;

    // Check current user role to determine staff visibility
    const { data: { user } } = await supabase.auth.getUser();
    let userRole = "maintenance"; // Default fallback
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) userRole = profile.role;
    }

    let staffQuery = supabase.from("profiles").select("id, full_name, role");

    // If not admin/superadmin, restrict to maintenance staff
    if (userRole !== "admin" && userRole !== "superadmin") {
        staffQuery = staffQuery.eq("role", "maintenance");
    }

    const { data: staff } = await staffQuery;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mantenimiento e Incidencias</h2>
                    <p className="text-muted-foreground">Gestión de tickets y reparaciones.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/maintenance/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue={view} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all" asChild>
                        <Link href="/dashboard/maintenance?view=all">Todas</Link>
                    </TabsTrigger>
                    <TabsTrigger value="active" asChild>
                        <Link href="/dashboard/maintenance?view=active">Activas</Link>
                    </TabsTrigger>
                    <TabsTrigger value="resolved" asChild>
                        <Link href="/dashboard/maintenance?view=resolved">Resueltas</Link>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={view} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Listado de Incidencias ({count})</CardTitle>
                            <CardDescription>
                                {q ? `Resultados: "${q}"` :
                                    view === 'active' ? "Tickets abiertos y en progreso." :
                                        view === 'resolved' ? "Tickets resueltos y cerrados." :
                                            "Histórico completo de incidencias."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <TableToolbar searchPlaceholder="Buscar (título, unidad, personal)..." />

                            <TicketTable tickets={tickets || []} staff={staff || []} />

                            <TablePagination total={count || 0} limit={limit} page={page} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
