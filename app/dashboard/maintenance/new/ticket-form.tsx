"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTicketAction } from "../actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Need Textarea component, will create or use Input
// Assuming Textarea component exists or use native textarea

import { useSearchParams } from "next/navigation";

export function TicketForm({ units }: { units: any[] }) {
    const searchParams = useSearchParams();
    const preselectedUnitId = searchParams.get("unitId");

    const [isLoading, setIsLoading] = useState(false);

    // Simple wrapper to handle loading state
    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        const res = await createTicketAction(formData);
        if (res?.error) {
            toast.error("Error al crear incidencia: " + res.error);
            setIsLoading(false);
        } else {
            toast.success("Incidencia creada correctamente");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reportar Incidencia</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título / Asunto</Label>
                        <Input id="title" name="title" placeholder="Ej. Grifo goteando" required disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Detalles sobre el problema..."
                            required
                            disabled={isLoading}
                        />
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
                                <option value="low">Baja</option>
                                <option value="medium" selected>Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unitId">Unidad Afectada (Opcional)</Label>
                            <select
                                id="unitId"
                                name="unitId"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isLoading}
                                defaultValue={preselectedUnitId || ""}
                            >
                                <option value="">- Ninguna / General -</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Incidencia
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
