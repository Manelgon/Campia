"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinancialAdvancedStats } from "@/app/dashboard/reports/actions";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Euro, TrendingUp, Percent, DollarSign } from "lucide-react";

interface FinancialReportProps {
    dateRange: { from: Date; to: Date };
}

export function FinancialReport({ dateRange }: FinancialReportProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            const data = await getFinancialAdvancedStats(dateRange);
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

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ADR</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats.adr.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Tarifa Diaria Promedio</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">RevPAR</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats.revPAR.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Ingreso por Habitación Disponible</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
                        <Percent className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Tasa de ocupación</p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">TRevPAR</CardTitle>
                        <Euro className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats.trevPAR.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Ingreso Total por Habitación Disponible</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reservas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBookings}</div>
                        <p className="text-xs text-muted-foreground">Total de reservas activas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Tendencia de Ingresos</CardTitle>
                    <CardDescription>Ingresos diarios en el período</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.revenueByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} name="Ingresos" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
