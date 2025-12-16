"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOccupancyAdvancedStats } from "@/app/dashboard/reports/actions";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { Users, Home, Calendar, TrendingDown } from "lucide-react";

interface OccupancyReportProps {
    dateRange: { from: Date; to: Date };
}

export function OccupancyReport({ dateRange }: OccupancyReportProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            const data = await getOccupancyAdvancedStats(dateRange);
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
                        <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Promedio en el período</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Vacancia</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.vacancyRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Unidades disponibles</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estancia Media</CardTitle>
                        <Calendar className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgLengthOfStay.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Noches promedio</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                        <Home className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUnits}</div>
                        <p className="text-xs text-muted-foreground">{stats.totalBookings} reservas activas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Occupancy Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Tendencia de Ocupación</CardTitle>
                    <CardDescription>Ocupación diaria en el período</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats.occupancyByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value, name) => {
                                    if (name === "occupancy") return [`${value}%`, "Ocupación"];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="occupancy"
                                stroke="#f97316"
                                fill="#f97316"
                                fillOpacity={0.3}
                                name="Ocupación (%)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Occupancy by Type */}
            {stats.occupancyByType && stats.occupancyByType.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ocupación por Tipo de Unidad</CardTitle>
                        <CardDescription>Distribución de ocupación por categoría</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.occupancyByType}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Legend />
                                <Bar dataKey="occupancy" fill="#22c55e" name="Ocupación (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
