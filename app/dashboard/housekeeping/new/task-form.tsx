"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTaskAction } from "../actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export function TaskForm({ units, staff }: { units: any[], staff: any[] }) {
    const searchParams = useSearchParams();
    const preselectedUnitId = searchParams.get("unitId");

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        const res = await createTaskAction(formData);
        if (res?.error) {
            toast.error("Error al crear tarea: " + res.error);
            setIsLoading(false);
        } else {
            toast.success("Tarea de limpieza creada correctamente");
            // Redirect is handled by action (or we can router.push)
            // Actions usually redirect, but let's wait a moment
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Nueva Tarea de Limpieza</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">

                    <div className="space-y-2">
                        <Label htmlFor="unitId">Unidad *</Label>
                        <select
                            id="unitId"
                            name="unitId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            disabled={isLoading}
                            defaultValue={preselectedUnitId || ""}
                        >
                            <option value="">- Seleccionar Unidad -</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <select
                                id="priority"
                                name="priority"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                disabled={isLoading}
                            >
                                <option value="normal" selected>Normal</option>
                                <option value="high">Alta</option>
                                <option value="low">Baja</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignedTo">Asignar a (Opcional)</Label>
                            <select
                                id="assignedTo"
                                name="assignedTo"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isLoading}
                            >
                                <option value="">- Sin asignar -</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas / Instrucciones</Label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ej. Limpieza a fondo por checkout..."
                            disabled={isLoading}
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Tarea
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
