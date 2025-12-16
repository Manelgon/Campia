import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOccupancyStats, getArrivalsStats, getGuestsStats, getRevenueStats, getCleaningStats, getTicketStats } from "./reports/actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OccupancyChart } from "@/components/dashboard/occupancy-chart";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";

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

    // 5. Total Guests Staying Today
    const { data: activeBookings } = await supabase
        .from("bookings")
        .select("guests_count")
        .lte("check_in_date", today)
        .gt("check_out_date", today)
        .neq("status", "cancelled"); // Include confirmed/checked_in

    const totalGuests = activeBookings?.reduce((sum, b) => sum + (b.guests_count || 0), 0) || 0;

    // 6. Open Cleaning Tasks
    const { count: openCleaning } = await supabase
        .from("housekeeping_tasks")
        .select("*", { count: 'exact', head: true })
        .neq("status", "completed");

    // 7. Activity Logs
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: activityLogs } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false });

    // 8. Weekly Stats
    const weeklyOccupancy = await getOccupancyStats("week");
    const weeklyArrivals = await getArrivalsStats("week");
    const weeklyGuests = await getGuestsStats("week");
    const weeklyRevenue = await getRevenueStats("week");
    const weeklyCleaning = await getCleaningStats("week");
    const weeklyTickets = await getTicketStats("week");

    // Transform for chart
    const occupancyData = weeklyOccupancy.map(d => ({
        dia: d.name,
        value: d.occupied
    }));

    const arrivalsData = weeklyArrivals.map(d => ({
        dia: d.name,
        value: d.total
    }));

    const guestData = weeklyGuests.map(d => ({
        dia: d.name,
        value: d.total
    }));

    const revenueData = weeklyRevenue.map(d => ({
        dia: d.name,
        value: d.total
    }));

    const cleaningData = weeklyCleaning.map(d => ({
        dia: d.name,
        value: d.total
    }));

    const ticketData = weeklyTickets.map(d => ({
        dia: d.name,
        value: d.total
    }));


    const stats = [
        {
            id: "occupancy",
            title: "Ocupación Actual",
            value: `${occupancyRate}%`,
            description: `${occupiedUnits}/${totalUnits} Unidades`,
            iconName: "home" as const,
            color: "text-blue-600",
        },
        {
            id: "arrivals",
            title: "Llegadas hoy",
            value: arrivalsToday?.toString() || "0",
            description: "Check-ins pendientes",
            iconName: "calendar" as const,
            color: "text-green-600",
        },
        {
            id: "guests",
            title: "Huéspedes Alojados",
            value: totalGuests.toString(),
            description: "Total personas (Hoy)",
            iconName: "users" as const,
            color: "text-indigo-600",
        },
        {
            id: "cleaning",
            title: "Limpiezas",
            value: openCleaning?.toString() || "0",
            description: "Tareas pendientes",
            iconName: "brush" as const,
            color: "text-pink-600",
        },
        {
            id: "revenue",
            title: "Ingresos (Mes)",
            value: `€${monthRevenue.toLocaleString()}`,
            description: "Facturación mensual",
            iconName: "dollar" as const,
            color: "text-amber-600",
        },
        {
            id: "tickets",
            title: "Incidencias",
            value: openTickets?.toString() || "0",
            description: "Abiertas",
            iconName: "wrench" as const,
            color: "text-red-600",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Resumen General</h2>
                <p className="text-muted-foreground">Bienvenido al sistema de gestión.</p>
            </div>

            <DashboardWidgets
                stats={stats}
                occupancyData={occupancyData}
                arrivalsData={arrivalsData}
                guestData={guestData}
                revenueData={revenueData}
                cleaningData={cleaningData}
                ticketData={ticketData}
            >
                <RecentActivity initialLogs={activityLogs || []} />
            </DashboardWidgets>
        </div>
    );
}
