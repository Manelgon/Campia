import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TaskTable } from "./task-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination, TableToolbar } from "@/components/dashboard/table-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function HousekeepingPage({
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
        .from("view_housekeeping_details")
        .select("*", { count: "exact" });

    // Status Filter
    if (view === "active") {
        query = query.in("status", ["open", "in_progress"]);
    } else if (view === "resolved") {
        query = query.eq("status", "resolved");
    }

    // Search
    if (q) {
        query = query.or(`unit_name.ilike.%${q}%,notes.ilike.%${q}%,assigned_to_name.ilike.%${q}%`);
    }

    // Sort
    query = query.order(sort, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    const { data: tasks, count } = await query;

    // Check current user role to determine staff visibility
    const { data: { user } } = await supabase.auth.getUser();
    let userRole = "housekeeping";
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) userRole = profile.role;
    }

    let staffQuery = supabase.from("profiles").select("id, full_name, role");

    // If not admin/superadmin, restrict to cleaning staff
    if (userRole !== "admin" && userRole !== "superadmin") {
        staffQuery = staffQuery.eq("role", "cleaning");
    }

    const { data: staff } = await staffQuery;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Limpieza</h2>
                    <p className="text-muted-foreground">Gestión de tareas de limpieza.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/housekeeping/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue={view} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all" asChild>
                        <Link href="/dashboard/housekeeping?view=all">Todas</Link>
                    </TabsTrigger>
                    <TabsTrigger value="active" asChild>
                        <Link href="/dashboard/housekeeping?view=active">Activas</Link>
                    </TabsTrigger>
                    <TabsTrigger value="resolved" asChild>
                        <Link href="/dashboard/housekeeping?view=resolved">Resueltas</Link>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={view} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Listado de Tareas ({count})</CardTitle>
                            <CardDescription>
                                {q ? `Resultados: "${q}"` :
                                    view === 'active' ? "Tareas pendientes y en curso." :
                                        view === 'resolved' ? "Tareas completadas." :
                                            "Histórico completo de tareas."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <TableToolbar searchPlaceholder="Buscar (unidad, personal, notas)..." />

                            <TaskTable tasks={tasks || []} staff={staff || []} />

                            <TablePagination total={count || 0} limit={limit} page={page} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
