import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Home, Wrench, Users, DollarSign } from "lucide-react";
import { getOccupancyStats } from "./reports/actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OccupancyChart } from "@/components/dashboard/occupancy-chart";

export default async function DashboardPage() {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // 1. Occupancy
    const { count: totalUnits } = await supabase.from("units").select("*", { count: 'exact', head: true });
    const { count: occupiedUnits } = await supabase.from("units").select("*", { count: 'exact', head: true }).eq("status", "occupied");
    const occupancyRate = totalUnits ? Math.round(((occupiedUnits || 0) / totalUnits) * 100) : 0;

    // 2. Arrivals Today
    const { count: arrivalsToday } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .eq("check_in_date", today)
        .eq("status", "confirmed");

    // 3. Revenue (Month)
    // Supabase sum requires rpc or loading data. Loading data for monthly sum might be heavy but OK for MVP.
    const { data: monthPayments } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", firstDayOfMonth)
        .eq("status", "completed");

    const monthRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // 4. Issues (Open Tickets)
    const { count: openTickets } = await supabase
        .from("tickets")
        .select("*", { count: 'exact', head: true })
        .eq("status", "open");

    // 5. Activity Logs (Server Fetch)
    // "Solo debe de mostrar los logs de 24h no mas"
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: activityLogs } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false });

    // 6. Weekly Occupancy for Chart
    const weeklyOccupancy = await getOccupancyStats("week");

    // Transform for chart (the helper returns {name, occupancy, ...} but chart expects {dia, total_reservas})
    // Actually getOccupancyStats returns {name, occupied, total...}. Chart expects {dia, total_reservas}. 
    // Adapting data:
    const chartData = weeklyOccupancy.map(d => ({
        dia: d.name,
        total_reservas: d.occupied
    }));

    const stats = [
        {
            title: "Ocupación Actual",
            value: `${occupancyRate}%`,
            description: `${occupiedUnits}/${totalUnits} Unidades`,
            icon: Home,
            color: "text-blue-600",
        },
        {
            title: "Llegadas hoy",
            value: arrivalsToday?.toString() || "0",
            description: "Check-ins pendientes",
            icon: CalendarDays,
            color: "text-green-600",
        },
        {
            title: "Ingresos (Mes)",
            value: `€${monthRevenue.toLocaleString()}`,
            description: "Facturación mensual",
            icon: DollarSign,
            color: "text-amber-600",
        },
        {
            title: "Incidencias",
            value: openTickets?.toString() || "0",
            description: "Abiertas",
            icon: Wrench,
            color: "text-red-600",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Resumen General</h2>
                <p className="text-muted-foreground">Bienvenido al sistema de gestión.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <OccupancyChart data={chartData} />
                </div>
                <div className="col-span-3">
                    <RecentActivity initialLogs={activityLogs || []} />
                </div>
            </div>
        </div>
    );
}
