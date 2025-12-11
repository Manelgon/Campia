"use client";

import { createGuestTicketAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function GuestTicketForm() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        const res = await createGuestTicketAction(formData);
        setIsLoading(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Tu incidencia ha sido enviada. Te contactaremos pronto.");
            // Reset form? native form reset happens if not prevented, but here we are using action
            // We can use ref to reset or just let it be.
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reportar Problema / Solicitud</CardTitle>
                <CardDescription>¿Hay algo mal en tu alojamiento? Dínoslo.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Asunto</Label>
                        <Input id="title" name="title" placeholder="Ej. No hay agua caliente" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" placeholder="Detalles..." required />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Reporte
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
