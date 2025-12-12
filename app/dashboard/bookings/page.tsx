import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingPagination, BookingToolbar } from "./booking-controls";
import { BookingTable } from "./booking-table";

export default async function BookingsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const params = await searchParams;
    const view = (params.view as string) || "active";
    const q = (params.q as string) || "";
    const limit = params.limit === "all" ? 1000 : parseInt((params.limit as string) || "10", 10);
    const sort = (params.sort as string) || "check_in_date";
    const order = (params.order as string) || "asc";
    const page = parseInt((params.page as string) || "1", 10);

    // Calc Range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Use the view for easier sorting/searching
    let query = supabase
        .from("view_bookings_details")
        .select("*", { count: "exact" });

    // Status Filter
    if (view === "history") {
        query = query.in("status", ["checked_out", "cancelled"]);
    } else {
        query = query.in("status", ["confirmed", "checked_in", "pending"]);
    }

    // Search Filter
    if (q) {
        // Search in enriched view columns
        query = query.or(`guest_name.ilike.%${q}%,guest_phone.ilike.%${q}%,guest_email.ilike.%${q}%`);
    }

    // Sort
    query = query.order(sort, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    const { data: bookings, count } = await query;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reservas</h2>
                    <p className="text-muted-foreground">Gestiona tus reservas activas e historial.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/bookings/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Reserva
                    </Link>
                </Button>
            </div>

            {/* Tabs & Controls */}
            <Tabs defaultValue={view === "history" ? "history" : "active"} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active" asChild>
                        <Link href="/dashboard/bookings?view=active">Activas y Futuras</Link>
                    </TabsTrigger>
                    <TabsTrigger value="history" asChild>
                        <Link href="/dashboard/bookings?view=history">Historial</Link>
                    </TabsTrigger>
                </TabsList>

                <BookingToolbar />

                <TabsContent value="active" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reservas Activas ({count})</CardTitle>
                            <CardDescription>
                                {q ? `Resultados de búsqueda: "${q}"` : "Reservas actuales y futuras."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BookingTable bookings={bookings || []} isHistory={false} />
                            <BookingPagination total={count || 0} limit={limit} page={page} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial ({count})</CardTitle>
                            <CardDescription>
                                {q ? `Resultados de búsqueda: "${q}"` : "Reservas pasadas."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BookingTable bookings={bookings || []} isHistory={true} />
                            <BookingPagination total={count || 0} limit={limit} page={page} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
