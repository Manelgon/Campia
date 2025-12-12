import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function GuestMaintenancePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch Tickets reported by this user
    const { data: tickets } = await supabase
        .from("tickets") // or view_tickets_details if needed
        .select("*, units(name, type)")
        .eq("reported_by", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mis Incidencias</h2>
                    <p className="text-muted-foreground">Reportes de problemas y solicitudes.</p>
                </div>
                <Button asChild>
                    <Link href="/guest/maintenance/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
                    </Link>
                </Button>
            </div>

            <div className="space-y-4">
                {tickets?.length === 0 && (
                    <div className="text-center py-10 border rounded-lg bg-white">
                        <p className="text-muted-foreground">No tienes incidencias registradas.</p>
                    </div>
                )}
                {tickets?.map((ticket) => (
                    <Card key={ticket.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                                    <CardDescription>{(ticket.units as any)?.name} - {(ticket.units as any)?.type}</CardDescription>
                                </div>
                                <Badge variant={ticket.status === 'resolved' || ticket.status === 'closed' ? 'outline' : 'destructive'}>
                                    {ticket.status === 'open' ? 'Abierto' : ticket.status === 'in_progress' ? 'En Curso' : 'Resuelto'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-600 mb-2">
                                {ticket.description}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Prioridad: {ticket.priority}</span>
                                <span>{format(new Date(ticket.created_at), "d MMM, HH:mm", { locale: es })}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
