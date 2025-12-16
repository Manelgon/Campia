"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMaintenanceAdvancedStats } from "@/app/dashboard/reports/actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Wrench, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface MaintenanceReportProps {
    dateRange: { from: Date; to: Date };
}

export function MaintenanceReport({ dateRange }: MaintenanceReportProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            const data = await getMaintenanceAdvancedStats(dateRange);
            setStats(data);
            setLoading(false);
        }
        fetchStats();
    }, [dateRange]);

    if (loading) {
        return <div className="text-muted-foreground">Cargando estadísticas...</div>;
    }

    if (!stats) {
        return <div className="text-muted-foreground">No hay datos disponibles</div>;
    }

    const resolvedPercentage = stats.totalTickets > 0
        ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
        : 0;

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTickets}</div>
                        <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Resueltos</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resolvedPercentage}%</div>
                        <p className="text-xs text-muted-foreground">{stats.resolvedTickets} de {stats.totalTickets}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tiempo Medio Resolución</CardTitle>
                        <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgResolutionHours.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">Desde creación a resolución</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tiempo Medio Respuesta</CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgResponseHours.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">Desde creación a inicio</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Tickets por Técnico</CardTitle>
                    <CardDescription>Distribución de carga de trabajo</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.ticketsByTech}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#f97316" name="Total Asignados" />
                            <Bar dataKey="resolved" fill="#22c55e" name="Resueltos" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
