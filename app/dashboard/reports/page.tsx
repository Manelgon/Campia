import { getRevenueStats, getOccupancyStats, getKPIs } from "./actions";
import { RevenueChart, OccupancyChart } from "./charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Users, Activity } from "lucide-react";

export default async function ReportsPage() {
    const revenueData = await getRevenueStats();
    const occupancyData = await getOccupancyStats();
    const kpis = await getKPIs();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Reportes y Analytics</h2>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.checkedInCount}</div>
                        <p className="text-xs text-muted-foreground">Reservas activas hoy</p>
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
                        <CardTitle>Ingresos Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart data={revenueData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Ocupación (Últimos 30 días)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OccupancyChart data={occupancyData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
