import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Building, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TaskDetailActions } from "@/components/dashboard/housekeeping/task-detail-actions";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = await params;

    // We use the view which already joins some data, but we might need profiles explicitly for the reporter if not in view.
    // However, view_housekeeping_details has assigned_to_name. 
    // Let's see if we need more.
    // The view has everything we usually need for the table. 
    // Let's fetch the task from the view for consistency.
    // Switch to direct query to avoid View caching/def issues
    const { data: task, error } = await supabase
        .from("housekeeping_tasks")
        .select(`
            *,
            unit:units(name),
            reporter:profiles!housekeeping_tasks_created_by_fkey(full_name, email, role),
            assignee:profiles!housekeeping_tasks_assigned_to_fkey(full_name)
        `)
        .eq("id", id)
        .single();

    if (error || !task) {
        console.error("Error fetching task:", error);
        return notFound();
    }

    const priorityColors = {
        low: "bg-blue-100 text-blue-800",
        medium: "bg-gray-100 text-gray-800",
        high: "bg-orange-100 text-orange-800",
        critical: "bg-red-100 text-red-800",
    };

    const statusColors = {
        open: "bg-yellow-100 text-yellow-800",
        in_progress: "bg-blue-100 text-blue-800",
        resolved: "bg-green-100 text-green-800",
    };

    // ... (Auth/Staff Fetching remains same)

    const { data: { user } } = await supabase.auth.getUser();
    let userRole = "guest";
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) userRole = profile.role;
    }

    let staffQuery = supabase.from("profiles").select("id, full_name, role");
    if (userRole !== "admin" && userRole !== "superadmin") {
        staffQuery = staffQuery.eq("role", "cleaning");
    }
    const { data: staff } = await staffQuery;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/housekeeping">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Detalle de Tarea</h1>
                        <p className="text-muted-foreground text-sm">ID: {task.id}</p>
                    </div>
                </div>

                <TaskDetailActions
                    taskId={task.id}
                    unitId={task.unit_id}
                    currentStatus={task.status}
                    currentAssigneeId={task.assigned_to}
                    userRole={userRole}
                    staffMembers={staff || []}
                />
            </div>

            <div className="flex flex-col gap-6">
                {/* Row 1: Details (Metadata) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles de la Tarea</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Unidad:</span>
                                <span className="font-medium">{task.unit?.name || "General"}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Prioridad:</span>
                                <div>
                                    <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}>
                                        {task.priority === "critical" ? "CRÍTICA" : task.priority === "high" ? "ALTA" : task.priority === "low" ? "BAJA" : "MEDIA"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Estado:</span>
                                <div>
                                    <Badge className={statusColors[task.status as keyof typeof statusColors] || "bg-gray-100"}>
                                        {task.status === 'in_progress' ? 'EN CURSO' : task.status === 'open' ? 'PENDIENTE' : 'COMPLETADA'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Reportado por:</span>
                                <div className="flex flex-col">
                                    {task.created_by && task.reporter ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{task.reporter.full_name || "Staff"}</span>
                                                {task.reporter.role && <Badge variant="secondary" className="text-[10px] h-5 px-1">{task.reporter.role}</Badge>}
                                            </div>
                                            {task.reporter.email && <span className="text-xs text-muted-foreground">{task.reporter.email}</span>}
                                        </>
                                    ) : (
                                        <span className="font-medium">Automático (Checkout)</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Asignado a:</span>
                                <span className="font-medium">{task.assignee?.full_name || "Sin asignar"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Row 2: Description/Notes, Photos */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">Notas de la Tarea</CardTitle>
                                <CardDescription className="mt-1">
                                    Creado el {format(new Date(task.created_at), "PPP 'a las' p", { locale: es })}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                                {task.notes || "Sin notas adicionales."}
                            </div>
                        </div>

                        {/* Photos - If `task` has photos field (it should from schema/view if joined) */}
                        {/* Checking view definition: view_housekeeping_details usually selects ht.* so it has photos if in table */}
                        {/* Assuming photos is an array of strings in JSONB */}
                        {task.photos && Array.isArray(task.photos) && task.photos.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Imágenes Adjuntas</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {task.photos.map((photo: string, index: number) => (
                                        <div key={index} className="aspect-square relative rounded-md overflow-hidden border group">
                                            <img
                                                src={photo}
                                                alt={`Evidencia ${index + 1}`}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
