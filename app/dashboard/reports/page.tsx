import { getRevenueStats, getOccupancyStats, getKPIs } from "./actions";
import { RevenueChart, OccupancyChart } from "./charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Users, Activity } from "lucide-react";
import { DateRangeFilter, DateRange } from "./date-range-filter";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
    const { range } = await searchParams;
    const currentRange = (range as DateRange) || "month";

    const revenueData = await getRevenueStats(currentRange);
    const occupancyData = await getOccupancyStats(currentRange);
    const kpis = await getKPIs();

    const titles = {
        today: { revenue: "Ingresos de Hoy", occupancy: "Ocupación de Hoy" },
        week: { revenue: "Ingresos Semanales", occupancy: "Ocupación Semanal" },
        month: { revenue: "Ingresos Mensuales", occupancy: "Ocupación Mensual" },
        year: { revenue: "Ingresos Anuales", occupancy: "Ocupación Anual" },
    }[currentRange];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Reportes y Analytics</h2>
                <DateRangeFilter />
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.occupiedCount}</div>
                        <p className="text-xs text-muted-foreground">Unidades ocupadas hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{kpis.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Año fiscal actual</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas Pendientes</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.pendingTickets}</div>
                        <p className="text-xs text-muted-foreground">Incidencias abiertas</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{titles?.revenue || "Ingresos"}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart data={revenueData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{titles?.occupancy || "Ocupación"}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OccupancyChart data={occupancyData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
