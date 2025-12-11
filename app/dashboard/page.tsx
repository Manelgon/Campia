import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Home, Wrench, Users, DollarSign } from "lucide-react";

// Placeholder stats - in real app fetch from DB
const stats = [
    {
        title: "Ocupación Actual",
        value: "75%",
        description: "45/60 Unidades",
        icon: Home,
        color: "text-blue-600",
    },
    {
        title: "Llegadas hoy",
        value: "5",
        description: "3 Check-ins pendientes",
        icon: CalendarDays,
        color: "text-green-600",
    },
    {
        title: "Ingresos (Mes)",
        value: "€12,450",
        description: "+15% vs mes anterior",
        icon: DollarSign,
        color: "text-amber-600",
    },
    {
        title: "Incidencias",
        value: "3",
        description: "1 Crítica",
        icon: Wrench,
        color: "text-red-600",
    },
];

export default function DashboardPage() {
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
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Ocupación Semanal</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50 rounded-md border border-dashed">
                            Gráfico de Ocupación (Placeholder)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Nueva Reserva</p>
                                    <p className="text-sm text-muted-foreground">Juan Pérez - Parcela 101</p>
                                </div>
                                <div className="ml-auto font-medium text-sm text-muted-foreground">Hace 2m</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Check-out completado</p>
                                    <p className="text-sm text-muted-foreground">Familia García - Bungalow A1</p>
                                </div>
                                <div className="ml-auto font-medium text-sm text-muted-foreground">Hace 15m</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
