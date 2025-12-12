"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGuestAction } from "../actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GuestForm() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        try {
            const res = await createGuestAction(formData);
            if (res?.error) {
                toast.error(res.error);
                setIsLoading(false);
            } else {
                toast.success("Cliente creado correctamente");
                router.push("/dashboard/guests");
            }
        } catch (e) {
            toast.error("Error inesperado");
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre Completo *</Label>
                            <Input id="fullName" name="fullName" required placeholder="Ej: Juan Pérez" disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="documentId">DNI / Pasaporte *</Label>
                            <Input id="documentId" name="documentId" required placeholder="12345678X" disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="juan@ejemplo.com" disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="+34 600 000 000" disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nationality">Nacionalidad</Label>
                            <Input id="nationality" name="nationality" placeholder="España" disabled={isLoading} />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Cliente
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
