import { getGuestDashboardData } from "./actions";
import { GuestTicketForm } from "./ticket-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AlertCircle, Calendar, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function GuestDashboardPage() {
    const data = await getGuestDashboardData();

    if ('error' in data) {
        // Should acturally redirect to login?
        // But maybe let's show the error for debug
        return <div className="p-4 text-red-500">Error: {data.error}</div>;
    }

    const { guest, booking } = data;

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                <div className="bg-yellow-100 p-4 rounded-full">
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold">¡Hola, {guest.full_name}!</h1>
                <p className="text-gray-500">No encontramos una reserva activa para hoy.</p>
                <p className="text-sm text-gray-400">Si crees que es un error, contacta con recepción.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-800">Hola, {guest.full_name.split(' ')[0]} 👋</h1>
                <p className="text-gray-500">Bienvenido a CampIa. Aquí tienes los detalles de tu estancia.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Booking Info */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tu Alojamiento</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{booking.units?.name}</div>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{booking.units?.type}</p>
                    </CardContent>
                </Card>

                {/* Dates */}
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fechas</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col">
                            <div className="text-lg font-semibold">
                                {format(new Date(booking.check_in_date), "d MMM")} - {format(new Date(booking.check_out_date), "d MMM, yyyy")}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Check-out hasta las 11:00 AM</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / Incidents */}
            <div className="grid gap-6 md:grid-cols-2">
                <GuestTicketForm />

                {/* Rules / Wi-Fi Card could go here */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Útil</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium">Wi-Fi</span>
                            <span>CampIa_Guest</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium">Contraseña</span>
                            <span>happycamp2024</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="font-medium">Recepción</span>
                            <span>Ext. 9</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <form action={async () => {
                "use server";
                const supabase = await createClient();
                await supabase.auth.signOut();
                redirect("/guest/login");
            }}>
                <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </form>
        </div>
    );
}
