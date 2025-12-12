"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTicketAction } from "@/app/dashboard/maintenance/actions"; // Reusing existing action which works if profile is set
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BookingUnit {
    unit_id: string;
    unit_name: string;
    unit_type: string;
}

export function GuestTicketForm({ units }: { units: BookingUnit[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        // Add priority default if not in form (Guests shouldn't usually set priority, maybe default to normal)
        formData.append("priority", "normal");

        try {
            const res = await createTicketAction(formData);
            if (res?.error) {
                toast.error(res.error);
                setIsLoading(false);
            } else {
                toast.success("Incidencia reportada correctamente");
                router.push("/guest/maintenance");
            }
        } catch (e) {
            toast.error("Error inesperado");
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalles de la Incidencia</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Asunto *</Label>
                        <Input id="title" name="title" required placeholder="Ej: Aire acondicionado no funciona" disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="unitId">Alojamiento *</Label>
                        <select
                            id="unitId"
                            name="unitId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            disabled={isLoading}
                        >
                            {units.map(u => (
                                <option key={u.unit_id} value={u.unit_id}>
                                    {u.unit_name} ({u.unit_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción *</Label>
                        <Textarea
                            id="description"
                            name="description"
                            required
                            placeholder="Describe el problema con detalle..."
                            className="min-h-[100px]"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Reporte
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
