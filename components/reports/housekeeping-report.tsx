"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHousekeepingAdvancedStats } from "@/app/dashboard/reports/actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Sparkles, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface HousekeepingReportProps {
    dateRange: { from: Date; to: Date };
}

export function HousekeepingReport({ dateRange }: HousekeepingReportProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            const data = await getHousekeepingAdvancedStats(dateRange);
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

    const completedPercentage = stats.totalTasks > 0
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTasks}</div>
                        <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedPercentage}%</div>
                        <p className="text-xs text-muted-foreground">{stats.completedTasks} de {stats.totalTasks}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tiempo Medio Limpieza</CardTitle>
                        <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgCleaningHours.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">Desde creación a finalización</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                        <p className="text-xs text-muted-foreground">Abiertas o en progreso</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Tareas por Personal de Limpieza</CardTitle>
                    <CardDescription>Distribución de carga de trabajo</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.tasksByStaff}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#f97316" name="Total Asignadas" />
                            <Bar dataKey="completed" fill="#22c55e" name="Completadas" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
